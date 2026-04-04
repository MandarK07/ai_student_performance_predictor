from datetime import datetime, timedelta
import uuid
import hashlib
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session

from src.auth.dependencies import require_roles, get_current_user
from src.auth.security import hash_password
from src.database.connection import get_db
from src.database import crud
from src.database.models import EnrollmentInvite

router = APIRouter()


class InviteRequest(BaseModel):
    email: EmailStr
    student_code: str | None = None
    first_name: str | None = None
    last_name: str | None = None


class InviteResponse(BaseModel):
    invite_id: str
    token: str
    expires_at: datetime


class AcceptInviteRequest(BaseModel):
    token: str = Field(..., min_length=8)
    password: str | None = Field(None, min_length=6)
    first_name: str | None = None
    last_name: str | None = None
    student_code: str | None = None


def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def _generate_token() -> str:
    return uuid.uuid4().hex


@router.post("/enrollments/invite", response_model=InviteResponse)
async def create_invite(
    payload: InviteRequest,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("admin", "teacher"))
):
    token = _generate_token()
    token_hash = _hash_token(token)
    expires_at = datetime.utcnow() + timedelta(days=7)

    invite = EnrollmentInvite(
        token_hash=token_hash,
        email=payload.email,
        student_code=payload.student_code,
        first_name=payload.first_name,
        last_name=payload.last_name,
        expires_at=expires_at,
        created_by=current_user.user_id,
    )
    db.add(invite)
    db.commit()
    db.refresh(invite)

    return InviteResponse(invite_id=str(invite.invite_id), token=token, expires_at=expires_at)


def _get_invite(db: Session, token: str) -> EnrollmentInvite:
    token_hash = _hash_token(token)
    invite = db.query(EnrollmentInvite).filter(EnrollmentInvite.token_hash == token_hash).first()
    if not invite:
        raise HTTPException(status_code=404, detail="Invite not found")
    if invite.status != "pending":
        raise HTTPException(status_code=400, detail="Invite already used or cancelled")
    if invite.expires_at < datetime.utcnow():
        invite.status = "expired"
        db.commit()
        raise HTTPException(status_code=410, detail="Invite expired")
    return invite


@router.get("/enrollments/status/{token}")
async def invite_status(token: str, db: Session = Depends(get_db)):
    invite = _get_invite(db, token)
    return {
        "email": invite.email,
        "student_code": invite.student_code,
        "first_name": invite.first_name,
        "last_name": invite.last_name,
        "expires_at": invite.expires_at,
        "status": invite.status,
    }


@router.post("/enrollments/accept")
async def accept_invite(
    payload: AcceptInviteRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    invite = _get_invite(db, payload.token)

    # Ensure the accepting user matches the invite email
    if current_user.email.lower() != invite.email.lower():
        raise HTTPException(status_code=403, detail="Invite email does not match your account")

    # Ensure role is student
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Only student accounts can accept this invite")

    # Link or create student record
    student = crud.get_student_by_email(db, invite.email)
    if not student:
        # Create student
        student_data = {
            "student_code": invite.student_code or (invite.email.split("@")[0]).upper(),
            "first_name": invite.first_name or current_user.full_name.split(" ")[0],
            "last_name": invite.last_name or current_user.full_name.split(" ")[-1],
            "email": invite.email,
            "date_of_birth": datetime(2005, 1, 1).date(),
            "gender": "Prefer not to say",
            "enrollment_date": datetime.utcnow().date()
        }
        student = crud.create_student(db, student_data)

    # Link user -> student
    current_user.student_id = student.student_id
    db.commit()

    invite.status = "accepted"
    invite.accepted_at = datetime.utcnow()
    db.commit()

    return {"message": "Enrollment completed", "student_code": student.student_code}


# Optional unauthenticated accept (signup + accept)
@router.post("/enrollments/accept/signup")
async def accept_invite_with_signup(
    payload: AcceptInviteRequest,
    db: Session = Depends(get_db),
):
    invite = _get_invite(db, payload.token)

    if not payload.password:
        raise HTTPException(status_code=400, detail="Password required for signup path")

    existing_user = crud.get_user_by_email(db, invite.email)
    if existing_user:
        raise HTTPException(status_code=400, detail="User already exists, please login and accept invite")

    user_data = {
        "username": invite.email.split("@")[0],
        "email": invite.email,
        "password_hash": hash_password(payload.password),
        "role": "student",
        "full_name": f"{invite.first_name or 'Student'} {invite.last_name or ''}".strip() or invite.email,
        "is_active": True,
    }
    user = crud.create_user(db, user_data)

    student_data = {
        "student_code": payload.student_code or invite.student_code or (invite.email.split("@")[0]).upper(),
        "first_name": invite.first_name or user.username,
        "last_name": invite.last_name or "Student",
        "email": invite.email,
        "date_of_birth": datetime(2005, 1, 1).date(),
        "gender": "Prefer not to say",
        "enrollment_date": datetime.utcnow().date()
    }
    student = crud.create_student(db, student_data)

    user.student_id = student.student_id
    db.commit()

    invite.status = "accepted"
    invite.accepted_at = datetime.utcnow()
    db.commit()

    return {"message": "Enrollment completed", "student_code": student.student_code}
