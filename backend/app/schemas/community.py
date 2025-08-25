from pydantic import BaseModel
from typing import Optional

class CommunityRequest(BaseModel):
    user_id: str
    content: str  # e.g., "Amazing food tour in Tokyo!"
    media_url: Optional[str] = None  # e.g., URL to photo/video

class CommunityResponse(BaseModel):
    story_id: str
    summary: str
    sentiment: str  # e.g., "positive"
    location: Optional[str] = None