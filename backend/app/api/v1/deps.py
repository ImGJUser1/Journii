"""
Common FastAPI dependencies for authentication, database, etc.
"""

from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from app.db.session import get_db
from app.db.redis import get_redis, RateLimiter
from app.core.security import decode_token, verify_password
from app.core.config import settings
from app.models.user import User

# Security scheme
security = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> User:
    """
    Get current authenticated user from JWT token.
    Raises 401 if not authenticated.
    """
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    payload = decode_token(credentials.credentials)
    if not payload or payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
        )
    
    # Get user from DB
    result = await db.execute(
        select(User).where(User.id == user_id)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated",
        )
    
    return user


async def get_optional_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> Optional[User]:
    """
    Get current user if authenticated, None otherwise.
    Does not raise error for unauthenticated requests.
    """
    if not credentials:
        return None
    
    try:
        return await get_current_user(credentials, db)
    except HTTPException:
        return None


async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Ensure user is active (additional checks beyond basic auth).
    """
    if current_user.is_banned:  # Assuming this field exists
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is banned",
        )
    return current_user


async def check_rate_limit(
    request: Request,
    user: Optional[User] = Depends(get_optional_user)
) -> dict:
    """
    Rate limiting dependency.
    Uses user ID if authenticated, IP address otherwise.
    """
    # Identify client
    if user:
        key = f"rate_limit:user:{user.id}"
        max_requests = settings.RATE_LIMIT_REQUESTS
    else:
        # Get IP from request
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            ip = forwarded.split(",")[0].strip()
        else:
            ip = request.client.host if request.client else "unknown"
        
        key = f"rate_limit:ip:{ip}"
        max_requests = settings.RATE_LIMIT_REQUESTS // 2  # Lower limit for anonymous
    
    # Check rate limit
    allowed, metadata = await RateLimiter.is_allowed(
        key=key,
        max_requests=max_requests,
        window_seconds=settings.RATE_LIMIT_WINDOW
    )
    
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded",
            headers={
                "X-RateLimit-Limit": str(metadata["limit"]),
                "X-RateLimit-Remaining": "0",
                "X-RateLimit-Reset": str(metadata["reset"]),
                "Retry-After": str(settings.RATE_LIMIT_WINDOW)
            }
        )
    
    # Add rate limit headers to response (done via middleware)
    request.state.rate_limit = metadata
    
    return metadata


async def require_permissions(
    permissions: list[str],
    user: User = Depends(get_current_user)
) -> User:
    """
    Check if user has required permissions.
    For future RBAC implementation.
    """
    # TODO: Implement proper permission checking
    # For now, just check if user is admin for admin routes
    if "admin" in permissions and not user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return user


# Database dependency is imported from session
# Re-export for convenience
__all__ = [
    "get_db",
    "get_current_user",
    "get_optional_user",
    "get_current_active_user",
    "check_rate_limit",
    "require_permissions",
]