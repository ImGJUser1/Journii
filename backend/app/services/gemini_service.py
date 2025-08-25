import httpx
from app.config import Config
from app.utils.error_handling import handle_api_error
from typing import Dict, Any
import asyncio

class GeminiService:
    async def call_gemini(self, prompt: str) -> Dict[str, Any]:
        headers = {"Authorization": f"Bearer {Config.GEMINI_API_KEY}"}
        payload = {"prompt": prompt, "model": "gemini-pro"}  # Adjust model as needed
        retries = Config.RATE_LIMIT_RETRIES

        async with httpx.AsyncClient() as client:
            for attempt in range(retries):
                try:
                    response = await client.post(
                        "https://api.gemini.com/v1/generate",  # Replace with actual Gemini endpoint
                        json=payload,
                        headers=headers,
                        timeout=10.0
                    )
                    response.raise_for_status()
                    return response.json()
                except httpx.HTTPStatusError as e:
                    if e.response.status_code == 429 and attempt < retries - 1:
                        await asyncio.sleep(2 ** attempt)  # Exponential backoff
                        continue
                    handle_api_error(e)
                except Exception as e:
                    handle_api_error(e)
            raise HTTPException(status_code=429, detail="Gemini API rate limit exceeded")