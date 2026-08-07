"""Seed the isolated demo schema with fictional data."""
from datetime import date, datetime

from src.auth.security import hash_password


def _sync_demo_user(db, username, email, full_name, role, password):
    """Create or repair a demo user row, enforcing the UI-advertised credentials."""
    from src.database import crud
    from src.database.models import User

    user = crud.get_user_by_username(db, username)
    if user is None:
        user = User(
            username=username,
            email=email,
            full_name=full_name,
            role=role,
            is_demo=True,
            is_active=True,
            password_hash=hash_password(password),
            password_changed_at=datetime.utcnow(),
        )
        db.add(user)
        db.flush()
        return user, False

    user.full_name = full_name
    user.role = role
    user.is_demo = True
    user.is_active = True
    user.email = email
    user.password_hash = hash_password(password)
    user.password_changed_at = datetime.utcnow()
    return user, True


def seed_demo_data(db=None):
    """Seed/repair the demo teacher + student users and linked student record."""
    _open_demo_session = None
    try:
        if db is None:
            from src.database.demo import _open_demo_session as _open_demo_session_fn
            _open_demo_session = _open_demo_session_fn
            db = _open_demo_session_fn()
        else:
            _open_demo_session = None

        from src.database import crud

        teacher_user, teacher_existed = _sync_demo_user(
            db, "teacher_demo", "teacher_demo@example.com", "Demo Teacher", "teacher", "teacher123",
        )
        student_user, student_existed = _sync_demo_user(
            db, "student_demo", "student_demo@example.com", "Demo Student", "student", "student123",
        )

        # Link the demo student to a Student record so the dashboard has data.
        student_code = "STU-DEMO-001"
        student = crud.get_student_by_code(db, student_code)
        if student is None:
            student = crud.create_student(
                db,
                {
                    "student_code": student_code,
                    "first_name": "Demo",
                    "last_name": "Student",
                    "email": "student_demo@example.com",
                    "date_of_birth": date(2005, 6, 15),
                    "gender": "Female",
                    "enrollment_date": date.today(),
                    "status": "active",
                },
            )
            crud.create_academic_record(
                db,
                {
                    "student_id": student.student_id,
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

        if student_user.student_id != student.student_id:
            student_user.student_id = student.student_id

        db.commit()
        print("INFO: Demo data seeded successfully")
    except Exception as exc:
        print(f"WARN: Demo seed skipped: {exc}")
    finally:
        if _open_demo_session is not None and db is not None:
            db.close()