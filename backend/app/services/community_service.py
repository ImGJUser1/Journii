from app.services.gemini_service import GeminiService
from app.schemas.community import CommunityResponse
from app.utils.error_handling import handle_api_error

class CommunityService:
    def __init__(self):
        self.gemini_service = GeminiService()

    async def process_story(self, user_id: str, content: str, media_url: str = None) -> CommunityResponse:
        try:
            prompt = f"""
            Summarize user-generated content: {content}, with media: {media_url}.
            Extract themes, sentiment, and location. Return JSON with story_id, summary, sentiment, and location.
            """
            response = await self.gemini_service.call_gemini(prompt)
            story = response.get("story")
            if not story:
                raise HTTPException(status_code=500, detail="No story summary generated")
            return CommunityResponse(**story)
        except Exception as e:
            handle_api_error(e)
            