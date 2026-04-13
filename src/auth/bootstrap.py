"""Bootstrap helpers for authentication setup."""
import os
from datetime import datetime

from src.auth.security import hash_password
from src.database import crud
from src.database.connection import SessionLocal


def _env_flag(name: str, default: str = "false") -> bool:
    value = os.getenv(name, default)
    return value.strip().lower() in {"1", "true", "yes", "on"}


def ensure_admin_user() -> None:
    """
    Ensure at least one admin user exists.
    Values can be overridden via environment variables.
    """
    username = os.getenv("ADMIN_USERNAME", "admin")
    email = os.getenv("ADMIN_EMAIL", "admin@studentai.com")
    password = os.getenv("ADMIN_PASSWORD", "admin123")
    full_name = os.getenv("ADMIN_FULL_NAME", "System Administrator")
    sync_admin_on_startup = _env_flag("ADMIN_SYNC_ON_STARTUP")

    db = SessionLocal()
    try:
        existing = crud.get_user_by_username(db, username) or crud.get_user_by_email(db, email)
        if existing:
            if not sync_admin_on_startup:
                return

            username_owner = crud.get_user_by_username(db, username)
            email_owner = crud.get_user_by_email(db, email)

            if username_owner and username_owner.user_id != existing.user_id:
                print(f"Skipped admin username sync because '{username}' is already used by another account")
            else:
                existing.username = username

            if email_owner and email_owner.user_id != existing.user_id:
                print(f"Skipped admin email sync because '{email}' is already used by another account")
            else:
                existing.email = email

            existing.password_hash = hash_password(password)
            existing.password_changed_at = datetime.utcnow()
            existing.full_name = full_name
            existing.role = "admin"
            existing.is_active = True
            db.commit()
            db.refresh(existing)
            print(f"Synchronized admin user from environment: {existing.username}")
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
