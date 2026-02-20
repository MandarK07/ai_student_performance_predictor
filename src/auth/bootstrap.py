"""Bootstrap helpers for authentication setup."""
import os
from datetime import datetime

from src.auth.security import hash_password
from src.database import crud
from src.database.connection import SessionLocal


def ensure_admin_user() -> None:
    """
    Ensure at least one admin user exists.
    Values can be overridden via environment variables.
    """
    username = os.getenv("ADMIN_USERNAME", "admin")
    email = os.getenv("ADMIN_EMAIL", "admin@studentai.com")
    password = os.getenv("ADMIN_PASSWORD", "admin123")
    full_name = os.getenv("ADMIN_FULL_NAME", "System Administrator")

    db = SessionLocal()
    try:
        existing = crud.get_user_by_username(db, username) or crud.get_user_by_email(db, email)
        if existing:
            return

        crud.create_user(
            db,
            {
                "username": username,
                "email": email,
                "password_hash": hash_password(password),
                "role": "admin",
                "full_name": full_name,
                "is_active": True,
                "password_changed_at": datetime.utcnow(),
            },
        )
        print(f"Created default admin user: {username}")
    finally:
        db.close()
