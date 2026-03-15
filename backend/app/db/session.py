"""
Async database session management with connection pooling.
Supports both web requests and background tasks.
"""

from sqlalchemy.ext.asyncio import (
    create_async_engine,
    AsyncSession,
    async_sessionmaker,
    AsyncEngine
)
from sqlalchemy.orm import declarative_base
from contextlib import asynccontextmanager
from typing import AsyncGenerator, Optional
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)

# Global engine instance
_engine: Optional[AsyncEngine] = None
_session_maker: Optional[async_sessionmaker] = None


def get_engine() -> AsyncEngine:
    """Get or create async engine with pooling"""
    global _engine
    if _engine is None:
        _engine = create_async_engine(
            settings.database_url_async,
            pool_size=settings.DATABASE_POOL_SIZE,
            max_overflow=settings.DATABASE_MAX_OVERFLOW,
            pool_recycle=settings.DATABASE_POOL_RECYCLE,
            pool_pre_ping=True,  # Verify connections before use
            echo=settings.DATABASE_ECHO,
            future=True,
        )
        logger.info(f"Database engine created with pool_size={settings.DATABASE_POOL_SIZE}")
    return _engine


def get_session_maker() -> async_sessionmaker:
    """Get or create session maker"""
    global _session_maker
    if _session_maker is None:
        _session_maker = async_sessionmaker(
            bind=get_engine(),
            class_=AsyncSession,
            expire_on_commit=False,  # Prevent expired object errors
            autocommit=False,
            autoflush=False,
        )
    return _session_maker


async def init_db():
    """Initialize database - create tables (for dev only, use Alembic in prod)"""
    if settings.is_development:
        from app.models import Base
        async with get_engine().begin() as conn:
            # await conn.run_sync(Base.metadata.create_all)
            logger.info("Database tables would be created here (use Alembic in production)")
            pass


async def close_db():
    """Close database connections"""
    global _engine
    if _engine:
        await _engine.dispose()
        _engine = None
        logger.info("Database engine disposed")


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    FastAPI dependency for database sessions.
    Automatically handles rollback on exceptions.
    """
    session = get_session_maker()()
    try:
        yield session
        await session.commit()
    except Exception as e:
        await session.rollback()
        raise e
    finally:
        await session.close()


@asynccontextmanager
async def get_db_context() -> AsyncGenerator[AsyncSession, None]:
    """
    Context manager for database sessions in background tasks.
    Usage:
        async with get_db_context() as db:
            await do_something(db)
    """
    session = get_session_maker()()
    try:
        yield session
        await session.commit()
    except Exception as e:
        await session.rollback()
        raise e
    finally:
        await session.close()


class DatabaseRetry:
    """Decorator for retrying database operations"""
    
    def __init__(self, max_retries: int = 3, exceptions: tuple = (Exception,)):
        self.max_retries = max_retries
        self.exceptions = exceptions
    
    def __call__(self, func):
        async def wrapper(*args, **kwargs):
            last_exception = None
            for attempt in range(self.max_retries):
                try:
                    return await func(*args, **kwargs)
                except self.exceptions as e:
                    last_exception = e
                    logger.warning(f"DB retry {attempt + 1}/{self.max_retries}: {e}")
                    if attempt < self.max_retries - 1:
                        import asyncio
                        await asyncio.sleep(0.1 * (2 ** attempt))  # Exponential backoff
            raise last_exception
        return wrapper