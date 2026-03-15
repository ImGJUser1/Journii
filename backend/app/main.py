"""
Updated main application with all new modules integrated.
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import time

from app.core.config import settings
from app.core.logging import get_logger
from app.core.exceptions import JourniiException
from app.core.middleware import RequestIDMiddleware, SecurityHeadersMiddleware, RateLimitHeadersMiddleware
from app.db.session import init_db, close_db
from app.db.redis import init_redis, close_redis

# Import all routers
from app.api.v1 import (
    auth,
    cultural,
    transit,
    social,
    community,
    itinerary,
    marketplace,
    gamification,
    messaging,
    media  # NEW
)

logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info(f"Starting up {settings.APP_NAME} v{settings.APP_VERSION}...")
    logger.info(f"Environment: {settings.ENVIRONMENT}")
    
    try:
        await init_db()
        await init_redis()
        logger.info("Database and cache connections established")
    except Exception as e:
        logger.error(f"Failed to initialize connections: {e}")
        raise
    
    yield
    
    # Shutdown
    logger.info("Shutting down...")
    try:
        await close_db()
        await close_redis()
        logger.info("Connections closed successfully")
    except Exception as e:
        logger.error(f"Error during shutdown: {e}")


app = FastAPI(
    title=settings.APP_NAME,
    description="AI-Driven Cultural Journey Navigator & Travel Social Platform",
    version=settings.APP_VERSION,
    lifespan=lifespan,
    docs_url="/docs" if not settings.is_production else None,
    redoc_url="/redoc" if not settings.is_production else None,
    openapi_url="/openapi.json" if not settings.is_production else None,
)

# ============================================================================
# MIDDLEWARE (Order matters - first added is first executed)
# ============================================================================

# Security headers first
app.add_middleware(SecurityHeadersMiddleware)

# Request ID and timing
app.add_middleware(RequestIDMiddleware)

# Rate limit headers
app.add_middleware(RateLimitHeadersMiddleware)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=settings.CORS_ALLOW_CREDENTIALS,
    allow_methods=settings.CORS_ALLOW_METHODS,
    allow_headers=settings.CORS_ALLOW_HEADERS,
)

# Compression
app.add_middleware(GZipMiddleware, minimum_size=1000)

# ============================================================================
# EXCEPTION HANDLERS
# ============================================================================

@app.exception_handler(JourniiException)
async def journii_exception_handler(request: Request, exc: JourniiException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error_code": exc.error_code,
            "message": exc.detail,
            "details": exc.extra_data,
            "request_id": getattr(request.state, 'request_id', None)
        }
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    logger.exception(f"Unhandled exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error_code": "INTERNAL_ERROR",
            "message": "An unexpected error occurred" if settings.is_production else str(exc),
            "request_id": getattr(request.state, 'request_id', None)
        }
    )

# ============================================================================
# ROUTERS
# ============================================================================

# Include all routers with proper prefixes
routers = [
    (auth.router, "/v1/auth", "Authentication"),
    (cultural.router, "/v1/cultural", "Cultural Explorer"),
    (transit.router, "/v1/transit", "Transit Planner"),
    (social.router, "/v1/social", "Social Companion"),
    (community.router, "/v1/community", "Community"),
    (itinerary.router, "/v1/itinerary", "Itinerary Builder"),
    (marketplace.router, "/v1/marketplace", "Marketplace"),
    (gamification.router, "/v1/gamification", "Gamification"),
    (messaging.router, "/v1/messaging", "Messaging"),
    (media.router, "/v1/media", "Media & Reels"),  # NEW
]

for router, prefix, tag in routers:
    app.include_router(router, prefix=prefix, tags=[tag])
    logger.info(f"Registered router: {tag} at {prefix}")

# WebSocket endpoints
@app.websocket("/ws/messaging")
async def websocket_messaging(websocket, token: str):
    from app.websocket.messaging import messaging_websocket
    await messaging_websocket(websocket, token)

# TODO: Add collaborative trip WebSocket
@app.websocket("/ws/trips/{trip_id}")
async def websocket_trip_collaboration(websocket, trip_id: str, token: str):
    from app.websocket.collaboration import trip_websocket
    await trip_websocket(websocket, trip_id, token)

# ============================================================================
# HEALTH CHECKS
# ============================================================================

@app.get("/", include_in_schema=False)
async def root():
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "operational",
        "environment": settings.ENVIRONMENT,
        "documentation": "/docs" if not settings.is_production else None
    }


@app.get("/health", tags=["Health"])
async def health_check():
    """Basic health check"""
    return {
        "status": "healthy",
        "timestamp": time.time(),
        "environment": settings.ENVIRONMENT
    }


@app.get("/health/detailed", tags=["Health"])
async def detailed_health_check():
    """Detailed health check with dependency status"""
    checks = {
        "api": True,
        "database": False,
        "redis": False,
        "storage": False
    }
    
    # Check database
    try:
        from app.db.session import get_engine
        engine = get_engine()
        # Would need async check here
        checks["database"] = True
    except:
        pass
    
    # Check redis
    try:
        from app.db.redis import get_redis
        r = get_redis()
        # Would need async check here
        checks["redis"] = True
    except:
        pass
    
    overall = all(checks.values())
    
    return {
        "status": "healthy" if overall else "degraded",
        "checks": checks,
        "timestamp": time.time()
    }