from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.config import Config
from app.models import Base

# Database setup
engine = create_engine(Config.DATABASE_URL)
Base.metadata.create_all(engine)
SessionLocal = sessionmaker(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()