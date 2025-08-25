from app.services.gemini_service import GeminiService
from app.schemas.social import SocialResponse
from app.utils.error_handling import handle_api_error
from typing import List
import httpx
from app.config import Config

class SafetyService:
    def __init__(self):
        self.gemini_service = GeminiService()

    async def match_companions(self, user_id: str, route: str, location: str) -> List[SocialResponse]:
        try:
            # Fetch nearby users with matching routes (mock DB query or external service)
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{Config.TRANSIT_API_URL}/nearby_users",
                    params={"user_id": user_id, "route": route, "location": location},
                    timeout=10.0
                )
                response.raise_for_status()
                nearby_users = response.json().get("users", [])

            # Generate safety alerts with Gemini
            prompt = f"""
            Given user route: {route}, location: {location}, and nearby users: {nearby_users},
            generate safety alerts and match users for shared travel.
            Respect privacy settings. Return JSON with companion_id, route_match, safety_alerts, and distance.
            """
            gemini_response = await self.gemini_service.call_gemini(prompt)
            companions = gemini_response.get("companions", [])
            return [SocialResponse(**companion) for companion in companions]
        except Exception as e:
            handle_api_error(e)