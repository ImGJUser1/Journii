from sqlalchemy import Column, String, Integer, ForeignKey
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class Reward(Base):
    __tablename__ = "rewards"
    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    badge_name = Column(String, nullable=False)
    points = Column(Integer, nullable=False)
    message = Column(String, nullable=True)