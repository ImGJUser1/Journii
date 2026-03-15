"""
Schemas for media upload, processing, and retrieval.
"""

from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any, Union
from datetime import datetime
from uuid import UUID
from enum import Enum

from app.schemas.common import LocationSchema, MediaURLSchema, AIAnalysisSchema, PaginatedResponse


class MediaType(str, Enum):
    IMAGE = "image"
    VIDEO = "video"
    AUDIO = "audio"


class UploadRequest(BaseModel):
    """Request to initiate an upload"""
    filename: str = Field(..., min_length=1, max_length=255)
    media_type: MediaType
    file_size_bytes: int = Field(..., gt=0, le=500_000_000)  # Max 500MB
    duration_seconds: Optional[float] = Field(None, gt=0)
    width: Optional[int] = Field(None, gt=0)
    height: Optional[int] = Field(None, gt=0)
    location: Optional[LocationSchema] = None
    metadata: Optional[Dict[str, Any]] = None


class UploadResponse(BaseModel):
    """Response with presigned URL for direct S3 upload"""
    media_id: UUID
    upload_url: str  # Presigned S3 URL
    upload_fields: Optional[Dict[str, str]] = None  # For POST uploads
    expires_in_seconds: int = 300  # URL expiration
    cdn_url: Optional[str] = None  # Final URL after upload


class MediaProcessingStatus(BaseModel):
    """Current processing status"""
    status: str  # uploading, processing, ready, failed
    progress_percent: Optional[int] = None
    processing_step: Optional[str] = None
    error_message: Optional[str] = None


class MediaFileResponse(BaseModel):
    """Complete media file information"""
    id: UUID
    user_id: UUID
    original_filename: str
    media_type: MediaType
    mime_type: str
    file_size_bytes: int
    urls: MediaURLSchema
    width: Optional[int] = None
    height: Optional[int] = None
    duration_seconds: Optional[float] = None
    location: Optional[LocationSchema] = None
    ai_analysis: Optional[AIAnalysisSchema] = None
    status: str
    created_at: datetime
    
    class Config:
        from_attributes = True


class ReelCreateRequest(BaseModel):
    """Create a new reel"""
    media_id: UUID
    caption: Optional[str] = Field(None, max_length=2200)
    hashtags: List[str] = Field(default=[], max_length=30)
    mentions: List[UUID] = Field(default=[], max_length=20)
    location: Optional[LocationSchema] = None
    music_id: Optional[UUID] = None
    is_public: bool = True
    allow_comments: bool = True
    tagged_business_id: Optional[UUID] = None
    
    @validator('hashtags')
    def validate_hashtags(cls, v):
        # Remove # if present, lowercase
        cleaned = [tag.lower().lstrip('#') for tag in v]
        # Remove duplicates while preserving order
        seen = set()
        return [x for x in cleaned if not (x in seen or seen.add(x))]


class ReelResponse(BaseModel):
    """Reel in feed or detail view"""
    id: UUID
    author: "ReelAuthorSchema"  # Forward reference
    media: MediaFileResponse
    caption: Optional[str] = None
    hashtags: List[str] = []
    location_name: Optional[str] = None
    music: Optional["MusicTrackSchema"] = None
    
    # Engagement
    view_count: int
    like_count: int
    comment_count: int
    share_count: int
    is_liked_by_me: bool = False
    is_saved_by_me: bool = False
    
    # Metadata
    created_at: datetime
    ai_summary: Optional[str] = None
    
    class Config:
        from_attributes = True


class ReelAuthorSchema(BaseModel):
    """Minimal author info for reels"""
    id: UUID
    username: str
    full_name: str
    avatar_url: Optional[str] = None
    is_verified: bool = False


class MusicTrackSchema(BaseModel):
    """Music track info"""
    id: UUID
    title: str
    artist: str
    duration_seconds: float
    thumbnail_url: Optional[str] = None
    is_trending: bool = False


class FeedRequest(BaseModel):
    """Request parameters for feed"""
    location_lat: Optional[float] = Field(None, ge=-90, le=90)
    location_lng: Optional[float] = Field(None, ge=-180, le=180)
    radius_km: float = Field(default=50, ge=1, le=1000)
    interests: List[str] = []
    exclude_ids: List[UUID] = []  # Already seen content


class FeedResponse(PaginatedResponse[ReelResponse]):
    """Feed with pagination"""
    pass


class ReelInteractionRequest(BaseModel):
    """Like, save, or share a reel"""
    action: str = Field(..., pattern="^(like|unlike|save|unsave|share|view)$")


class CommentCreateRequest(BaseModel):
    """Post a comment"""
    content: str = Field(..., min_length=1, max_length=1000)
    parent_id: Optional[UUID] = None  # For replies


class CommentResponse(BaseModel):
    """Comment with author"""
    id: UUID
    author: ReelAuthorSchema
    content: str
    like_count: int
    is_liked_by_me: bool
    replies_count: int
    created_at: datetime
    parent_id: Optional[UUID] = None


# Resolve forward references
ReelResponse.update_forward_refs()