from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID

from app.core.security import get_current_user, optional_current_user
from app.core.logging import get_logger
from app.db.session import get_db
from app.services.gemini_service import gemini_service
from app.models.community import CulturalExperience
from app.models.user import User
from app.schemas.cultural import (
    CulturalRecommendationRequest,
    CulturalExperienceResponse,
    CulturalExperienceCreate,
    CulturalExperienceUpdate,
    NearbySearchRequest
)

logger = get_logger(__name__)
router = APIRouter(prefix="/cultural", tags=["Cultural Explorer"])


@router.post("/recommendations", response_model=List[CulturalExperienceResponse])
async def get_recommendations(
    request: CulturalRecommendationRequest,
    current_user: Optional[User] = Depends(optional_current_user),
    db: Session = Depends(get_db)
):
    """
    Get AI-powered cultural experience recommendations
    """
    try:
        # Generate AI recommendations
        ai_recommendations = await gemini_service.generate_cultural_recommendations(
            location=request.location,
            interests=request.interests,
            travel_style=request.travel_style,
            budget=request.budget,
            duration_days=request.duration_days
        )
        
        # Enhance with database data if available
        enhanced_recommendations = []
        for rec in ai_recommendations:
            # Check if experience exists in database
            db_experience = db.query(CulturalExperience).filter(
                CulturalExperience.title.ilike(f"%{rec['title']}%"),
                CulturalExperience.city.ilike(f"%{request.location}%")
            ).first()
            
            if db_experience:
                # Merge AI data with verified database data
                enhanced = {
                    **rec,
                    "id": str(db_experience.id),
                    "avg_rating": db_experience.avg_rating,
                    "total_reviews": db_experience.total_reviews,
                    "is_verified": db_experience.is_verified,
                    "booking_url": db_experience.booking_url,
                    "is_bookable": db_experience.is_bookable,
                    "photos": db_experience.photos,
                }
            else:
                # Use AI-generated data with generated ID
                enhanced = {
                    **rec,
                    "id": f"ai-{hash(rec['title'])}",  # Consistent ID for AI items
                    "avg_rating": 0,
                    "total_reviews": 0,
                    "is_verified": False,
                    "is_bookable": False,
                    "photos": [],
                }
            
            enhanced_recommendations.append(enhanced)
        
        logger.info(f"Generated {len(enhanced_recommendations)} recommendations for {request.location}")
        return enhanced_recommendations
        
    except Exception as e:
        logger.error(f"Recommendation generation failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate recommendations"
        )


@router.get("/experiences", response_model=List[CulturalExperienceResponse])
async def list_experiences(
    city: Optional[str] = Query(None),
    country: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    verified_only: bool = Query(False),
    min_rating: Optional[float] = Query(None, ge=0, le=5),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """
    List cultural experiences with filtering
    """
    query = db.query(CulturalExperience).filter(CulturalExperience.is_active == True)
    
    if city:
        query = query.filter(CulturalExperience.city.ilike(f"%{city}%"))
    if country:
        query = query.filter(CulturalExperience.country.ilike(f"%{country}%"))
    if category:
        query = query.filter(CulturalExperience.category == category)
    if verified_only:
        query = query.filter(CulturalExperience.is_verified == True)
    if min_rating:
        query = query.filter(CulturalExperience.avg_rating >= min_rating)
    
    total = query.count()
    experiences = query.offset(offset).limit(limit).all()
    
    return experiences


@router.get("/experiences/{experience_id}", response_model=CulturalExperienceResponse)
async def get_experience(
    experience_id: str,
    db: Session = Depends(get_db)
):
    """
    Get detailed information about a specific experience
    """
    # Check if it's an AI-generated ID
    if experience_id.startswith("ai-"):
        # Return cached AI data or fetch new
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="AI-generated experiences cannot be retrieved individually"
        )
    
    experience = db.query(CulturalExperience).filter(
        CulturalExperience.id == experience_id
    ).first()
    
    if not experience:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Experience not found"
        )
    
    return experience


@router.post("/nearby", response_model=List[CulturalExperienceResponse])
async def find_nearby_experiences(
    request: NearbySearchRequest,
    db: Session = Depends(get_db)
):
    """
    Find experiences near a specific location using geospatial query
    """
    # Use PostGIS or simple haversine formula for distance
    # This is a simplified version - in production use proper geospatial queries
    
    from sqlalchemy import text
    
    # Haversine formula in SQL
    query = text("""
        SELECT *, (
            6371 * acos(
                cos(radians(:lat)) * cos(radians((coordinates->>'lat')::float)) *
                cos(radians((coordinates->>'lng')::float) - radians(:lng)) +
                sin(radians(:lat)) * sin(radians((coordinates->>'lat')::float))
            )
        ) AS distance
        FROM cultural_experiences
        WHERE is_active = true
        HAVING distance <= :radius
        ORDER BY distance
        LIMIT :limit
    """)
    
    results = db.execute(query, {
        "lat": request.lat,
        "lng": request.lng,
        "radius": request.radius_km,
        "limit": request.limit
    }).fetchall()
    
    return results


@router.get("/categories", response_model=List[str])
async def get_categories():
    """
    Get list of available cultural experience categories
    """
    return [
        "workshop",
        "food_tour",
        "heritage_site",
        "festival",
        "outdoor_activity",
        "art_gallery",
        "local_market",
        "performance",
        "museum",
        "religious_site",
        "nature",
        "architecture"
    ]


# Admin endpoints for managing experiences
@router.post("/experiences", response_model=CulturalExperienceResponse, status_code=status.HTTP_201_CREATED)
async def create_experience(
    data: CulturalExperienceCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new cultural experience (admin/business only)
    """
    # Check permissions
    if not current_user.is_premium and not current_user.business_listings:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to create experiences"
        )
    
    experience = CulturalExperience(**data.dict())
    db.add(experience)
    db.commit()
    db.refresh(experience)
    
    logger.info(f"Created experience: {experience.title} by {current_user.email}")
    return experience