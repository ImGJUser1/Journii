from sqlalchemy import Column, String, JSON, ForeignKey, DateTime, Integer, Text, Boolean, Float
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from .base import BaseModel
import uuid

class Itinerary(BaseModel):
    __tablename__ = "itineraries"
    
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    destination = Column(String(200), nullable=False)
    destination_coords = Column(JSON, nullable=True)  # {lat, lng}
    
    # Dates
    start_date = Column(DateTime(timezone=True), nullable=False)
    end_date = Column(DateTime(timezone=True), nullable=False)
    duration_days = Column(Integer, nullable=False)
    
    # Trip Details
    budget_range = Column(JSON, nullable=True)  # {min, max, currency}
    travel_style = Column(String(50), nullable=True)  # backpacker, luxury, family, etc.
    trip_type = Column(String(50), default="solo")  # solo, couple, family, friends
    
    # Status
    status = Column(String(20), default="planning")  # planning, active, completed, cancelled
    is_public = Column(Boolean, default=False)
    is_collaborative = Column(Boolean, default=False)
    
    # AI Generated Data
    ai_suggestions = Column(JSON, nullable=True)
    optimized_route = Column(JSON, nullable=True)  # GeoJSON or custom format
    
    # Relationships
    user = relationship("User", back_populates="itineraries")
    stops = relationship("ItineraryStop", back_populates="itinerary", cascade="all, delete-orphan", order_by="ItineraryStop.day_number, ItineraryStop.order_index")
    collaborators = relationship("TripCollaborator", back_populates="itinerary", cascade="all, delete-orphan")
    bookings = relationship("Booking", back_populates="itinerary")

class ItineraryStop(BaseModel):
    __tablename__ = "itinerary_stops"
    
    itinerary_id = Column(UUID(as_uuid=True), ForeignKey("itineraries.id"), nullable=False, index=True)
    
    # Stop Details
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    location = Column(String(200), nullable=False)
    coordinates = Column(JSON, nullable=False)  # {lat, lng}
    
    # Timing
    day_number = Column(Integer, nullable=False)
    order_index = Column(Integer, nullable=False)
    duration_minutes = Column(Integer, default=60)
    suggested_time = Column(String(50), nullable=True)  # "09:00", "afternoon", etc.
    
    # Categorization
    category = Column(String(50), nullable=False)  # attraction, food, activity, transit, accommodation
    subcategory = Column(String(50), nullable=True)
    tags = Column(ARRAY(String), default=list)
    
    # Media & Content
    photos = Column(ARRAY(String), default=list)
    notes = Column(Text, nullable=True)
    
    # Booking Info
    booking_required = Column(Boolean, default=False)
    booking_url = Column(String(500), nullable=True)
    price_estimate = Column(Float, nullable=True)
    currency = Column(String(3), default="USD")
    
    # AI Data
    ai_recommendation_reason = Column(Text, nullable=True)
    cultural_significance = Column(Text, nullable=True)
    local_tips = Column(Text, nullable=True)
    
    # Relationships
    itinerary = relationship("Itinerary", back_populates="stops")

class TripCollaborator(BaseModel):
    __tablename__ = "trip_collaborators"
    
    itinerary_id = Column(UUID(as_uuid=True), ForeignKey("itineraries.id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    role = Column(String(20), default="editor")  # viewer, editor, admin
    joined_at = Column(DateTime(timezone=True), server_default=func.now())
    status = Column(String(20), default="pending")  # pending, accepted, declined
    
    # Permissions
    can_edit = Column(Boolean, default=True)
    can_add_bookings = Column(Boolean, default=True)
    can_invite_others = Column(Boolean, default=False)
    
    # Relationships
    itinerary = relationship("Itinerary", back_populates="collaborators")
    user = relationship("User")