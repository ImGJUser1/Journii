from sqlalchemy import Column, String, Boolean, JSON, Text, Integer, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import ARRAY
from .base import BaseModel, Base
import uuid

class User(BaseModel):
    __tablename__ = "users"
    
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    avatar_url = Column(String(500), nullable=True)
    bio = Column(Text, nullable=True)
    phone = Column(String(20), nullable=True)
    
    # Profile & Preferences
    preferences = Column(JSON, default=dict)  # interests, travel_style, dietary, etc.
    travel_history = Column(ARRAY(String), default=list)
    languages = Column(ARRAY(String), default=list)
    
    # Gamification
    xp_points = Column(Integer, default=0)
    level = Column(Integer, default=1)
    badges = Column(ARRAY(String), default=list)
    
    # Privacy & Settings
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    is_premium = Column(Boolean, default=False)
    privacy_level = Column(String(20), default="public")  # public, friends_only, private
    
    # Location
    current_location = Column(JSON, nullable=True)  # {lat, lng, city, country}
    last_location_update = Column(DateTime(timezone=True), nullable=True)
    
    # Security
    two_factor_enabled = Column(Boolean, default=False)
    two_factor_secret = Column(String(255), nullable=True)
    
    # Relationships
    itineraries = relationship("Itinerary", back_populates="user", cascade="all, delete-orphan")
    posts = relationship("CommunityPost", back_populates="author", cascade="all, delete-orphan")
    rewards = relationship("Reward", back_populates="user", cascade="all, delete-orphan")
    bookings = relationship("Booking", back_populates="user", cascade="all, delete-orphan")
    business_listings = relationship("BusinessListing", back_populates="owner", cascade="all, delete-orphan")
    
    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"
    
    @property
    def safety_score(self):
        """Calculate user safety score based on verification, history, etc."""
        score = 5.0
        if self.is_verified:
            score += 2.0
        if self.is_premium:
            score += 1.0
        # Add more logic based on reviews, reports, etc.
        return min(score, 10.0)