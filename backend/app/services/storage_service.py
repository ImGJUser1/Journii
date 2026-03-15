"""
S3/MinIO storage service with presigned URLs and CDN integration.
Supports multipart uploads for large files.
"""

import boto3
from botocore.config import Config as BotoConfig
from botocore.exceptions import ClientError
from typing import Optional, Dict, Any, Tuple
import uuid
import mimetypes
from datetime import datetime, timedelta
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)


class StorageService:
    """
    Abstraction over S3-compatible storage.
    Supports AWS S3, MinIO, DigitalOcean Spaces, etc.
    """
    
    def __init__(self):
        self._client = None
        self._resource = None
    
    @property
    def client(self):
        """Lazy initialization of S3 client"""
        if self._client is None:
            self._client = boto3.client(
                's3',
                **settings.s3_config,
                config=BotoConfig(
                    retries={'max_attempts': 3, 'mode': 'standard'},
                    connect_timeout=10,
                    read_timeout=30,
                )
            )
        return self._client
    
    @property
    def resource(self):
        """Lazy initialization of S3 resource"""
        if self._resource is None:
            self._resource = boto3.resource(
                's3',
                **settings.s3_config
            )
        return self._resource
    
    def generate_key(
        self,
        user_id: str,
        media_type: str,
        filename: str
    ) -> str:
        """
        Generate organized S3 key path.
        Format: {media_type}/{year}/{month}/{user_id}/{uuid}_{filename}
        """
        now = datetime.utcnow()
        file_uuid = str(uuid.uuid4())[:8]
        safe_filename = filename.replace(' ', '_').lower()
        
        key = (
            f"{media_type}s/"  # images/, videos/, audio/
            f"{now.year}/"
            f"{now.month:02d}/"
            f"{user_id}/"
            f"{file_uuid}_{safe_filename}"
        )
        return key
    
    def get_content_type(self, filename: str) -> str:
        """Guess content type from filename"""
        content_type, _ = mimetypes.guess_type(filename)
        return content_type or 'application/octet-stream'
    
    async def generate_presigned_upload_url(
        self,
        key: str,
        content_type: str,
        content_length: Optional[int] = None,
        expires_in: int = 300
    ) -> Dict[str, Any]:
        """
        Generate presigned URL for direct browser upload to S3.
        Returns PUT URL (recommended) or POST fields.
        """
        try:
            # Generate presigned PUT URL (simpler for client)
            url = self.client.generate_presigned_url(
                'put_object',
                Params={
                    'Bucket': settings.S3_BUCKET_NAME,
                    'Key': key,
                    'ContentType': content_type,
                    # Add metadata for processing trigger
                    'Metadata': {
                        'upload-timestamp': datetime.utcnow().isoformat()
                    }
                },
                ExpiresIn=expires_in
            )
            
            return {
                'url': url,
                'method': 'PUT',
                'headers': {
                    'Content-Type': content_type
                },
                'expires_in': expires_in
            }
            
        except ClientError as e:
            logger.error(f"Failed to generate presigned URL: {e}")
            raise
    
    async def generate_presigned_download_url(
        self,
        key: str,
        expires_in: int = 3600,
        inline: bool = False
    ) -> str:
        """
        Generate temporary download URL.
        For permanent URLs, use CloudFront/CDN.
        """
        try:
            params = {
                'Bucket': settings.S3_BUCKET_NAME,
                'Key': key,
            }
            
            if not inline:
                params['ResponseContentDisposition'] = 'attachment'
            
            url = self.client.generate_presigned_url(
                'get_object',
                Params=params,
                ExpiresIn=expires_in
            )
            return url
            
        except ClientError as e:
            logger.error(f"Failed to generate download URL: {e}")
            raise
    
    def get_cdn_url(self, key: str) -> Optional[str]:
        """
        Get CloudFront/CDN URL for public access.
        Returns None if CDN not configured.
        """
        if settings.CLOUDFRONT_DOMAIN:
            return f"https://{settings.CLOUDFRONT_DOMAIN}/{key}"
        
        # Fallback to S3 direct URL
        if settings.S3_ENDPOINT_URL:
            # MinIO style
            return f"{settings.S3_ENDPOINT_URL}/{settings.S3_BUCKET_NAME}/{key}"
        
        # AWS S3 style
        return f"https://{settings.S3_BUCKET_NAME}.s3.{settings.AWS_REGION}.amazonaws.com/{key}"
    
    async def delete_file(self, key: str) -> bool:
        """Delete file from S3"""
        try:
            self.client.delete_object(
                Bucket=settings.S3_BUCKET_NAME,
                Key=key
            )
            logger.info(f"Deleted S3 object: {key}")
            return True
        except ClientError as e:
            logger.error(f"Failed to delete S3 object {key}: {e}")
            return False
    
    async def copy_file(self, source_key: str, dest_key: str) -> bool:
        """Copy file within bucket"""
        try:
            copy_source = {
                'Bucket': settings.S3_BUCKET_NAME,
                'Key': source_key
            }
            self.client.copy(
                copy_source,
                settings.S3_BUCKET_NAME,
                dest_key
            )
            return True
        except ClientError as e:
            logger.error(f"Failed to copy {source_key} to {dest_key}: {e}")
            return False
    
    async def get_file_info(self, key: str) -> Optional[Dict[str, Any]]:
        """Get file metadata from S3"""
        try:
            response = self.client.head_object(
                Bucket=settings.S3_BUCKET_NAME,
                Key=key
            )
            return {
                'size': response['ContentLength'],
                'content_type': response['ContentType'],
                'last_modified': response['LastModified'],
                'metadata': response.get('Metadata', {})
            }
        except ClientError as e:
            if e.response['Error']['Code'] == '404':
                return None
            raise
    
    async def initiate_multipart_upload(
        self,
        key: str,
        content_type: str
    ) -> str:
        """Start multipart upload for large files"""
        response = self.client.create_multipart_upload(
            Bucket=settings.S3_BUCKET_NAME,
            Key=key,
            ContentType=content_type
        )
        return response['UploadId']
    
    async def generate_multipart_presigned_urls(
        self,
        key: str,
        upload_id: str,
        part_numbers: int,
        expires_in: int = 300
    ) -> list:
        """Generate presigned URLs for each part"""
        urls = []
        for part_num in range(1, part_numbers + 1):
            url = self.client.generate_presigned_url(
                'upload_part',
                Params={
                    'Bucket': settings.S3_BUCKET_NAME,
                    'Key': key,
                    'UploadId': upload_id,
                    'PartNumber': part_num
                },
                ExpiresIn=expires_in
            )
            urls.append({
                'part_number': part_num,
                'url': url
            })
        return urls
    
    async def complete_multipart_upload(
        self,
        key: str,
        upload_id: str,
        parts: list
    ):
        """Complete multipart upload"""
        self.client.complete_multipart_upload(
            Bucket=settings.S3_BUCKET_NAME,
            Key=key,
            UploadId=upload_id,
            MultipartUpload={'Parts': parts}
        )


# Singleton instance
storage_service = StorageService()