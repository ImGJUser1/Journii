from fastapi import APIRouter, HTTPException
from app.schemas.community import CommunityRequest, CommunityResponse
from app.services.community_service import CommunityService
from app.utils.error_handling import handle_api_error

router = APIRouter()

@router.post("/stories", response_model=CommunityResponse)
async def share_story(request: CommunityRequest):
    try:
        community_service = CommunityService()
        story = await community_service.process_story(
            user_id=request.user_id,
            content=request.content,
            media_url=request.media_url
        )
        return story
    except Exception as e:
        handle_api_error(e)