"""
Media models for reels, posts, stories, and user-generated content.
Supports AI-generated metadata and content moderation.
"""

from sqlalchemy import (
    Column, String, Text, Integer, Float, Boolean, DateTime, 
    ForeignKey, Enum, Index, JSON, ARRAY, BigInteger
)
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID, ENUM
from sqlalchemy.sql import func
import uuid
import enum

from app.models.base import BaseModel


class MediaType(str, enum.Enum):
    IMAGE = "image"
    VIDEO = "video"
    AUDIO = "audio"
    DOCUMENT = "document"


class MediaStatus(str, enum.Enum):
    UPLOADING = "uploading"      # Initial upload started
    PROCESSING = "processing"    # Being processed (thumbnails, transcoding)
    READY = "ready"              # Available for use
    FAILED = "failed"            # Processing failed
    DELETED = "deleted"          # Soft deleted


class ProcessingStatus(str, enum.Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"


class MediaFile(BaseModel):
    """
    Core media file model.
    Stores metadata about uploaded files in S3.
    """
    __tablename__ = "media_files"
    
    # Ownership
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    
    # File Information
    original_filename = Column(String(255), nullable=False)
    storage_key = Column(String(500), nullable=False, unique=True)  # S3 key
    file_url = Column(String(500), nullable=False)
    thumbnail_url = Column(String(500), nullable=True)
    preview_url = Column(String(500), nullable=True)  # For videos - poster frame
    
    # Technical Metadata
    media_type = Column(ENUM(MediaType), nullable=False, index=True)
    mime_type = Column(String(100), nullable=False)
    file_size_bytes = Column(BigInteger, nullable=False)
    duration_seconds = Column(Float, nullable=True)  # For video/audio
    width = Column(Integer, nullable=True)  # For images/video
    height = Column(Integer, nullable=True)
    bitrate = Column(Integer, nullable=True)  # Video bitrate
    
    # Processing Status
    status = Column(ENUM(MediaStatus), default=MediaStatus.UPLOADING, index=True)
    processing_status = Column(ENUM(ProcessingStatus), default=ProcessingStatus.PENDING)
    processing_error = Column(Text, nullable=True)
    
    # Location (if geotagged)
    location_name = Column(String(200), nullable=True)
    location_coords = Column(JSON, nullable=True)  # {"lat": x, "lng": y}
    place_id = Column(String(100), nullable=True)  # Google Places ID
    
    # AI-Generated Metadata
    ai_tags = Column(ARRAY(String), default=list)  # Objects detected
    ai_categories = Column(ARRAY(String), default=list)  # Scene categories
    ai_description = Column(Text, nullable=True)  # Auto-generated caption
    detected_landmarks = Column(ARRAY(String), default=list)
    detected_activities = Column(ARRAY(String), default=list)
    safety_scores = Column(JSON, nullable=True)  # Content moderation scores
    
    # Usage Tracking
    view_count = Column(Integer, default=0)
    usage_count = Column(Integer, default=0)  # How many posts use this
    
    # Soft Delete
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    deleted_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    
    # Relationships
    owner = relationship("User", foreign_keys=[user_id], back_populates="media_files")
    reels = relationship("Reel", back_populates="media", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index('idx_media_user_type', 'user_id', 'media_type'),
        Index('idx_media_status', 'status', 'created_at'),
        Index('idx_media_location', 'location_coords', postgresql_using='gin'),
    )


class Reel(BaseModel):
    """
    TikTok/Instagram-style short video content.
    """
    __tablename__ = "reels"
    
    # Content
    author_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    media_id = Column(UUID(as_uuid=True), ForeignKey("media_files.id"), nullable=False)
    
    caption = Column(Text, nullable=True)
    hashtags = Column(ARRAY(String), default=list, index=True)
    mentions = Column(ARRAY(UUID(as_uuid=True)), default=list)  # User IDs
    
    # Location
    location_name = Column(String(200), nullable=True, index=True)
    location_coords = Column(JSON, nullable=True)
    place_id = Column(String(100), nullable=True)
    
    # Music/Audio
    music_id = Column(UUID(as_uuid=True), ForeignKey("music_tracks.id"), nullable=True)
    original_audio = Column(Boolean, default=True)  # False if using trending music
    
    # Engagement Metrics
    view_count = Column(Integer, default=0, index=True)
    like_count = Column(Integer, default=0)
    comment_count = Column(Integer, default=0)
    share_count = Column(Integer, default=0)
    save_count = Column(Integer, default=0)
    
    # Algorithm Scoring
    engagement_score = Column(Float, default=0.0, index=True)  # Calculated field
    trending_score = Column(Float, default=0.0)
    
    # Visibility
    is_public = Column(Boolean, default=True, index=True)
    is_featured = Column(Boolean, default=False)
    allow_comments = Column(Boolean, default=True)
    allow_duets = Column(Boolean, default=True)  # Allow others to use this audio
    
    # Business Integration
    tagged_business_id = Column(UUID(as_uuid=True), ForeignKey("business_listings.id"), nullable=True)
    tagged_products = Column(ARRAY(UUID(as_uuid=True)), default=list)  # Product IDs
    
    # AI Analysis
    ai_summary = Column(Text, nullable=True)
    ai_sentiment = Column(String(20), nullable=True)
    content_warning = Column(JSON, nullable=True)  # [{type: "sensitive", reason: "..."}]
    
    # Relationships
    author = relationship("User", back_populates="reels")
    media = relationship("MediaFile", back_populates="reels")
    music = relationship("MusicTrack", back_populates="reels")
    tagged_business = relationship("BusinessListing")
    likes = relationship("ReelLike", back_populates="reel", cascade="all, delete-orphan")
    comments = relationship("ReelComment", back_populates="reel", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index('idx_reels_created', 'created_at', 'is_public'),
        Index('idx_reels_location', 'location_coords', postgresql_using='gin'),
        Index('idx_reels_engagement', 'engagement_score', 'created_at'),
    )


class ReelLike(BaseModel):
    """Reel likes - separate table for analytics"""
    __tablename__ = "reel_likes"
    
    reel_id = Column(UUID(as_uuid=True), ForeignKey("reels.id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    __table_args__ = (
        Index('idx_reel_like_unique', 'reel_id', 'user_id', unique=True),
    )


class ReelComment(BaseModel):
    """Comments on reels with nested replies"""
    __tablename__ = "reel_comments"
    
    reel_id = Column(UUID(as_uuid=True), ForeignKey("reels.id"), nullable=False, index=True)
    author_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    parent_id = Column(UUID(as_uuid=True), ForeignKey("reel_comments.id"), nullable=True)
    
    content = Column(Text, nullable=False)
    like_count = Column(Integer, default=0)
    
    # For moderation
    is_hidden = Column(Boolean, default=False)
    moderation_reason = Column(String(100), nullable=True)
    
    # Relationships
    reel = relationship("Reel", back_populates="comments")
    author = relationship("User")
    replies = relationship("ReelComment", backref="parent", remote_side="ReelComment.id")


class MusicTrack(BaseModel):
    """Trending music/sounds for reels"""
    __tablename__ = "music_tracks"
    
    title = Column(String(200), nullable=False)
    artist = Column(String(200), nullable=False)
    duration_seconds = Column(Float, nullable=False)
    
    file_url = Column(String(500), nullable=False)
    thumbnail_url = Column(String(500), nullable=True)
    
    # Usage stats
    use_count = Column(Integer, default=0)
    is_trending = Column(Boolean, default=False, index=True)
    is_original = Column(Boolean, default=False)  # User-uploaded vs licensed
    
    # Licensing
    license_type = Column(String(50), default="platform")  # platform, commercial, restricted
    allowed_regions = Column(ARRAY(String), default=list)  # Country codes
    
    # Relationships
    reels = relationship("Reel", back_populates="music")


class FeedCache(BaseModel):
    """
    Pre-computed feed data for performance.
    Materialized view pattern for user feeds.
    """
    __tablename__ = "feed_cache"
    
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, unique=True)
    feed_data = Column(JSON, default=list)  # Array of reel IDs with scores
    last_updated = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    is_stale = Column(Boolean, default=True, index=True)
    
    __table_args__ = (
        Index('idx_feed_stale', 'is_stale', 'last_updated'),
    )