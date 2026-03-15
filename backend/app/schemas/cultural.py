from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any
from datetime import datetime
from uuid import UUID

class CulturalRecommendationRequest(BaseModel):
    location: str = Field(..., description="City or destination name")
    interests: List[str] = Field(default_factory=list)
    travel_style: str = Field(default="balanced", description="relaxed, balanced, or packed")
    budget: Optional[str] = Field(None, description="free, $, $$, $$$, $$$$")
    duration_days: int = Field(default=3, ge=1, le=30)
    lat: Optional[float] = None
    lng: Optional[float] = None

class CulturalExperienceResponse(BaseModel):
    id: str
    title: str
    category: str
    description: str
    short_description: Optional[str] = None
    location_specifics: Optional[str] = None
    duration_minutes: Optional[int] = None
    price_range: Optional[str] = None
    best_time: Optional[str] = None
    cultural_significance: Optional[str] = None
    local_tips: Optional[str] = None
    tags: List[str] = []
    
    # Database fields (may be empty for AI-generated)
    avg_rating: float = 0
    total_reviews: int = 0
    is_verified: bool = False
    is_bookable: bool = False
    booking_url: Optional[str] = None
    photos: List[str] = []
    
    class Config:
        from_attributes = True

class CulturalExperienceCreate(BaseModel):
    title: str
    description: str
    category: str
    location_name: str
    city: str
    country: str
    coordinates: Dict[str, float]
    duration_minutes: Optional[int] = None
    price_range: Optional[str] = None
    tags: List[str] = []
    cultural_significance: Optional[str] = None
    provider_id: Optional[UUID] = None

class CulturalExperienceUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None
    photos: Optional[List[str]] = None

class NearbySearchRequest(BaseModel):
    lat: float = Field(..., ge=-90, le=90)
    lng: float = Field(..., ge=-180, le=180)
    radius_km: float = Field(default=10, ge=0.1, le=100)
    category: Optional[str] = None
    limit: int = Field(default=20, ge=1, le=100)