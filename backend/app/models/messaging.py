from sqlalchemy import Column, String, JSON, ForeignKey, Text, Integer, Boolean, DateTime, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import ARRAY, UUID, ENUM
from .base import BaseModel
import uuid
import enum

class ConversationType(str, enum.Enum):
    DIRECT = "direct"
    GROUP = "group"
    TRIP = "trip"
    SUPPORT = "support"

class Conversation(BaseModel):
    __tablename__ = "conversations"
    
    conversation_type = Column(ENUM(ConversationType), default=ConversationType.DIRECT)
    title = Column(String(200), nullable=True)  # For group chats
    
    # For trip-related chats
    itinerary_id = Column(UUID(as_uuid=True), ForeignKey("itineraries.id"), nullable=True)
    
    # Metadata
    last_message_at = Column(DateTime(timezone=True), nullable=True)
    last_message_preview = Column(String(200), nullable=True)
    last_message_sender_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    
    # Settings
    is_archived = Column(Boolean, default=False)
    is_muted = Column(Boolean, default=False)
    
    # Relationships
    participants = relationship("ConversationParticipant", back_populates="conversation", cascade="all, delete-orphan")
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan", order_by="Message.created_at.desc()")
    itinerary = relationship("Itinerary")

class ConversationParticipant(BaseModel):
    __tablename__ = "conversation_participants"
    
    conversation_id = Column(UUID(as_uuid=True), ForeignKey("conversations.id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    # Role & Permissions
    role = Column(String(20), default="member")  # admin, member
    joined_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Settings
    is_muted = Column(Boolean, default=False)
    mute_until = Column(DateTime(timezone=True), nullable=True)
    notification_count = Column(Integer, default=0)
    
    # Relationships
    conversation = relationship("Conversation", back_populates="participants")
    user = relationship("User")

class Message(BaseModel):
    __tablename__ = "messages"
    
    conversation_id = Column(UUID(as_uuid=True), ForeignKey("conversations.id"), nullable=False, index=True)
    sender_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    
    # Content
    message_type = Column(String(20), default="text")  # text, image, video, audio, location, itinerary_share, booking_share
    content = Column(Text, nullable=True)
    
    # Media
    media_urls = Column(ARRAY(String), default=list)
    media_duration_seconds = Column(Integer, nullable=True)  # For audio/video
    
    # Shared Content
    shared_itinerary_id = Column(UUID(as_uuid=True), ForeignKey("itineraries.id"), nullable=True)
    shared_booking_id = Column(UUID(as_uuid=True), ForeignKey("bookings.id"), nullable=True)
    shared_location = Column(JSON, nullable=True)  # {lat, lng, name, address}
    
    # Status
    is_edited = Column(Boolean, default=False)
    edited_at = Column(DateTime(timezone=True), nullable=True)
    is_deleted = Column(Boolean, default=False)
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    
    # Reactions
    reactions = Column(JSON, default=dict)  # {user_id: emoji}
    
    # Reply
    reply_to_message_id = Column(UUID(as_uuid=True), ForeignKey("messages.id"), nullable=True)
    
    # Read Status
    read_by = Column(ARRAY(UUID(as_uuid=True)), default=list)  # List of user IDs who read
    
    # Relationships
    conversation = relationship("Conversation", back_populates="messages")
    sender = relationship("User")
    reply_to = relationship("Message", remote_side="Message.id")