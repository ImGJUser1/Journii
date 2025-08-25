from fastapi import APIRouter, HTTPException
from app.schemas.cultural import CulturalRequest, CulturalResponse
from app.services.gemini_service import GeminiService
from app.utils.error_handling import handle_api_error

router = APIRouter()

@router.post("/recommendations", response_model=list[CulturalResponse])
async def get_cultural_recommendations(request: CulturalRequest):
    try:
        gemini_service = GeminiService()
        prompt = f"""
        Generate personalized cultural experiences for a user with interests: {request.interests},
        location: {request.location}, and travel history: {request.travel_history}.
        Include event details, artisan workshops, or food tours with storytelling context.
        Return a JSON list of recommendations with title, description, location, and category.
        """
        response = await gemini_service.call_gemini(prompt)
        recommendations = response.get("recommendations", [])
        if not recommendations:
            raise HTTPException(status_code=500, detail="No recommendations generated")
        return [CulturalResponse(**item) for item in recommendations]
    except Exception as e:
        handle_api_error(e)