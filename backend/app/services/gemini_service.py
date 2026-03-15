import google.generativeai as genai
from google.generativeai.types import HarmCategory, HarmBlockThreshold
from typing import Dict, Any, List, Optional
import json
import asyncio
from functools import lru_cache

from app.core.config import settings
from app.core.logging import get_logger
from app.core.exceptions import AIProcessingException

logger = get_logger(__name__)

# Configure Gemini
genai.configure(api_key=settings.GOOGLE_GEMINI_API_KEY)

class GeminiService:
    def __init__(self):
        self.model = genai.GenerativeModel(
            model_name=settings.GEMINI_MODEL,
            generation_config={
                "temperature": settings.GEMINI_TEMPERATURE,
                "max_output_tokens": settings.GEMINI_MAX_TOKENS,
                "top_p": 0.95,
                "top_k": 40,
            },
            safety_settings={
                HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
                HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
                HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
                HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            }
        )
    
    async def generate_content(self, prompt: str, response_schema: Optional[Dict] = None) -> str:
        """Generate content from Gemini with error handling"""
        try:
            loop = asyncio.get_event_loop()
            
            # Run in thread pool to not block
            def _generate():
                if response_schema:
                    return self.model.generate_content(
                        prompt,
                        generation_config={"response_mime_type": "application/json"}
                    )
                return self.model.generate_content(prompt)
            
            response = await loop.run_in_executor(None, _generate)
            
            if not response.text:
                raise AIProcessingException("Empty response from Gemini")
            
            return response.text
            
        except Exception as e:
            logger.error(f"Gemini generation failed: {str(e)}")
            raise AIProcessingException(f"AI processing failed: {str(e)}")
    
    async def generate_json(self, prompt: str, schema: Dict[str, Any]) -> Dict[str, Any]:
        """Generate structured JSON response"""
        try:
            # Add JSON instruction to prompt
            json_prompt = f"""
{prompt}

IMPORTANT: Respond with valid JSON only, following this schema:
{json.dumps(schema, indent=2)}

Do not include markdown formatting, code blocks, or any other text.
"""
            response_text = await self.generate_content(json_prompt)
            
            # Clean up response
            text = response_text.strip()
            if text.startswith("```json"):
                text = text[7:]
            if text.startswith("```"):
                text = text[3:]
            if text.endswith("```"):
                text = text[:-3]
            
            return json.loads(text.strip())
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse Gemini JSON response: {response_text}")
            raise AIProcessingException(f"Invalid JSON response: {str(e)}")
    
    # Cultural Explorer Methods
    async def generate_cultural_recommendations(
        self,
        location: str,
        interests: List[str],
        travel_style: str = "balanced",
        budget: Optional[str] = None,
        duration_days: int = 3
    ) -> List[Dict[str, Any]]:
        """Generate personalized cultural experience recommendations"""
        
        prompt = f"""
As a cultural travel expert, recommend authentic local experiences in {location} for a {travel_style} traveler.

User Profile:
- Interests: {', '.join(interests)}
- Budget: {budget or 'flexible'}
- Duration: {duration_days} days

Provide 5-7 unique experiences that:
1. Are authentic and locally-owned (not tourist traps)
2. Match the user's interests
3. Fit within their budget range
4. Can be realistically visited in the given duration
5. Include a mix of activities (food, art, history, nature)

For each experience, provide:
- title: Catchy, appealing name
- category: One of [workshop, food_tour, heritage_site, festival, outdoor_activity, art_gallery, local_market, performance]
- description: Detailed description (2-3 sentences)
- short_description: One-line summary
- location_specifics: Neighborhood or area
- duration_minutes: Estimated time needed
- price_range: Approximate cost in USD (free, $, $$, $$$, $$$$)
- best_time: Best time of day/week to visit
- cultural_significance: Why this is culturally important
- local_tips: Insider tips for the best experience
- tags: 3-5 relevant keywords
"""
        
        schema = {
            "type": "object",
            "properties": {
                "recommendations": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "title": {"type": "string"},
                            "category": {"type": "string"},
                            "description": {"type": "string"},
                            "short_description": {"type": "string"},
                            "location_specifics": {"type": "string"},
                            "duration_minutes": {"type": "integer"},
                            "price_range": {"type": "string"},
                            "best_time": {"type": "string"},
                            "cultural_significance": {"type": "string"},
                            "local_tips": {"type": "string"},
                            "tags": {"type": "array", "items": {"type": "string"}}
                        },
                        "required": ["title", "category", "description"]
                    }
                }
            },
            "required": ["recommendations"]
        }
        
        result = await self.generate_json(prompt, schema)
        return result.get("recommendations", [])
    
    # Transit Planner Methods
    async def analyze_transit_options(
        self,
        origin: str,
        destination: str,
        available_routes: List[Dict],
        preferences: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """AI-enhanced transit route analysis"""
        
        prompt = f"""
Analyze these transit options from {origin} to {destination} and provide intelligent recommendations.

User Preferences:
- Priority: {preferences.get('priority', 'balanced')} (time, cost, comfort, eco, scenic)
- Avoid crowds: {preferences.get('avoid_crowds', False)}
- Accessibility needs: {preferences.get('accessibility_needs', False)}
- Preferred modes: {', '.join(preferences.get('preferred_modes', ['all']))}

Available Routes:
{json.dumps(available_routes, indent=2)}

For each route, provide:
- route_id: Reference ID
- ai_recommendation_score: 0-100 based on user preferences
- recommendation_reason: Why this route fits the user (1-2 sentences)
- highlights: Best features of this route
- warnings: Any concerns or downsides
- cultural_sights: Interesting things to see along the way
- local_tips: Insider knowledge for this route
- crowd_forecast: Expected crowd level (low, medium, high) with reasoning
"""
        
        schema = {
            "type": "object",
            "properties": {
                "analyzed_routes": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "route_id": {"type": "string"},
                            "ai_recommendation_score": {"type": "integer"},
                            "recommendation_reason": {"type": "string"},
                            "highlights": {"type": "array", "items": {"type": "string"}},
                            "warnings": {"type": "array", "items": {"type": "string"}},
                            "cultural_sights": {"type": "array", "items": {"type": "string"}},
                            "local_tips": {"type": "string"},
                            "crowd_forecast": {"type": "string"}
                        }
                    }
                },
                "top_recommendation": {"type": "string"},
                "alternative_suggestions": {"type": "array", "items": {"type": "string"}}
            }
        }
        
        return await self.generate_json(prompt, schema)
    
    # Itinerary Builder Methods
    async def generate_itinerary(
        self,
        destination: str,
        days: int,
        interests: List[str],
        budget: str,
        travel_style: str
    ) -> Dict[str, Any]:
        """Generate complete day-by-day itinerary"""
        
        prompt = f"""
Create a detailed {days}-day itinerary for {destination}.

Traveler Profile:
- Interests: {', '.join(interests)}
- Budget: {budget}
- Style: {travel_style} (relaxed, moderate, packed)

Requirements:
- Each day should have 3-5 activities
- Balance popular attractions with hidden gems
- Include meal recommendations
- Consider travel time between locations
- Suggest best times for each activity
- Include one flexible/free time slot per day

Structure:
- Day 1: Arrival and orientation
- Middle days: Core experiences
- Final day: Highlights and departure prep
"""
        
        schema = {
            "type": "object",
            "properties": {
                "itinerary": {
                    "type": "object",
                    "properties": {
                        "title": {"type": "string"},
                        "description": {"type": "string"},
                        "days": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "day_number": {"type": "integer"},
                                    "theme": {"type": "string"},
                                    "stops": {
                                        "type": "array",
                                        "items": {
                                            "type": "object",
                                            "properties": {
                                                "name": {"type": "string"},
                                                "category": {"type": "string"},
                                                "description": {"type": "string"},
                                                "duration_minutes": {"type": "integer"},
                                                "suggested_time": {"type": "string"},
                                                "price_estimate": {"type": "number"},
                                                "booking_required": {"type": "boolean"},
                                                "local_tips": {"type": "string"}
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        "total_estimated_cost": {"type": "number"},
                        "money_saving_tips": {"type": "array", "items": {"type": "string"}},
                        "packing_suggestions": {"type": "array", "items": {"type": "string"}}
                    }
                }
            }
        }
        
        result = await self.generate_json(prompt, schema)
        return result.get("itinerary", {})
    
    # Community Content Methods
    async def analyze_community_post(
        self,
        content: str,
        media_descriptions: List[str] = None
    ) -> Dict[str, Any]:
        """Analyze community post content for insights"""
        
        media_context = ""
        if media_descriptions:
            media_context = f"\nMedia descriptions: {', '.join(media_descriptions)}"
        
        prompt = f"""
Analyze this travel post and extract insights:

Content: "{content}"{media_context}

Provide:
- summary: Brief summary (1-2 sentences)
- sentiment: Overall tone (positive, negative, neutral, mixed)
- themes: Main topics covered (2-4 items)
- detected_location: Any location mentioned (or null)
- activities_mentioned: List of activities described
- recommendations_extracted: Any tips or recommendations given
- engagement_prediction: Predicted engagement level (high, medium, low) with reason
- suggested_hashtags: 5-8 relevant hashtags
"""
        
        schema = {
            "type": "object",
            "properties": {
                "summary": {"type": "string"},
                "sentiment": {"type": "string"},
                "themes": {"type": "array", "items": {"type": "string"}},
                "detected_location": {"type": ["string", "null"]},
                "activities_mentioned": {"type": "array", "items": {"type": "string"}},
                "recommendations_extracted": {"type": "array", "items": {"type": "string"}},
                "engagement_prediction": {"type": "string"},
                "suggested_hashtags": {"type": "array", "items": {"type": "string"}}
            }
        }
        
        return await self.generate_json(prompt, schema)
    
    # Chat Methods
    async def chat(
        self,
        messages: List[Dict[str, str]],
        context: str = "general"
    ) -> str:
        """Interactive chat for travel assistance"""
        
        system_contexts = {
            "cultural": "You are a cultural travel expert specializing in authentic local experiences, hidden gems, and cultural immersion.",
            "transit": "You are a transit and mobility expert who helps travelers navigate cities efficiently and safely.",
            "planning": "You are a trip planning expert who creates optimized itineraries and travel strategies.",
            "general": "You are Journii, a helpful AI travel companion for cultural exploration and trip planning."
        }
        
        system_prompt = system_contexts.get(context, system_contexts["general"])
        
        # Build conversation history
        conversation = f"{system_prompt}\n\n"
        for msg in messages:
            role = msg.get("role", "user")
            content = msg.get("content", "")
            conversation += f"{role.upper()}: {content}\n"
        
        conversation += "ASSISTANT: "
        
        response = await self.generate_content(conversation)
        return response.strip()

# Singleton instance
gemini_service = GeminiService()