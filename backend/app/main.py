from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import cultural_explorer, transit_planner, social_companion, itinerary_builder, community_sharing, gamification, auth
from app.utils.database import get_db

app = FastAPI(title="Journii Backend API", description="Backend for Journii Cultural Journey Navigator & Social Commuter Companion")

# Enable CORS for UI integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:19006", "http://localhost:8000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers for all modules
app.include_router(cultural_explorer.router, prefix="/cultural", tags=["Cultural Explorer"])
app.include_router(transit_planner.router, prefix="/transit", tags=["Transit Planner"])
app.include_router(social_companion.router, prefix="/social", tags=["Social Companion"])
app.include_router(itinerary_builder.router, prefix="/itinerary", tags=["Itinerary Builder"])
app.include_router(community_sharing.router, prefix="/community", tags=["Community Sharing"])
app.include_router(gamification.router, prefix="/gamification", tags=["Gamification"])
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])

@app.get("/")
async def root():
    return {"message": "Welcome to Journii Backend API"}