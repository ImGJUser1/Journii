from pydantic import BaseModel
from typing import Dict, List, Optional

class TransitPreferences(BaseModel):
    max_time: Optional[int] = None  # Max travel time in minutes
    max_cost: Optional[float] = None  # Max cost in local currency
    avoid_crowds: bool = False
    preferred_modes: List[str] = ["bus", "train", "subway"]

class TransitRequest(BaseModel):
    start_location: str  # e.g., "40.7128,-74.0060"
    end_location: str    # e.g., "40.7484,-73.9857"
    preferences: TransitPreferences

class TransitRouteStep(BaseModel):
    mode: str
    start: str
    end: str
    duration: int  # In minutes
    cost: float
    crowding_level: Optional[str] = None

class TransitResponse(BaseModel):
    route_id: str
    total_duration: int
    total_cost: float
    steps: List[TransitRouteStep]
    safety_alerts: List[str]