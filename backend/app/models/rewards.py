from sqlalchemy import Column, String, Integer, ForeignKey, Text, DateTime, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from .base import BaseModel
import uuid

class Reward(BaseModel):
    __tablename__ = "rewards"
    
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    
    # Badge Info
    badge_name = Column(String(100), nullable=False)
    badge_description = Column(Text, nullable=True)
    badge_icon_url = Column(String(500), nullable=True)
    badge_rarity = Column(String(20), default="common")  # common, rare, epic, legendary
    
    # Points
    points_awarded = Column(Integer, default=0)
    
    # Context
    action_trigger = Column(String(100), nullable=False)  # "complete_itinerary", "share_story", etc.
    context_data = Column(JSON, nullable=True)  # Additional data about the achievement
    
    # Display
    is_displayed = Column(Boolean, default=True)
    display_order = Column(Integer, default=0)
    
    # Relationships
    user = relationship("User", back_populates="rewards")

class GamificationAction(BaseModel):
    __tablename__ = "gamification_actions"
    
    action_code = Column(String(100), unique=True, nullable=False)
    action_name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    base_points = Column(Integer, default=10)
    badge_name = Column(String(100), nullable=True)
    badge_icon = Column(String(500), nullable=True)
    cooldown_hours = Column(Integer, default=0)  # Prevent spam
    daily_limit = Column(Integer, default=10)  # Max per day
    
    # Conditions
    required_level = Column(Integer, default=1)
    required_badges = Column(ARRAY(String), default=list)

class UserActivityLog(BaseModel):
    __tablename__ = "user_activity_logs"
    
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    action_code = Column(String(100), nullable=False)
    points_earned = Column(Integer, default=0)
    badge_earned = Column(String(100), nullable=True)
    metadata = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())