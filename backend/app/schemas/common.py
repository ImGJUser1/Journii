"""
Common schemas used across all modules.
"""

from pydantic import BaseModel, Field
from typing import Generic, TypeVar, List, Optional, Dict, Any
from datetime import datetime
from uuid import UUID

T = TypeVar("T")


class PaginationParams(BaseModel):
    """Standard pagination parameters"""
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)
    
    @property
    def offset(self) -> int:
        return (self.page - 1) * self.page_size


class PaginatedResponse(BaseModel, Generic[T]):
    """Standard paginated response wrapper"""
    items: List[T]
    total: int
    page: int
    page_size: int
    pages: int
    
    @classmethod
    def create(
        cls,
        items: List[T],
        total: int,
        params: PaginationParams
    ) -> "PaginatedResponse[T]":
        pages = (total + params.page_size - 1) // params.page_size
        return cls(
            items=items,
            total=total,
            page=params.page,
            page_size=params.page_size,
            pages=pages
        )


class APIResponse(BaseModel, Generic[T]):
    """Standard API response wrapper"""
    success: bool = True
    data: Optional[T] = None
    message: Optional[str] = None
    error_code: Optional[str] = None
    meta: Optional[Dict[str, Any]] = None


class ErrorResponse(BaseModel):
    """Standard error response"""
    success: bool = False
    error_code: str
    message: str
    details: Optional[Dict[str, Any]] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class LocationSchema(BaseModel):
    """Standard location format"""
    lat: float = Field(..., ge=-90, le=90)
    lng: float = Field(..., ge=-180, le=180)
    name: Optional[str] = None
    place_id: Optional[str] = None


class MediaURLSchema(BaseModel):
    """Media file URLs"""
    original: str
    thumbnail: Optional[str] = None
    preview: Optional[str] = None  # For videos


class AIAnalysisSchema(BaseModel):
    """AI-generated content analysis"""
    tags: List[str] = []
    categories: List[str] = []
    description: Optional[str] = None
    landmarks: List[str] = []
    activities: List[str] = []
    sentiment: Optional[str] = None
    safety_scores: Optional[Dict[str, float]] = None