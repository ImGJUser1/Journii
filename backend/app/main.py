from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import time

from app.core.config import settings
from app.core.logging import get_logger
from app.core.exceptions import JourniiException
from app.db.session import init_db, close_db
from app.db.redis import init_redis, close_redis
from app.api.v1 import auth, cultural, transit, social, community, itinerary, marketplace, gamification, messaging
from app.websocket.messaging import messaging_websocket

logger = get_logger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting up Journii API...")
    init_db()
    await init_redis()
    logger.info("Journii API started successfully")
    
    yield
    
    # Shutdown
    logger.info("Shutting down Journii API...")
    close_db()
    await close_redis()
    logger.info("Journii API shut down successfully")

app = FastAPI(
    title=settings.APP_NAME,
    description="AI-Driven Cultural Journey Navigator & Travel Social Platform",
    version=settings.APP_VERSION,
    lifespan=lifespan,
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
)

# Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if settings.DEBUG else ["https://journii.app", "https://www.journii.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Exception handler
@app.exception_handler(JourniiException)
async def journii_exception_handler(request: Request, exc: JourniiException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "detail": exc.detail,
            "error_code": exc.error_code,
            "extra_data": exc.extra_data
        }
    )

# Request timing middleware
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    return response

# Include routers
app.include_router(auth.router, prefix="/v1/auth", tags=["Authentication"])
app.include_router(cultural.router, prefix="/v1/cultural", tags=["Cultural Explorer"])
app.include_router(transit.router, prefix="/v1/transit", tags=["Transit Planner"])
app.include_router(social.router, prefix="/v1/social", tags=["Social Companion"])
app.include_router(community.router, prefix="/v1/community", tags=["Community"])
app.include_router(itinerary.router, prefix="/v1/itinerary", tags=["Itinerary Builder"])
app.include_router(marketplace.router, prefix="/v1/marketplace", tags=["Marketplace"])
app.include_router(gamification.router, prefix="/v1/gamification", tags=["Gamification"])
app.include_router(messaging.router, prefix="/v1/messaging", tags=["Messaging"])

# WebSocket endpoint
@app.websocket("/ws/messaging")
async def websocket_endpoint(websocket, token: str):
    await messaging_websocket(websocket, token)

@app.get("/")
async def root():
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "operational",
        "documentation": "/docs" if settings.DEBUG else None
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": time.time(),
        "environment": settings.ENVIRONMENT
    }