from sqlalchemy import Column, String, Boolean, JSON
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True)
    email = Column(String, unique=True, nullable=False)
    preferences = Column(JSON, nullable=True)  # Stores interests, transit preferences, etc.
    is_premium = Column(Boolean, default=False)  # For freemium/premium tiers
    privacy_level = Column(String, default="public")  # e.g., "public", "friends_only"