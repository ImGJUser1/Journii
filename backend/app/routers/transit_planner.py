from fastapi import APIRouter, HTTPException
from app.schemas.transit import TransitRequest, TransitResponse
from app.services.transit_service import TransitService
from app.utils.error_handling import handle_api_error

router = APIRouter()

@router.post("/routes", response_model=list[TransitResponse])
async def get_transit_routes(request: TransitRequest):
    try:
        transit_service = TransitService()
        routes = await transit_service.get_optimized_routes(
            start=request.start_location,
            end=request.end_location,
            preferences=request.preferences
        )
        return routes
    except Exception as e:
        handle_api_error(e)