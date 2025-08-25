import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Config:
    # Database
    DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./journii.db")

    # External APIs
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
    TRANSIT_API_URL = os.getenv("TRANSIT_API_URL", "https://api.example.com/transit")  # TODO: Replace with real API

    # Security / JWT
    JWT_SECRET = os.getenv("JWT_SECRET", "your-secure-secret")
    JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
    JWT_EXPIRY_MINUTES = int(os.getenv("JWT_EXPIRY_MINUTES", 60))

    # App settings
    RATE_LIMIT_RETRIES = int(os.getenv("RATE_LIMIT_RETRIES", 3))
    CACHE_TIMEOUT = int(os.getenv("CACHE_TIMEOUT", 300))  # Seconds
