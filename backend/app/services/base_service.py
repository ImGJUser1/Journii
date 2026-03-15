"""
Base service class with common functionality.
All services should inherit from this.
"""

from typing import TypeVar, Generic, Type, Optional, List
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException, status
import logging

from app.models.base import BaseModel

ModelType = TypeVar("ModelType", bound=BaseModel)
logger = logging.getLogger(__name__)


class BaseService(Generic[ModelType]):
    """
    Generic base service with CRUD operations.
    """
    model: Type[ModelType] = None
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def get_by_id(self, id: UUID) -> Optional[ModelType]:
        """Get single record by ID"""
        result = await self.db.execute(
            select(self.model).where(self.model.id == id)
        )
        return result.scalar_one_or_none()
    
    async def get_by_id_or_404(self, id: UUID) -> ModelType:
        """Get by ID or raise 404"""
        obj = await self.get_by_id(id)
        if not obj:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"{self.model.__name__} not found"
            )
        return obj
    
    async def get_multi(
        self,
        skip: int = 0,
        limit: int = 100,
        filters: dict = None
    ) -> List[ModelType]:
        """Get multiple records with optional filtering"""
        query = select(self.model)
        
        if filters:
            for key, value in filters.items():
                if hasattr(self.model, key):
                    query = query.where(getattr(self.model, key) == value)
        
        query = query.offset(skip).limit(limit)
        result = await self.db.execute(query)
        return result.scalars().all()
    
    async def create(self, obj_data: dict) -> ModelType:
        """Create new record"""
        try:
            db_obj = self.model(**obj_data)
            self.db.add(db_obj)
            await self.db.flush()  # Get ID without committing
            await self.db.refresh(db_obj)
            return db_obj
        except IntegrityError as e:
            await self.db.rollback()
            logger.error(f"Integrity error creating {self.model.__name__}: {e}")
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Resource already exists or constraint violation"
            )
    
    async def update(self, id: UUID, obj_data: dict) -> ModelType:
        """Update record"""
        # Remove None values
        update_data = {k: v for k, v in obj_data.items() if v is not None}
        
        if not update_data:
            return await self.get_by_id_or_404(id)
        
        await self.db.execute(
            update(self.model)
            .where(self.model.id == id)
            .values(**update_data)
        )
        
        return await self.get_by_id_or_404(id)
    
    async def delete(self, id: UUID, soft: bool = True) -> bool:
        """
        Delete record.
        Soft delete by default (sets deleted_at).
        """
        obj = await self.get_by_id_or_404(id)
        
        if soft and hasattr(obj, 'deleted_at'):
            await self.db.execute(
                update(self.model)
                .where(self.model.id == id)
                .values(deleted_at=datetime.utcnow())
            )
        else:
            await self.db.execute(
                delete(self.model).where(self.model.id == id)
            )
        
        return True
    
    async def exists(self, id: UUID) -> bool:
        """Check if record exists"""
        result = await self.db.execute(
            select(self.model.id).where(self.model.id == id)
        )
        return result.scalar() is not None
    
    async def count(self, filters: dict = None) -> int:
        """Count records"""
        query = select(func.count(self.model.id))
        
        if filters:
            for key, value in filters.items():
                if hasattr(self.model, key):
                    query = query.where(getattr(self.model, key) == value)
        
        result = await self.db.execute(query)
        return result.scalar()