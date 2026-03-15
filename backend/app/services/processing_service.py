"""
Media processing service using FFmpeg and AI.
Handles thumbnails, transcoding, and metadata extraction.
"""

import asyncio
import subprocess
import json
import tempfile
import os
from typing import Optional, Dict, Any, Tuple
from pathlib import Path
import logging

import httpx

from app.core.config import settings
from app.services.storage_service import storage_service

logger = logging.getLogger(__name__)


class ProcessingService:
    """
    Process media files: generate thumbnails, extract metadata,
    create video variants, and run AI analysis.
    """
    
    def __init__(self):
        self.http_client = httpx.AsyncClient(timeout=60.0)
    
    async def __aenter__(self):
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.http_client.aclose()
    
    async def download_to_temp(self, s3_key: str) -> str:
        """Download file from S3 to temporary location"""
        # Generate presigned URL
        url = await storage_service.generate_presigned_download_url(
            s3_key,
            expires_in=300
        )
        
        # Download to temp file
        temp_file = tempfile.NamedTemporaryFile(delete=False)
        
        async with self.http_client.stream('GET', url) as response:
            async for chunk in response.aiter_bytes():
                temp_file.write(chunk)
        
        temp_file.close()
        return temp_file.name
    
    async def extract_video_metadata(self, file_path: str) -> Dict[str, Any]:
        """
        Extract video metadata using FFprobe.
        """
        cmd = [
            'ffprobe',
            '-v', 'quiet',
            '-print_format', 'json',
            '-show_format',
            '-show_streams',
            file_path
        ]
        
        try:
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=30
            )
            
            data = json.loads(result.stdout)
            
            # Extract relevant info
            video_stream = next(
                (s for s in data['streams'] if s['codec_type'] == 'video'),
                None
            )
            audio_stream = next(
                (s for s in data['streams'] if s['codec_type'] == 'audio'),
                None
            )
            
            metadata = {
                'duration_seconds': float(data['format'].get('duration', 0)),
                'file_size_bytes': int(data['format'].get('size', 0)),
                'bitrate': int(data['format'].get('bit_rate', 0)),
            }
            
            if video_stream:
                metadata.update({
                    'width': int(video_stream.get('width', 0)),
                    'height': int(video_stream.get('height', 0)),
                    'codec': video_stream.get('codec_name'),
                    'fps': eval(video_stream.get('r_frame_rate', '0/1')),  # "30/1" -> 30
                })
            
            if audio_stream:
                metadata['audio_codec'] = audio_stream.get('codec_name')
            
            return metadata
            
        except Exception as e:
            logger.error(f"FFprobe failed: {e}")
            return {}
    
    async def generate_video_thumbnail(
        self,
        video_path: str,
        output_path: str,
        time_offset: float = None,
        width: int = None,
        height: int = None
    ) -> str:
        """
        Generate thumbnail from video at specific time.
        Default: 1 second in or 25% through video.
        """
        # Get duration if time_offset not specified
        if time_offset is None:
            metadata = await self.extract_video_metadata(video_path)
            duration = metadata.get('duration_seconds', 0)
            time_offset = min(1.0, duration * 0.25)
        
        width = width or settings.THUMBNAIL_WIDTH
        height = height or settings.THUMBNAIL_HEIGHT
        
        cmd = [
            'ffmpeg',
            '-i', video_path,
            '-ss', str(time_offset),
            '-vframes', '1',
            '-vf', f'scale={width}:{height}:force_original_aspect_ratio=decrease,pad={width}:{height}:(ow-iw)/2:(oh-ih)/2:black',
            '-q:v', '2',
            '-y',  # Overwrite output
            output_path
        ]
        
        try:
            subprocess.run(cmd, check=True, capture_output=True, timeout=30)
            return output_path
        except subprocess.CalledProcessError as e:
            logger.error(f"FFmpeg thumbnail failed: {e.stderr.decode()}")
            raise
    
    async def transcode_video(
        self,
        input_path: str,
        output_path: str,
        resolution: str = "720p",
        codec: str = "h264"
    ) -> str:
        """
        Transcode video to standard format.
        Resolutions: 360p, 480p, 720p, 1080p
        """
        resolution_map = {
            "360p": "640:360",
            "480p": "854:480",
            "720p": "1280:720",
            "1080p": "1920:1080"
        }
        
        scale = resolution_map.get(resolution, "1280:720")
        
        cmd = [
            'ffmpeg',
            '-i', input_path,
            '-vf', f'scale={scale}',
            '-c:v', 'libx264',
            '-preset', 'fast',
            '-crf', '23',
            '-c:a', 'aac',
            '-b:a', '128k',
            '-movflags', '+faststart',  # Web optimization
            '-y',
            output_path
        ]
        
        try:
            subprocess.run(cmd, check=True, capture_output=True, timeout=300)
            return output_path
        except subprocess.CalledProcessError as e:
            logger.error(f"FFmpeg transcode failed: {e.stderr.decode()}")
            raise
    
    async def process_image(
        self,
        image_path: str,
        output_path: str,
        width: int = None,
        height: int = None,
        quality: int = 85
    ) -> str:
        """
        Process image: resize, optimize.
        Uses ImageMagick or Pillow as fallback.
        """
        width = width or settings.THUMBNAIL_WIDTH
        height = height or settings.THUMBNAIL_HEIGHT
        
        # Try ImageMagick first
        cmd = [
            'convert',
            image_path,
            '-resize', f'{width}x{height}^',
            '-gravity', 'center',
            '-extent', f'{width}x{height}',
            '-quality', str(quality),
            '-strip',  # Remove metadata
            output_path
        ]
        
        try:
            subprocess.run(cmd, check=True, capture_output=True, timeout=30)
            return output_path
        except (subprocess.CalledProcessError, FileNotFoundError):
            # Fallback to Python PIL
            from PIL import Image
            
            with Image.open(image_path) as img:
                # Convert to RGB if necessary
                if img.mode in ('RGBA', 'P'):
                    img = img.convert('RGB')
                
                # Resize with crop to aspect ratio
                img.thumbnail((width, height), Image.Resampling.LANCZOS)
                
                # Create new image with exact size
                new_img = Image.new('RGB', (width, height), (0, 0, 0))
                offset = ((width - img.width) // 2, (height - img.height) // 2)
                new_img.paste(img, offset)
                
                new_img.save(output_path, 'JPEG', quality=quality, optimize=True)
                return output_path
    
    async def upload_processed_file(
        self,
        local_path: str,
        s3_key: str,
        content_type: str
    ) -> str:
        """Upload processed file back to S3"""
        with open(local_path, 'rb') as f:
            storage_service.client.upload_fileobj(
                f,
                settings.S3_BUCKET_NAME,
                s3_key,
                ExtraArgs={
                    'ContentType': content_type,
                    'CacheControl': 'max-age=31536000'  # 1 year cache
                }
            )
        
        return storage_service.get_cdn_url(s3_key)
    
    async def process_media(
        self,
        s3_key: str,
        media_type: str,
        media_id: str
    ) -> Dict[str, Any]:
        """
        Main processing pipeline.
        Downloads, processes, uploads variants, returns metadata.
        """
        temp_files = []
        
        try:
            # Download from S3
            local_path = await self.download_to_temp(s3_key)
            temp_files.append(local_path)
            
            results = {
                'thumbnails': {},
                'variants': {},
                'metadata': {}
            }
            
            if media_type == 'video':
                # Extract metadata
                metadata = await self.extract_video_metadata(local_path)
                results['metadata'] = metadata
                
                # Generate thumbnail
                thumb_path = local_path + '_thumb.jpg'
                await self.generate_video_thumbnail(local_path, thumb_path)
                temp_files.append(thumb_path)
                
                # Upload thumbnail
                thumb_key = s3_key.replace('.', '_thumb.')
                thumb_url = await self.upload_processed_file(
                    thumb_path, thumb_key, 'image/jpeg'
                )
                results['thumbnails']['default'] = thumb_url
                
                # Generate preview/poster (higher quality)
                preview_path = local_path + '_preview.jpg'
                await self.generate_video_thumbnail(
                    local_path, preview_path, width=1920, height=1080
                )
                temp_files.append(preview_path)
                
                preview_key = s3_key.replace('.', '_preview.')
                preview_url = await self.upload_processed_file(
                    preview_path, preview_key, 'image/jpeg'
                )
                results['thumbnails']['preview'] = preview_url
                
                # TODO: Create video variants (360p, 720p) for adaptive streaming
                
            elif media_type == 'image':
                # Get image metadata
                from PIL import Image
                with Image.open(local_path) as img:
                    results['metadata'] = {
                        'width': img.width,
                        'height': img.height,
                        'format': img.format
                    }
                
                # Generate thumbnail
                thumb_path = local_path + '_thumb.jpg'
                await self.process_image(local_path, thumb_path)
                temp_files.append(thumb_path)
                
                thumb_key = s3_key.replace('.', '_thumb.')
                thumb_url = await self.upload_processed_file(
                    thumb_path, thumb_key, 'image/jpeg'
                )
                results['thumbnails']['default'] = thumb_url
                
                # Generate optimized full-size
                opt_path = local_path + '_optimized.jpg'
                await self.process_image(
                    local_path, opt_path,
                    width=1920, height=1920,  # Max dimension
                    quality=90
                )
                temp_files.append(opt_path)
                
                opt_key = s3_key.replace('.', '_optimized.')
                opt_url = await self.upload_processed_file(
                    opt_path, opt_key, 'image/jpeg'
                )
                results['variants']['optimized'] = opt_url
            
            return results
            
        finally:
            # Cleanup temp files
            for f in temp_files:
                try:
                    os.unlink(f)
                except:
                    pass


# Singleton
processing_service = ProcessingService()