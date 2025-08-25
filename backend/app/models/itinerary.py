from sqlalchemy import Column, String, JSON, ForeignKey
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class Itinerary(Base):
    __tablename__ = "itineraries"
    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    schedule = Column(String, nullable=False)  # e.g., "2025-08-25 09:00-17:00"
    stops = Column(JSON, nullable=False)  # List of stops with details
    transit_details = Column(JSON, nullable=True)  # Transit routes