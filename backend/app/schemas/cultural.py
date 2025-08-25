from pydantic import BaseModel
from typing import List, Optional

class CulturalRequest(BaseModel):
    interests: List[str]  # e.g., ["art", "food", "history"]
    location: str  # e.g., "Paris, France"
    travel_history: Optional[List[str]] = None  # e.g., ["Rome", "Tokyo"]

class CulturalResponse(BaseModel):
    title: str
    description: str
    location: str
    category: str  # e.g., "event", "workshop", "tour"
    coordinates: Optional[str] = None  # e.g., "48.8566,2.3522"