import os
from typing import Generator
from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from src.core.config import settings

# Database configuration
DATABASE_URL = settings.get_database_url

print(f"INFO: Connecting to database at {DATABASE_URL.split('@')[-1]}")

# Create SQLAlchemy engine
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,  # Verify connections before using
    pool_size=settings.DB_PORT != 5432 and 5 or 10,  # Smaller pool for cloud DBs
    max_overflow=20,
    echo=False
)

# Create SessionLocal class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()

# Dependency to get database session
def get_db() -> Generator[Session, None, None]:
    """
    Create a database session and ensure it's closed after use.
    Use this as a FastAPI dependency.
    
    Example:
        @app.get("/students")
        def get_students(db: Session = Depends(get_db)):
            return db.query(Student).all()
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Test database connection
def test_connection():
    """Test if database connection is working"""
    try:
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
        print("Database connection successful!")
        return True
    except Exception as e:
        print(f"Database connection failed: {e}")
        return False

# Initialize database tables
def init_db():
    """Create all tables in the database"""
    Base.metadata.create_all(bind=engine)
    print("Database tables initialized!")
