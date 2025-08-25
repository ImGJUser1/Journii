from pydantic import BaseModel
from typing import List, Optional

class SocialRequest(BaseModel):
    user_id: str
    route: str  # e.g., "start:40.7128,-74.0060;end:40.7484,-73.9857"
    location: str  # e.g., "40.7128,-74.0060"
    privacy_level: str = "public"  # e.g., "public", "friends_only"

class SocialResponse(BaseModel):
    companion_id: str
    route_match: str
    safety_alerts: List[str]
    distance: float  # Distance in meters to companion