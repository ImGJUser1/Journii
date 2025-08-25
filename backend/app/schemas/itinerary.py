from pydantic import BaseModel
from typing import List, Optional

class ItineraryStop(BaseModel):
    name: str
    location: str
    duration: int  # Minutes
    category: str  # e.g., "museum", "food"

class ItineraryRequest(BaseModel):
    sites: List[str]  # e.g., ["Louvre", "Eiffel Tower"]
    schedule: str  # e.g., "2025-08-25 09:00-17:00"
    location: str  # e.g., "Paris, France"

class ItineraryResponse(BaseModel):
    itinerary_id: str
    schedule: str
    stops: List[ItineraryStop]
    transit_details: List[dict]