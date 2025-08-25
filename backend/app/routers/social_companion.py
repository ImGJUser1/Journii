from fastapi import APIRouter, HTTPException
from app.schemas.social import SocialRequest, SocialResponse
from app.services.safety_service import SafetyService
from app.utils.error_handling import handle_api_error

router = APIRouter()

@router.post("/companions", response_model=list[SocialResponse])
async def find_travel_companions(request: SocialRequest):
    try:
        safety_service = SafetyService()
        companions = await safety_service.match_companions(
            user_id=request.user_id,
            route=request.route,
            location=request.location
        )
        return companions
    except Exception as e:
        handle_api_error(e)