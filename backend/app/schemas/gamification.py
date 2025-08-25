from pydantic import BaseModel

class GamificationRequest(BaseModel):
    user_id: str
    action: str  # e.g., "complete_itinerary", "share_story"
    points: int
    badge: str | None = None

class GamificationResponse(BaseModel):
    user_id: str
    total_points: int
    badges: list[str]
    new_badge: str | None = None
    message: str | None = None