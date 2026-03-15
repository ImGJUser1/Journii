"""
High-level media service coordinating uploads, processing, and database.
"""

from typing import Optional, Dict, Any, List
from uuid import UUID
import logging

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, func
from fastapi import HTTPException, status

from app.models.media import MediaFile, MediaType, MediaStatus, ProcessingStatus
from app.schemas.media import UploadRequest, MediaFileResponse, ReelCreateRequest, ReelResponse
from app.services.base_service import BaseService
from app.services.storage_service import storage_service
from app.services.processing_service import processing_service
from app.db.redis import Cache

logger = logging.getLogger(__name__)


class MediaService(BaseService[MediaFile]):
    """
    Main service for media operations.
    """
    model = MediaFile
    
    def __init__(self, db: AsyncSession):
        super().__init__(db)
        self.storage = storage_service
        self.processor = processing_service
    
    async def initiate_upload(
        self,
        user_id: UUID,
        request: UploadRequest
    ) -> Dict[str, Any]:
        """
        Start upload process: create DB record, generate presigned URL.
        """
        # Validate file type
        allowed_types = (
            settings.ALLOWED_IMAGE_TYPES + 
            settings.ALLOWED_VIDEO_TYPES + 
            settings.ALLOWED_AUDIO_TYPES
        )
        
        if request.media_type.value == "image":
            allowed = settings.ALLOWED_IMAGE_TYPES
        elif request.media_type.value == "video":
            allowed = settings.ALLOWED_VIDEO_TYPES
            if request.duration_seconds and request.duration_seconds > settings.VIDEO_MAX_DURATION_SECONDS:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Video exceeds max duration of {settings.VIDEO_MAX_DURATION_SECONDS}s"
                )
        else:
            allowed = settings.ALLOWED_AUDIO_TYPES
        
        mime_type = self.storage.get_content_type(request.filename)
        if mime_type not in allowed:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File type {mime_type} not allowed for {request.media_type.value}"
            )
        
        # Generate S3 key
        s3_key = self.storage.generate_key(
            str(user_id),
            request.media_type.value,
            request.filename
        )
        
        # Create DB record
        media_data = {
            'user_id': user_id,
            'original_filename': request.filename,
            'storage_key': s3_key,
            'file_url': self.storage.get_cdn_url(s3_key),
            'media_type': request.media_type,
            'mime_type': mime_type,
            'file_size_bytes': request.file_size_bytes,
            'duration_seconds': request.duration_seconds,
            'width': request.width,
            'height': request.height,
            'location_name': request.location.name if request.location else None,
            'location_coords': {
                'lat': request.location.lat,
                'lng': request.location.lng
            } if request.location else None,
            'place_id': request.location.place_id if request.location else None,
            'status': MediaStatus.UPLOADING
        }
        
        media = await self.create(media_data)
        
        # Generate presigned URL
        upload_info = await self.storage.generate_presigned_upload_url(
            key=s3_key,
            content_type=mime_type,
            content_length=request.file_size_bytes
        )
        
        return {
            'media_id': media.id,
            'upload_url': upload_info['url'],
            'upload_method': upload_info['method'],
            'headers': upload_info['headers'],
            'expires_in_seconds': upload_info['expires_in'],
            'cdn_url': media.file_url
        }
    
    async def confirm_upload(self, media_id: UUID, user_id: UUID) -> MediaFile:
        """
        Called by client after successful S3 upload.
        Triggers processing pipeline.
        """
        media = await self.get_by_id(media_id)
        
        if not media or media.user_id != user_id:
            raise HTTPException(status_code=404, detail="Media not found")
        
        if media.status != MediaStatus.UPLOADING:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid status: {media.status}"
            )
        
        # Verify file exists in S3
        file_info = await self.storage.get_file_info(media.storage_key)
        if not file_info:
            raise HTTPException(
                status_code=400,
                detail="File not found in storage"
            )
        
        # Update status to processing
        media.status = MediaStatus.PROCESSING
        media.processing_status = ProcessingStatus.IN_PROGRESS
        await self.db.flush()
        
        # Trigger async processing (in production, use Celery)
        # For now, we'll process synchronously but this should be background task
        asyncio.create_task(self._process_media_async(media_id))
        
        return media
    
    async def _process_media_async(self, media_id: UUID):
        """
        Background processing task.
        In production, this runs in Celery worker.
        """
        async with get_db_context() as db:
            service = MediaService(db)
            
            try:
                media = await service.get_by_id(media_id)
                if not media:
                    return
                
                # Process file
                async with processing_service as processor:
                    results = await processor.process_media(
                        media.storage_key,
                        media.media_type.value,
                        str(media_id)
                    )
                
                # Update media record
                update_data = {
                    'status': MediaStatus.READY,
                    'processing_status': ProcessingStatus.COMPLETED,
                    'thumbnail_url': results['thumbnails'].get('default'),
                    'preview_url': results['thumbnails'].get('preview'),
                    'width': results['metadata'].get('width', media.width),
                    'height': results['metadata'].get('height', media.height),
                    'duration_seconds': results['metadata'].get('duration_seconds', media.duration_seconds),
                    'bitrate': results['metadata'].get('bitrate')
                }
                
                await db.execute(
                    update(MediaFile)
                    .where(MediaFile.id == media_id)
                    .values(**update_data)
                )
                
                # TODO: Trigger AI analysis (separate async task)
                
                logger.info(f"Media {media_id} processed successfully")
                
            except Exception as e:
                logger.error(f"Media processing failed for {media_id}: {e}")
                await db.execute(
                    update(MediaFile)
                    .where(MediaFile.id == media_id)
                    .values(
                        status=MediaStatus.FAILED,
                        processing_status=ProcessingStatus.FAILED,
                        processing_error=str(e)
                    )
                )
    
    async def get_media(self, media_id: UUID, user_id: Optional[UUID] = None) -> MediaFile:
        """Get media with access check"""
        media = await self.get_by_id_or_404(media_id)
        
        # Check access (owner or public)
        if media.user_id != user_id and media.status != MediaStatus.READY:
            raise HTTPException(status_code=404, detail="Media not found")
        
        # Increment view count (async)
        asyncio.create_task(self._increment_view_count(media_id))
        
        return media
    
    async def _increment_view_count(self, media_id: UUID):
        """Increment view count in background"""
        try:
            await self.db.execute(
                update(MediaFile)
                .where(MediaFile.id == media_id)
                .values(view_count=MediaFile.view_count + 1)
            )
        except Exception as e:
            logger.error(f"Failed to increment view count: {e}")
    
    async def delete_media(self, media_id: UUID, user_id: UUID, soft: bool = True) -> bool:
        """Delete media and optionally remove from S3"""
        media = await self.get_by_id_or_404(media_id)
        
        if media.user_id != user_id:
            raise HTTPException(status_code=403, detail="Not authorized")
        
        # Delete from S3 if hard delete
        if not soft:
            await self.storage.delete_file(media.storage_key)
            if media.thumbnail_url:
                # Extract key from URL and delete
                pass
        
        return await self.delete(media_id, soft=soft)


# Import at bottom to avoid circular imports
from app.db.session import get_db_context
import asyncio
from app.core.config import settings