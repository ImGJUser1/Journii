from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import List, Optional
import os


class Settings(BaseSettings):
    # App
    APP_NAME: str = "Journii API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    ENVIRONMENT: str = "production"  # development, staging, production
    
    # Security
    SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # Database
    DATABASE_URL: str
    DATABASE_POOL_SIZE: int = 10
    DATABASE_MAX_OVERFLOW: int = 20
    
    # Redis (for caching & sessions)
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # Google APIs
    GOOGLE_GEMINI_API_KEY: str
    GOOGLE_MAPS_API_KEY: str
    GOOGLE_PLACES_API_KEY: str
    
    # External APIs
    TRANSIT_API_URL: Optional[str] = None  # e.g., TransitLand, OpenTripPlanner
    MAPBOX_API_KEY: Optional[str] = None
    
    # File Storage (AWS S3 or compatible)
    S3_ENDPOINT: Optional[str] = None
    S3_ACCESS_KEY: Optional[str] = None
    S3_SECRET_KEY: Optional[str] = None
    S3_BUCKET_NAME: str = "journii-uploads"
    S3_REGION: str = "us-east-1"
    
    # Payment Processing
    STRIPE_SECRET_KEY: Optional[str] = None
    STRIPE_WEBHOOK_SECRET: Optional[str] = None
    
    # Email
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: int = 587
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    EMAIL_FROM: str = "noreply@journii.app"
    
    # Rate Limiting
    RATE_LIMIT_REQUESTS: int = 100
    RATE_LIMIT_WINDOW: int = 60  # seconds
    
    # AI Configuration
    GEMINI_MODEL: str = "gemini-2.0-flash-exp"
    GEMINI_MAX_TOKENS: int = 2048
    GEMINI_TEMPERATURE: float = 0.7
    
    # Feature Flags
    ENABLE_AI_FEATURES: bool = True
    ENABLE_PAYMENTS: bool = True
    ENABLE_NOTIFICATIONS: bool = True
    ENABLE_SOCIAL_FEATURES: bool = True
    
    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()