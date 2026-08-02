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

# Dedicated engine + session for the isolated demo schema.
# A separate pool is required: `SET search_path` is sticky on a PostgreSQL
# connection, so sharing one pool would leak the demo schema into ordinary
# production requests (e.g. "admin" suddenly not found after demo init).
demo_engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
    echo=False,
)
DemoSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=demo_engine)

def create_tenant_session(schema: str) -> Session:
    """Open a session pinned to the given PostgreSQL schema for full isolation."""
    session = DemoSessionLocal()
    session.execute(text(f'SET search_path TO "{schema}"'))
    session.commit()
    return session

# Base class for models
Base = declarative_base()


# Dependency to get database session (auto-routes demo users to the demo schema)
def get_db() -> Generator[Session, None, None]:
    """
    Create a database session and ensure it's closed after use.
    Demo requests are routed to the isolated 'demo' schema so demo users
    can never read or write production data.
    """
    from src.database.demo import request_is_demo
    db = create_tenant_session(settings.DEMO_SCHEMA) if request_is_demo() else SessionLocal()
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
    _ensure_is_demo_column()
    print("Database tables initialized!")


def init_demo_schema():
    """Create the isolated 'demo' schema and all tables inside it."""
    with engine.begin() as conn:
        conn.execute(text(f"CREATE SCHEMA IF NOT EXISTS {settings.DEMO_SCHEMA}"))
    for table in Base.metadata.sorted_tables:
        table.schema = settings.DEMO_SCHEMA
    Base.metadata.create_all(bind=engine)
    for table in Base.metadata.sorted_tables:
        table.schema = None
    print(f"INFO: Demo schema '{settings.DEMO_SCHEMA}' initialized")


def init_demo_tables(db=None):
    """Best-effort table creation for an already-created demo schema."""
    init_demo_schema()


def _ensure_is_demo_column():
    """Add is_demo to existing production users tables if missing."""
    try:
        from sqlalchemy import inspect
        cols = [c["name"] for c in inspect(engine).get_columns("users")]
        if "is_demo" not in cols:
            with engine.begin() as conn:
                conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT FALSE"))
            print("INFO: Added is_demo column to users table")
    except Exception as exc:
        print(f"WARN: Could not ensure is_demo column: {exc}")
