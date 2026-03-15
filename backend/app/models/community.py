from sqlalchemy import Column, String, JSON, ForeignKey, Text, Integer, Boolean, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from .base import BaseModel
import uuid

class CommunityPost(BaseModel):
    __tablename__ = "community_posts"
    
    author_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    
    # Content
    content_type = Column(String(20), default="post")  # post, reel, story, blog, audio
    title = Column(String(300), nullable=True)
    content = Column(Text, nullable=True)
    
    # Media
    media_urls = Column(ARRAY(String), default=list)  # For multiple images/videos
    thumbnail_url = Column(String(500), nullable=True)
    video_duration_seconds = Column(Integer, nullable=True)
    
    # Location
    location_name = Column(String(200), nullable=True)
    location_coords = Column(JSON, nullable=True)  # {lat, lng}
    place_id = Column(String(100), nullable=True)  # Google Places ID
    
    # Metadata
    tags = Column(ARRAY(String), default=list)
    mentions = Column(ARRAY(String), default=list)  # User IDs mentioned
    hashtags = Column(ARRAY(String), default=list)
    
    # Engagement
    likes_count = Column(Integer, default=0)
    comments_count = Column(Integer, default=0)
    shares_count = Column(Integer, default=0)
    views_count = Column(Integer, default=0)
    
    # AI Generated
    ai_summary = Column(Text, nullable=True)
    ai_sentiment = Column(String(20), nullable=True)
    detected_themes = Column(ARRAY(String), default=list)
    
    # Visibility
    is_public = Column(Boolean, default=True)
    is_featured = Column(Boolean, default=False)
    allow_comments = Column(Boolean, default=True)
    
    # Relationships
    author = relationship("User", back_populates="posts")
    comments = relationship("PostComment", back_populates="post", cascade="all, delete-orphan")
    likes = relationship("PostLike", back_populates="post", cascade="all, delete-orphan")

class PostComment(BaseModel):
    __tablename__ = "post_comments"
    
    post_id = Column(UUID(as_uuid=True), ForeignKey("community_posts.id"), nullable=False, index=True)
    author_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    parent_id = Column(UUID(as_uuid=True), ForeignKey("post_comments.id"), nullable=True)  # For nested replies
    
    content = Column(Text, nullable=False)
    likes_count = Column(Integer, default=0)
    
    # Relationships
    post = relationship("CommunityPost", back_populates="comments")
    author = relationship("User")
    replies = relationship("PostComment", backref="parent", remote_side="PostComment.id")

class PostLike(BaseModel):
    __tablename__ = "post_likes"
    
    post_id = Column(UUID(as_uuid=True), ForeignKey("community_posts.id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    __table_args__ = (
        db.UniqueConstraint('post_id', 'user_id', name='unique_post_like'),
    )

class CulturalExperience(BaseModel):
    __tablename__ = "cultural_experiences"
    
    # Basic Info
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    short_description = Column(String(500), nullable=True)
    
    # Location
    location_name = Column(String(200), nullable=False)
    location_coords = Column(JSON, nullable=False)
    address = Column(Text, nullable=True)
    city = Column(String(100), nullable=False, index=True)
    country = Column(String(100), nullable=False, index=True)
    
    # Categorization
    category = Column(String(50), nullable=False)  # workshop, food_tour, heritage_site, festival, etc.
    subcategories = Column(ARRAY(String), default=list)
    tags = Column(ARRAY(String), default=list)
    
    # Details
    duration_minutes = Column(Integer, nullable=True)
    price_range = Column(JSON, nullable=True)  # {min, max, currency}
    languages = Column(ARRAY(String), default=list)
    group_size = Column(JSON, nullable=True)  # {min, max}
    
    # Media
    photos = Column(ARRAY(String), default=list)
    videos = Column(ARRAY(String), default=list)
    cover_image = Column(String(500), nullable=True)
    
    # Ratings & Reviews
    avg_rating = Column(Float, default=0.0)
    total_reviews = Column(Integer, default=0)
    
    # Business Info
    provider_id = Column(UUID(as_uuid=True), ForeignKey("business_listings.id"), nullable=True)
    booking_url = Column(String(500), nullable=True)
    is_bookable = Column(Boolean, default=False)
    
    # AI Data
    ai_generated = Column(Boolean, default=False)
    cultural_significance = Column(Text, nullable=True)
    best_time_to_visit = Column(String(200), nullable=True)
    local_tips = Column(Text, nullable=True)
    
    # Status
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    
    __table_args__ = (
        db.Index('idx_cultural_location', 'city', 'country'),
        db.Index('idx_cultural_category', 'category'),
    )