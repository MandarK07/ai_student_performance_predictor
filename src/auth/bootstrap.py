"""Bootstrap helpers for authentication setup."""
import os
from datetime import datetime, date

from src.auth.security import hash_password
from src.database import crud
from src.database.connection import SessionLocal
from src.database.models import Student


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


def _upsert_demo_user(
    db,
    username: str,
    email: str,
    password: str,
    full_name: str,
    role: str,
    student_id=None,
):
    """Create or reset a single demo user account."""
    existing = crud.get_user_by_username(db, username)
    if existing:
        # Always reset password and ensure account is active
        existing.password_hash = hash_password(password)
        existing.password_changed_at = datetime.utcnow()
        existing.full_name = full_name
        existing.role = role
        existing.is_active = True
        existing.failed_login_attempts = 0
        existing.locked_until = None
        if student_id is not None:
            existing.student_id = student_id
        db.commit()
        db.refresh(existing)
        return existing

    return crud.create_user(
        db,
        {
            "username": username,
            "email": email,
            "password_hash": hash_password(password),
            "role": role,
            "full_name": full_name,
            "is_active": True,
            "password_changed_at": datetime.utcnow(),
            "student_id": student_id,
        },
    )


def ensure_demo_users() -> None:
    """
    Create or synchronize demo teacher and demo student accounts.
    The student account is linked to a Student record so the student
    dashboard works out of the box.
    """
    db = SessionLocal()
    try:
        # --- Demo Teacher ---
        teacher = _upsert_demo_user(
            db,
            username="teacher_demo",
            email="teacher_demo@studentai.com",
            password="teacher123",
            full_name="Demo Teacher",
            role="teacher",
        )
        print(f"Demo teacher ready: {teacher.username}")

        # --- Demo Student (needs a linked Student record) ---
        student_code = "DEMO-STU-001"
        student_record = crud.get_student_by_code(db, student_code)
        if not student_record:
            student_record = crud.create_student(
                db,
                {
                    "student_code": student_code,
                    "first_name": "Demo",
                    "last_name": "Student",
                    "email": "student_demo@studentai.com",
                    "date_of_birth": date(2003, 6, 15),
                    "gender": "Prefer not to say",
                    "enrollment_date": date.today(),
                    "status": "active",
                },
            )
            # Add a sample academic record so the dashboard has data
            crud.create_academic_record(
                db,
                {
                    "student_id": student_record.student_id,
                    "academic_year": "2025-2026",
                    "semester": "Fall",
                    "gpa": 3.45,
                    "total_credits": 18,
                    "attendance_rate": 88.5,
                    "study_hours_per_week": 14.0,
                    "class_participation_score": 7.5,
                    "late_submissions": 2,
                    "absences": 4,
                },
            )
            print(f"Created demo student record: {student_code}")

        student_user = _upsert_demo_user(
            db,
            username="student_demo",
            email="student_demo@studentai.com",
            password="student123",
            full_name="Demo Student",
            role="student",
            student_id=student_record.student_id,
        )
        print(f"Demo student ready: {student_user.username}")

    finally:
        db.close()
