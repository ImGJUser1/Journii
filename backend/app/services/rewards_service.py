from sqlalchemy.orm import Session
from app.models.reward import Reward
from app.schemas.gamification import GamificationRequest, GamificationResponse
from app.services.gemini_service import GeminiService
from app.utils.error_handling import handle_api_error
import uuid

class RewardsService:
    def __init__(self, db: Session):
        self.db = db
        self.gemini_service = GeminiService()

    async def assign_reward(self, user_id: str, action: str, points: int, badge: str | None) -> GamificationResponse:
        try:
            prompt = f"""
            For user: {user_id} and action: {action},
            generate a reward with badge_name, points, and motivational message.
            Return JSON with badge_id, badge_name, points, and message.
            """
            response = await self.gemini_service.call_gemini(prompt)
            reward_data = response.get("reward", {})
            if not reward_data:
                raise HTTPException(status_code=500, detail="No reward generated")
            
            reward_data["badge_id"] = str(uuid.uuid4())
            reward = Reward(
                user_id=user_id,
                action=action,
                points=points,
                badge=badge or reward_data.get("badge_name")
            )
            self.db.add(reward)
            self.db.commit()
            self.db.refresh(reward)
            
            # Mock total points/badges (replace with DB query)
            total_points = points  # Query total points
            badges = [badge] if badge else []  # Query badges
            return GamificationResponse(
                user_id=user_id,
                total_points=total_points,
                badges=badges,
                new_badge=badge or reward_data.get("badge_name"),
                message=reward_data.get("message")
            )
        except Exception as e:
            handle_api_error(e)

    async def get_user_rewards(self, user_id: str) -> list[GamificationResponse]:
        try:
            # Mock DB query (replace with real query)
            prompt = f"Retrieve and summarize rewards for user: {user_id}. Return JSON list of rewards with badge_id, badge_name, points, and message."
            response = await self.gemini_service.call_gemini(prompt)
            rewards = response.get("rewards", [])
            return [GamificationResponse(**reward) for reward in rewards]
        except Exception as e:
            handle_api_error(e)