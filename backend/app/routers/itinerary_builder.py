from fastapi import APIRouter, HTTPException
from app.schemas.itinerary import ItineraryRequest, ItineraryResponse
from app.services.gemini_service import GeminiService
from app.utils.error_handling import handle_api_error

router = APIRouter()

@router.post("/itinerary", response_model=ItineraryResponse)
async def build_itinerary(request: ItineraryRequest):
    try:
        gemini_service = GeminiService()
        prompt = f"""
        Create an optimized daily itinerary for cultural sites: {request.sites},
        schedule: {request.schedule}, and location: {request.location}.
        Include transit routes and nearby amenities (food, restrooms).
        Return JSON with itinerary_id, schedule, stops, and transit_details.
        """
        response = await gemini_service.call_gemini(prompt)
        itinerary = response.get("itinerary")
        if not itinerary:
            raise HTTPException(status_code=500, detail="No itinerary generated")
        return ItineraryResponse(**itinerary)
    except Exception as e:
        handle_api_error(e)