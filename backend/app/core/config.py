"""
Production-ready configuration with comprehensive settings for all modules.
Uses Pydantic Settings v2 for validation and environment management.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, validator, PostgresDsn, RedisDsn
from functools import lru_cache
from typing import List, Optional, Dict, Any
import secrets


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )
    
    # =========================================================================
    # APPLICATION
    # =========================================================================
    APP_NAME: str = "Journii API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = Field(default=False, description="Debug mode with auto-reload")
    ENVIRONMENT: str = Field(default="development", pattern="^(development|staging|production)$")
    
    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    WORKERS: int = Field(default=4, description="Uvicorn worker processes")
    
    # =========================================================================
    # SECURITY
    # =========================================================================
    SECRET_KEY: str = Field(default_factory=lambda: secrets.token_urlsafe(32))
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # Password hashing
    BCRYPT_ROUNDS: int = 12
    
    # CORS
    CORS_ORIGINS: List[str] = Field(default=["http://localhost:19000", "http://localhost:3000"])
    CORS_ALLOW_CREDENTIALS: bool = True
    CORS_ALLOW_METHODS: List[str] = ["*"]
    CORS_ALLOW_HEADERS: List[str] = ["*"]
    
    # Rate Limiting
    RATE_LIMIT_REQUESTS: int = 100
    RATE_LIMIT_WINDOW: int = 60  # seconds
    RATE_LIMIT_BURST: int = 10
    
    # =========================================================================
    # DATABASE
    # =========================================================================
    DATABASE_URL: PostgresDsn = Field(
        default="postgresql+asyncpg://journii:journii@localhost:5432/journii"
    )
    DATABASE_POOL_SIZE: int = 20
    DATABASE_MAX_OVERFLOW: int = 10
    DATABASE_POOL_RECYCLE: int = 3600  # 1 hour
    DATABASE_ECHO: bool = False  # SQL logging
    
    # Alembic
    ALEMBIC_CONFIG: str = "alembic.ini"
    
    # =========================================================================
    # REDIS
    # =========================================================================
    REDIS_URL: RedisDsn = Field(default="redis://localhost:6379/0")
    REDIS_POOL_SIZE: int = 50
    
    # Cache TTLs
    CACHE_TTL_SHORT: int = 300      # 5 minutes
    CACHE_TTL_MEDIUM: int = 3600    # 1 hour
    CACHE_TTL_LONG: int = 86400     # 24 hours
    
    # =========================================================================
    # AWS / S3 STORAGE
    # =========================================================================
    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None
    AWS_REGION: str = "us-east-1"
    S3_BUCKET_NAME: str = "journii-media"
    S3_ENDPOINT_URL: Optional[str] = None  # For MinIO/compatible services
    
    # CloudFront CDN
    CLOUDFRONT_DOMAIN: Optional[str] = None
    CLOUDFRONT_KEY_ID: Optional[str] = None
    CLOUDFRONT_PRIVATE_KEY: Optional[str] = None
    
    # Upload Limits
    MAX_UPLOAD_SIZE_MB: int = 500  # 500MB max file
    ALLOWED_IMAGE_TYPES: List[str] = Field(default=["image/jpeg", "image/png", "image/webp", "image/heic"])
    ALLOWED_VIDEO_TYPES: List[str] = Field(default=["video/mp4", "video/quicktime", "video/webm"])
    ALLOWED_AUDIO_TYPES: List[str] = Field(default=["audio/mpeg", "audio/wav", "audio/aac"])
    
    # Processing
    VIDEO_MAX_DURATION_SECONDS: int = 300  # 5 minutes
    THUMBNAIL_WIDTH: int = 720
    THUMBNAIL_HEIGHT: int = 1280  # 9:16 aspect ratio for reels
    
    # =========================================================================
    # GOOGLE APIs
    # =========================================================================
    GOOGLE_GEMINI_API_KEY: str
    GOOGLE_MAPS_API_KEY: str
    GOOGLE_PLACES_API_KEY: Optional[str] = None
    
    # Gemini Config
    GEMINI_MODEL: str = "gemini-2.0-flash-exp"
    GEMINI_MAX_TOKENS: int = 2048
    GEMINI_TEMPERATURE: float = 0.7
    GEMINI_TIMEOUT: int = 30
    
    # =========================================================================
    # EXTERNAL APIs
    # =========================================================================
    MAPBOX_TOKEN: Optional[str] = None
    STRIPE_SECRET_KEY: Optional[str] = None
    STRIPE_WEBHOOK_SECRET: Optional[str] = None
    STRIPE_PUBLISHABLE_KEY: Optional[str] = None
    
    # =========================================================================
    # NOTIFICATIONS
    # =========================================================================
    FIREBASE_CREDENTIALS: Optional[str] = None  # Path to service account JSON
    TWILIO_ACCOUNT_SID: Optional[str] = None
    TWILIO_AUTH_TOKEN: Optional[str] = None
    TWILIO_PHONE_NUMBER: Optional[str] = None
    
    # Email
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: int = 587
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    EMAIL_FROM: str = "noreply@journii.app"
    EMAIL_FROM_NAME: str = "Journii"
    
    # =========================================================================
    # MONITORING
    # =========================================================================
    SENTRY_DSN: Optional[str] = None
    LOG_LEVEL: str = Field(default="INFO", pattern="^(DEBUG|INFO|WARNING|ERROR|CRITICAL)$")
    LOG_FORMAT: str = Field(default="json", pattern="^(json|text)$")
    
    # =========================================================================
    # FEATURE FLAGS
    # =========================================================================
    ENABLE_AI_FEATURES: bool = True
    ENABLE_PAYMENTS: bool = True
    ENABLE_NOTIFICATIONS: bool = True
    ENABLE_SOCIAL_FEATURES: bool = True
    ENABLE_ANALYTICS: bool = True
    
    # =========================================================================
    # VALIDATORS
    # =========================================================================
    
    @validator("CORS_ORIGINS", pre=True)
    def parse_cors_origins(cls, v):
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",")]
        return v
    
    @validator("SECRET_KEY", pre=True)
    def validate_secret_key(cls, v, values):
        if values.data.get("ENVIRONMENT") == "production" and len(v) < 32:
            raise ValueError("SECRET_KEY must be at least 32 characters in production")
        return v
    
    @property
    def database_url_async(self) -> str:
        """Get asyncpg-compatible URL"""
        url = str(self.DATABASE_URL)
        if "postgresql://" in url and "postgresql+asyncpg://" not in url:
            url = url.replace("postgresql://", "postgresql+asyncpg://")
        return url
    
    @property
    def s3_config(self) -> Dict[str, Any]:
        """Get S3 client configuration"""
        config = {
            "region_name": self.AWS_REGION,
        }
        if self.AWS_ACCESS_KEY_ID:
            config["aws_access_key_id"] = self.AWS_ACCESS_KEY_ID
            config["aws_secret_access_key"] = self.AWS_SECRET_ACCESS_KEY
        if self.S3_ENDPOINT_URL:
            config["endpoint_url"] = self.S3_ENDPOINT_URL
        return config
    
    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT == "production"
    
    @property
    def is_development(self) -> bool:
        return self.ENVIRONMENT == "development"


@lru_cache()
def get_settings() -> Settings:
    """Cached settings instance"""
    return Settings()


settings = get_settings()