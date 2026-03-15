from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from fastapi.security import HTTPBearer
from sqlalchemy.orm import Session
from datetime import timedelta
import uuid

from app.core.config import settings
from app.core.security import (
    verify_password, get_password_hash, create_access_token, 
    create_refresh_token, decode_token, get_current_user
)
from app.core.exceptions import AuthenticationException, ValidationException
from app.core.logging import get_logger
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import (
    UserRegisterRequest, UserLoginRequest, TokenResponse, 
    TokenRefreshRequest, UserProfileResponse, UserUpdateRequest,
    PasswordChangeRequest, PasswordResetRequest, PasswordResetConfirmRequest
)

logger = get_logger(__name__)
router = APIRouter(prefix="/auth", tags=["Authentication"])
security = HTTPBearer()


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(
    request: UserRegisterRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Register a new user account"""
    # Check if email exists
    existing_user = db.query(User).filter(User.email == request.email).first()
    if existing_user:
        raise ValidationException("Email already registered")
    
    # Create user
    user = User(
        id=uuid.uuid4(),
        email=request.email,
        hashed_password=get_password_hash(request.password),
        first_name=request.first_name,
        last_name=request.last_name,
        phone=request.phone,
        preferences={
            "interests": [],
            "travel_style": "balanced",
            "dietary_preferences": [],
            "accessibility_needs": []
        },
        languages=["en"]
    )
    
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # Create tokens
    token_data = {"sub": str(user.id), "email": user.email}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)
    
    # Send welcome email (async)
    # background_tasks.add_task(send_welcome_email, user.email, user.first_name)
    
    logger.info(f"New user registered: {user.email}")
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )


@router.post("/login", response_model=TokenResponse)
async def login(request: UserLoginRequest, db: Session = Depends(get_db)):
    """Authenticate user and return tokens"""
    user = db.query(User).filter(User.email == request.email).first()
    
    if not user or not verify_password(request.password, user.hashed_password):
        raise AuthenticationException("Invalid email or password")
    
    if not user.is_active:
        raise AuthenticationException("Account is deactivated")
    
    # Update last login (optional)
    # user.last_login_at = datetime.utcnow()
    # db.commit()
    
    token_data = {"sub": str(user.id), "email": user.email}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)
    
    logger.info(f"User logged in: {user.email}")
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(request: TokenRefreshRequest, db: Session = Depends(get_db)):
    """Refresh access token using refresh token"""
    payload = decode_token(request.refresh_token)
    
    if not payload or payload.get("type") != "refresh":
        raise AuthenticationException("Invalid refresh token")
    
    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user or not user.is_active:
        raise AuthenticationException("User not found or inactive")
    
    # Create new tokens
    token_data = {"sub": str(user.id), "email": user.email}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )


@router.post("/logout")
async def logout(current_user: User = Depends(get_current_user)):
    """Logout user (client should discard tokens)"""
    # In a more complex setup, you might blacklist tokens
    logger.info(f"User logged out: {current_user.email}")
    return {"message": "Successfully logged out"}


@router.get("/me", response_model=UserProfileResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """Get current user profile"""
    return current_user


@router.patch("/me", response_model=UserProfileResponse)
async def update_me(
    request: UserUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update current user profile"""
    update_data = request.dict(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(current_user, field, value)
    
    db.commit()
    db.refresh(current_user)
    
    logger.info(f"User profile updated: {current_user.email}")
    return current_user


@router.post("/change-password")
async def change_password(
    request: PasswordChangeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Change user password"""
    if not verify_password(request.current_password, current_user.hashed_password):
        raise ValidationException("Current password is incorrect")
    
    current_user.hashed_password = get_password_hash(request.new_password)
    db.commit()
    
    logger.info(f"Password changed for user: {current_user.email}")
    return {"message": "Password changed successfully"}


@router.post("/forgot-password")
async def forgot_password(
    request: PasswordResetRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Request password reset"""
    user = db.query(User).filter(User.email == request.email).first()
    
    # Always return success to prevent email enumeration
    if user:
        # Generate reset token
        reset_token = create_access_token(
            {"sub": str(user.id), "type": "password_reset"},
            expires_delta=timedelta(hours=1)
        )
        # Send email (async)
        # background_tasks.add_task(send_password_reset_email, user.email, reset_token)
        logger.info(f"Password reset requested for: {user.email}")
    
    return {"message": "If the email exists, a reset link has been sent"}


@router.post("/reset-password")
async def reset_password(request: PasswordResetConfirmRequest, db: Session = Depends(get_db)):
    """Confirm password reset"""
    payload = decode_token(request.token)
    
    if not payload or payload.get("type") != "password_reset":
        raise AuthenticationException("Invalid or expired reset token")
    
    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise AuthenticationException("User not found")
    
    user.hashed_password = get_password_hash(request.new_password)
    db.commit()
    
    logger.info(f"Password reset completed for: {user.email}")
    return {"message": "Password reset successfully"}