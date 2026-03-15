"""
Reel/Feed service for social content.
Handles feed algorithm, engagement tracking, and content discovery.
"""

from typing import List, Optional, Tuple
from uuid import UUID
from datetime import datetime, timedelta
import logging

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, func, and_, or_, desc, asc
from sqlalchemy.dialects.postgresql import array
from fastapi import HTTPException, status
from geoalchemy2.functions import ST_DWithin, ST_SetSRID, ST_MakePoint

from app.models.media import Reel, ReelLike, ReelComment, MediaFile
from app.models.user import User
from app.schemas.media import ReelCreateRequest, FeedRequest, CommentCreateRequest, CommentResponse, ReelAuthorSchema
from app.services.base_service import BaseService
from app.db.redis import Cache

logger = logging.getLogger(__name__)


class ReelService(BaseService[Reel]):
    """
    Service for reel operations and feed generation.
    """
    model = Reel
    
    def __init__(self, db: AsyncSession):
        super().__init__(db)
    
    async def create_reel(self, user_id: UUID, request: ReelCreateRequest) -> Reel:
        """
        Create a new reel from existing media.
        """
        # Verify media exists and belongs to user
        from app.services.media_service import MediaService
        media_service = MediaService(self.db)
        media = await media_service.get_by_id(request.media_id)
        
        if not media or media.user_id != user_id:
            raise HTTPException(status_code=404, detail="Media not found")
        
        if media.status.value != "ready":
            raise HTTPException(
                status_code=400,
                detail="Media is not ready for use"
            )
        
        # Create reel
        reel_data = {
            'author_id': user_id,
            'media_id': request.media_id,
            'caption': request.caption,
            'hashtags': request.hashtags,
            'mentions': request.mentions,
            'location_name': request.location.name if request.location else media.location_name,
            'location_coords': {
                'lat': request.location.lat,
                'lng': request.location.lng
            } if request.location else media.location_coords,
            'place_id': request.location.place_id if request.location else media.place_id,
            'music_id': request.music_id,
            'is_public': request.is_public,
            'allow_comments': request.allow_comments,
            'tagged_business_id': request.tagged_business_id,
            'ai_summary': media.ai_description  # Copy from media analysis
        }
        
        reel = await self.create(reel_data)
        
        # Increment media usage count
        media.usage_count += 1
        await self.db.flush()
        
        # TODO: Notify mentioned users
        # TODO: Update search index
        
        return reel
    
    async def get_feed(
        self,
        user_id: Optional[UUID],
        params: FeedRequest,
        pagination
    ) -> Tuple[List[Reel], int]:
        """
        Generate personalized feed.
        
        Algorithm:
        1. Location-based content (if location provided)
        2. User interests matching
        3. Engagement score ranking
        4. Recency boost
        5. Diversity injection
        """
        # Build base query
        query = select(Reel).where(
            and_(
                Reel.is_public == True,
                Reel.created_at > datetime.utcnow() - timedelta(days=30)
            )
        )
        
        # Location filter
        if params.location_lat and params.location_lng:
            # Use PostGIS for geospatial query
            point = ST_SetSRID(ST_MakePoint(params.location_lng, params.location_lat), 4326)
            query = query.where(
                ST_DWithin(
                    Reel.location_coords,
                    point,
                    params.radius_km * 1000  # Convert to meters
                )
            )
        
        # Exclude already seen (if provided)
        if params.exclude_ids:
            query = query.where(~Reel.id.in_(params.exclude_ids))
        
        # Get total count
        count_result = await self.db.execute(
            select(func.count(Reel.id)).where(query.whereclause)
        )
        total = count_result.scalar()
        
        # Ordering: engagement score + recency
        query = query.order_by(
            desc(Reel.engagement_score),
            desc(Reel.created_at)
        )
        
        # Pagination
        query = query.offset(pagination.offset).limit(pagination.page_size)
        
        # Execute
        result = await self.db.execute(query)
        reels = result.scalars().all()
        
        # Enrich with user-specific data (is_liked, etc.)
        if user_id:
            reels = await self._enrich_with_user_data(reels, user_id)
        
        return reels, total
    
    async def _enrich_with_user_data(self, reels: List[Reel], user_id: UUID) -> List[Reel]:
        """Add user-specific flags (is_liked, is_saved)"""
        reel_ids = [r.id for r in reels]
        
        # Get likes
        likes_result = await self.db.execute(
            select(ReelLike.reel_id).where(
                and_(
                    ReelLike.user_id == user_id,
                    ReelLike.reel_id.in_(reel_ids)
                )
            )
        )
        liked_ids = {row[0] for row in likes_result.all()}
        
        # Get saved (from user saved_reels - assuming field exists)
        # For now, we'll query a separate table or cache
        
        for reel in reels:
            reel.is_liked_by_me = reel.id in liked_ids
            reel.is_saved_by_me = False  # TODO: Implement saves
        
        return reels
    
    async def get_reel(self, reel_id: UUID, user_id: Optional[UUID] = None) -> Reel:
        """Get single reel with access check"""
        reel = await self.get_by_id_or_404(reel_id)
        
        if not reel.is_public and reel.author_id != user_id:
            raise HTTPException(status_code=404, detail="Reel not found")
        
        # Increment view
        await self._increment_view(reel_id)
        
        # Add user data
        if user_id:
            reel = (await self._enrich_with_user_data([reel], user_id))[0]
        
        return reel
    
    async def _increment_view(self, reel_id: UUID):
        """Increment view count and update engagement score"""
        try:
            await self.db.execute(
                update(Reel)
                .where(Reel.id == reel_id)
                .values(
                    view_count=Reel.view_count + 1,
                    # Simple engagement score: weighted sum of interactions
                    engagement_score=(
                        Reel.view_count * 0.1 +
                        Reel.like_count * 1.0 +
                        Reel.comment_count * 2.0 +
                        Reel.share_count * 3.0
                    ) / 100  # Normalize
                )
            )
        except Exception as e:
            logger.error(f"Failed to increment view: {e}")
    
    async def interact(
        self,
        reel_id: UUID,
        user_id: UUID,
        action: str
    ) -> dict:
        """Handle like, save, share, view interactions"""
        reel = await self.get_by_id_or_404(reel_id)
        
        if action == "like":
            # Check if already liked
            existing = await self.db.execute(
                select(ReelLike).where(
                    and_(ReelLike.reel_id == reel_id, ReelLike.user_id == user_id)
                )
            )
            if not existing.scalar_one_or_none():
                like = ReelLike(reel_id=reel_id, user_id=user_id)
                self.db.add(like)
                reel.like_count += 1
        
        elif action == "unlike":
            result = await self.db.execute(
                select(ReelLike).where(
                    and_(ReelLike.reel_id == reel_id, ReelLike.user_id == user_id)
                )
            )
            like = result.scalar_one_or_none()
            if like:
                await self.db.delete(like)
                reel.like_count = max(0, reel.like_count - 1)
        
        elif action == "share":
            reel.share_count += 1
            # TODO: Track share destinations
        
        elif action == "view":
            await self._increment_view(reel_id)
        
        # TODO: Save/unsave implementation
        
        await self.db.flush()
        
        return {
            "reel_id": str(reel_id),
            "action": action,
            "current_likes": reel.like_count,
            "current_shares": reel.share_count
        }
    
    async def get_comments(
        self,
        reel_id: UUID,
        page: int,
        page_size: int
    ) -> List[CommentResponse]:
        """Get top-level comments for a reel"""
        result = await self.db.execute(
            select(ReelComment, User)
            .join(User, ReelComment.author_id == User.id)
            .where(
                and_(
                    ReelComment.reel_id == reel_id,
                    ReelComment.parent_id == None,
                    ReelComment.is_hidden == False
                )
            )
            .order_by(desc(ReelComment.created_at))
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        
        comments = []
        for comment, author in result.all():
            comments.append(CommentResponse(
                id=comment.id,
                author=ReelAuthorSchema(
                    id=author.id,
                    username=author.email.split('@')[0],  # TODO: Add username field
                    full_name=author.full_name,
                    avatar_url=author.avatar_url,
                    is_verified=author.is_verified
                ),
                content=comment.content,
                like_count=comment.like_count,
                is_liked_by_me=False,  # TODO: Check
                replies_count=len(comment.replies) if hasattr(comment, 'replies') else 0,
                created_at=comment.created_at,
                parent_id=comment.parent_id
            ))
        
        return comments
    
    async def add_comment(
        self,
        reel_id: UUID,
        user_id: UUID,
        request: CommentCreateRequest
    ) -> CommentResponse:
        """Add a comment to a reel"""
        reel = await self.get_by_id_or_404(reel_id)
        
        if not reel.allow_comments:
            raise HTTPException(status_code=400, detail="Comments are disabled for this reel")
        
        # Validate parent comment exists if reply
        if request.parent_id:
            parent = await self.db.execute(
                select(ReelComment).where(ReelComment.id == request.parent_id)
            )
            if not parent.scalar_one_or_none():
                raise HTTPException(status_code=404, detail="Parent comment not found")
        
        comment = ReelComment(
            reel_id=reel_id,
            author_id=user_id,
            parent_id=request.parent_id,
            content=request.content
        )
        self.db.add(comment)
        reel.comment_count += 1
        
        await self.db.flush()
        await self.db.refresh(comment)
        
        # Get author info
        result = await self.db.execute(
            select(User).where(User.id == user_id)
        )
        author = result.scalar_one()
        
        return CommentResponse(
            id=comment.id,
            author=ReelAuthorSchema(
                id=author.id,
                username=author.email.split('@')[0],
                full_name=author.full_name,
                avatar_url=author.avatar_url,
                is_verified=author.is_verified
            ),
            content=comment.content,
            like_count=0,
            is_liked_by_me=False,
            replies_count=0,
            created_at=comment.created_at,
            parent_id=comment.parent_id
        )
    
    async def get_user_reels(
        self,
        user_id: UUID,
        requester_id: Optional[UUID],
        page: int,
        page_size: int
    ) -> Tuple[List[Reel], int]:
        """Get all reels by a user"""
        # Check privacy
        if user_id != requester_id:
            # TODO: Check if friends
            is_public_only = True
        else:
            is_public_only = False
        
        query = select(Reel).where(Reel.author_id == user_id)
        
        if is_public_only:
            query = query.where(Reel.is_public == True)
        
        # Count
        count_result = await self.db.execute(
            select(func.count(Reel.id)).where(query.whereclause)
        )
        total = count_result.scalar()
        
        # Execute
        query = query.order_by(desc(Reel.created_at))
        query = query.offset((page - 1) * page_size).limit(page_size)
        
        result = await self.db.execute(query)
        reels = result.scalars().all()
        
        if requester_id:
            reels = await self._enrich_with_user_data(reels, requester_id)
        
        return reels, total