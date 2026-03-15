"""
Test configuration and fixtures.
"""

import pytest_asyncio
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from httpx import AsyncClient

from app.main import app
from app.db.session import get_db
from app.models import Base
from app.core.config import settings

# Test database
TEST_DATABASE_URL = "postgresql+asyncpg://journii:journii@localhost:5432/journii_test"

engine = create_async_engine(TEST_DATABASE_URL, echo=False)
TestingSessionLocal = async_sessionmaker(engine, expire_on_commit=False)


@pytest_asyncio.fixture
async def db_session():
    """Create a fresh database session for each test."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    async with TestingSessionLocal() as session:
        yield session
        await session.rollback()
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture
async def client(db_session):
    """Create a test client with overridden dependencies."""
    async def override_get_db():
        yield db_session
    
    app.dependency_overrides[get_db] = override_get_db
    
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac
    
    del app.dependency_overrides[get_db]


@pytest_asyncio.fixture
async def test_user(db_session):
    """Create a test user."""
    from app.models.user import User
    from app.core.security import get_password_hash
    
    user = User(
        email="test@example.com",
        hashed_password=get_password_hash("testpassword123"),
        first_name="Test",
        last_name="User"
    )
    db_session.add(user)
    await db_session.commit()
    return user


@pytest_asyncio.fixture
async def auth_headers(test_user):
    """Generate auth headers for test user."""
    from app.core.security import create_access_token
    
    token = create_access_token({"sub": str(test_user.id), "type": "access"})
    return {"Authorization": f"Bearer {token}"}