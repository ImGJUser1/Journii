from sqlalchemy import Column, String, JSON, ForeignKey, Text, Integer, Float, Boolean, DateTime, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import ARRAY, UUID, ENUM
from .base import BaseModel
import uuid
import enum

class BusinessType(str, enum.Enum):
    HOTEL = "hotel"
    RESTAURANT = "restaurant"
    TOUR_OPERATOR = "tour_operator"
    TRANSPORT = "transport"
    ACTIVITY_PROVIDER = "activity_provider"
    SHOP = "shop"
    GUIDE = "guide"
    OTHER = "other"

class BusinessListing(BaseModel):
    __tablename__ = "business_listings"
    
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    
    # Basic Info
    business_name = Column(String(200), nullable=False)
    business_type = Column(ENUM(BusinessType), nullable=False)
    description = Column(Text, nullable=False)
    short_description = Column(String(500), nullable=True)
    
    # Contact
    email = Column(String(255), nullable=False)
    phone = Column(String(20), nullable=True)
    website = Column(String(500), nullable=True)
    
    # Location
    address = Column(Text, nullable=False)
    city = Column(String(100), nullable=False, index=True)
    country = Column(String(100), nullable=False, index=True)
    coordinates = Column(JSON, nullable=False)
    
    # Media
    photos = Column(ARRAY(String), default=list)
    logo_url = Column(String(500), nullable=True)
    cover_image = Column(String(500), nullable=True)
    
    # Business Details
    amenities = Column(ARRAY(String), default=list)
    languages_spoken = Column(ARRAY(String), default=list)
    payment_methods = Column(ARRAY(String), default=list)
    
    # Verification & Trust
    is_verified = Column(Boolean, default=False)
    verification_documents = Column(ARRAY(String), default=list)
    license_number = Column(String(100), nullable=True)
    tax_id = Column(String(100), nullable=True)
    
    # Ratings
    avg_rating = Column(Float, default=0.0)
    total_reviews = Column(Integer, default=0)
    
    # Commission
    commission_rate = Column(Float, default=0.10)  # 10% default
    commission_type = Column(String(20), default="percentage")  # percentage, fixed
    
    # Status
    status = Column(String(20), default="pending")  # pending, active, suspended, inactive
    is_featured = Column(Boolean, default=False)
    
    # Relationships
    owner = relationship("User", back_populates="business_listings")
    services = relationship("BusinessService", back_populates="business", cascade="all, delete-orphan")
    bookings = relationship("Booking", back_populates="business")

class BusinessService(BaseModel):
    __tablename__ = "business_services"
    
    business_id = Column(UUID(as_uuid=True), ForeignKey("business_listings.id"), nullable=False, index=True)
    
    # Service Info
    service_name = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    service_type = Column(String(50), nullable=False)  # tour, accommodation, meal, transport, etc.
    
    # Pricing
    price = Column(Float, nullable=False)
    currency = Column(String(3), default="USD")
    price_type = Column(String(20), default="per_person")  # per_person, per_group, fixed
    
    # Duration
    duration_minutes = Column(Integer, nullable=True)
    duration_type = Column(String(20), nullable=True)  # fixed, variable, multi_day
    
    # Capacity
    max_capacity = Column(Integer, nullable=True)
    min_capacity = Column(Integer, default=1)
    
    # Schedule
    available_days = Column(ARRAY(String), default=list)  # monday, tuesday, etc.
    available_times = Column(ARRAY(String), default=list)  # ["09:00", "14:00"]
    advance_booking_days = Column(Integer, default=1)
    
    # Media
    photos = Column(ARRAY(String), default=list)
    
    # Status
    is_active = Column(Boolean, default=True)
    
    # Relationships
    business = relationship("BusinessListing", back_populates="services")
    bookings = relationship("BookingService", back_populates="service")

class Booking(BaseModel):
    __tablename__ = "bookings"
    
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    business_id = Column(UUID(as_uuid=True), ForeignKey("business_listings.id"), nullable=False, index=True)
    itinerary_id = Column(UUID(as_uuid=True), ForeignKey("itineraries.id"), nullable=True)
    
    # Booking Details
    booking_code = Column(String(20), unique=True, nullable=False)
    status = Column(String(20), default="pending")  # pending, confirmed, cancelled, completed, refunded
    
    # Dates
    booking_date = Column(DateTime(timezone=True), server_default=func.now())
    service_date = Column(DateTime(timezone=True), nullable=False)
    service_time = Column(String(10), nullable=True)
    
    # Financial
    subtotal = Column(Float, nullable=False)
    tax_amount = Column(Float, default=0.0)
    discount_amount = Column(Float, default=0.0)
    total_amount = Column(Float, nullable=False)
    currency = Column(String(3), default="USD")
    
    commission_amount = Column(Float, nullable=False)
    payout_amount = Column(Float, nullable=False)  # Amount to business after commission
    
    # Payment
    payment_status = Column(String(20), default="pending")  # pending, paid, failed, refunded
    payment_method = Column(String(50), nullable=True)
    transaction_id = Column(String(100), nullable=True)
    
    # Cancellation
    cancellation_reason = Column(Text, nullable=True)
    cancelled_at = Column(DateTime(timezone=True), nullable=True)
    refund_amount = Column(Float, nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="bookings")
    business = relationship("BusinessListing", back_populates="bookings")
    itinerary = relationship("Itinerary", back_populates="bookings")
    services = relationship("BookingService", back_populates="booking", cascade="all, delete-orphan")

class BookingService(BaseModel):
    __tablename__ = "booking_services"
    
    booking_id = Column(UUID(as_uuid=True), ForeignKey("bookings.id"), nullable=False)
    service_id = Column(UUID(as_uuid=True), ForeignKey("business_services.id"), nullable=False)
    
    quantity = Column(Integer, default=1)
    unit_price = Column(Float, nullable=False)
    total_price = Column(Float, nullable=False)
    
    special_requests = Column(Text, nullable=True)
    
    # Relationships
    booking = relationship("Booking", back_populates="services")
    service = relationship("BusinessService", back_populates="bookings")