from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.schemas.gamification import GamificationRequest, GamificationResponse
from app.services.rewards_service import RewardsService
from app.utils.database import get_db
from app.utils.error_handling import handle_api_error

router = APIRouter()

@router.post("/rewards", response_model=GamificationResponse)
async def assign_reward(request: GamificationRequest, db: Session = Depends(get_db)):
    try:
        rewards_service = RewardsService(db)
        reward = await rewards_service.assign_reward(
            user_id=request.user_id,
            action=request.action,
            points=request.points,
            badge=request.badge
        )
        return reward
    except Exception as e:
        handle_api_error(e)