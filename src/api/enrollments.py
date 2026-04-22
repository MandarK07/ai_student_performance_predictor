from datetime import datetime, timedelta
import uuid
import hashlib
from fastapi import APIRouter, Depends, HTTPException, status
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
    matched_by: str
    linked_student: dict


class AcceptInviteRequest(BaseModel):
    token: str = Field(..., min_length=8)
    password: str | None = Field(None, min_length=6)


class LinkingRequestCreate(BaseModel):
    student_code: str | None = None


class LinkingRequestResponse(BaseModel):
    request_id: uuid.UUID
    user_id: uuid.UUID
    email: str
    full_name: str | None
    student_code: str | None
    status: str
    created_at: datetime
    
    class Config:
        from_attributes = True


class LinkingRequestResolve(BaseModel):
    admin_notes: str | None = None
    link_to_student_id: uuid.UUID | None = None


def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def _generate_token() -> str:
    return uuid.uuid4().hex


@router.post("/enrollments/preview")
async def preview_invite_target(
    payload: InviteRequest,
    db: Session = Depends(get_db),
    _current_user=Depends(require_roles("admin", "teacher"))
):
    student, matched_by = _resolve_student_for_invite_payload(
        db,
        email=payload.email,
        student_code=payload.student_code,
    )
    return {
        "matched_by": matched_by,
        "linked_student": _build_linked_student_payload(student, matched_by),
    }


@router.post("/enrollments/invite", response_model=InviteResponse)
async def create_invite(
    payload: InviteRequest,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("admin", "teacher"))
):
    student, matched_by = _resolve_student_for_invite_payload(
        db,
        email=payload.email,
        student_code=payload.student_code,
    )

    token = _generate_token()
    token_hash = _hash_token(token)
    expires_at = datetime.utcnow() + timedelta(days=7)

    invite = EnrollmentInvite(
        token_hash=token_hash,
        email=payload.email,
        student_code=student.student_code,
        first_name=student.first_name,
        last_name=student.last_name,
        expires_at=expires_at,
        created_by=current_user.user_id,
    )
    db.add(invite)
    db.commit()
    db.refresh(invite)

    return InviteResponse(
        invite_id=str(invite.invite_id),
        token=token,
        expires_at=expires_at,
        matched_by=matched_by,
        linked_student=_build_linked_student_payload(student, matched_by),
    )


def _get_invite(db: Session, token: str) -> EnrollmentInvite:
    token_hash = _hash_token(token)
    invite = db.query(EnrollmentInvite).filter(EnrollmentInvite.token_hash == token_hash).first()
    if not invite:
        raise HTTPException(status_code=404, detail="PENDING_INVITE_NOT_FOUND")
    if invite.status != "pending":
        raise HTTPException(status_code=400, detail="Invite already used or cancelled")
    if invite.expires_at < datetime.utcnow():
        invite.status = "expired"
        db.commit()
        raise HTTPException(status_code=410, detail="Invite expired")
    return invite


def _build_linked_student_payload(student, matched_by: str) -> dict:
    return {
        "student_id": str(student.student_id),
        "student_code": student.student_code,
        "full_name": f"{student.first_name} {student.last_name}",
        "email": student.email,
        "matched_by": matched_by,
    }


def _resolve_student_for_invite_payload(db: Session, email: str, student_code: str | None = None):
    student, error, matched_by = crud.find_existing_student_for_link(
        db,
        email=email,
        student_code=student_code,
    )
    if error or not student:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=error or "No matching student record found",
        )
    return student, matched_by or "email"


def _resolve_student_for_invite(db: Session, invite: EnrollmentInvite):
    student, _matched_by = _resolve_student_for_invite_payload(
        db,
        email=invite.email,
        student_code=invite.student_code,
    )
    return student


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

    student = _resolve_student_for_invite(db, invite)

    # Link user -> student
    current_user.student_id = student.student_id
    db.commit()

    invite.status = "accepted"
    invite.accepted_at = datetime.utcnow()
    db.commit()

    return {"message": "Enrollment completed", "student_code": student.student_code}


# =============================================================================
# STUDENT LINKING REQUESTS
# =============================================================================

@router.post("/enrollments/request-link", response_model=LinkingRequestResponse)
async def request_linking(
    payload: LinkingRequestCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Student initiates a request to be linked to their academic record."""
    if current_user.role != "student":
        raise HTTPException(status_code= status.HTTP_403_FORBIDDEN, detail="Only students can request linking")
    if getattr(current_user, "student_id", None):
        raise HTTPException(status_code= status.HTTP_400_BAD_REQUEST, detail="Account already linked to a student")
    
    request_data = {
        "user_id": current_user.user_id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "student_code": payload.student_code,
        "status": "pending"
    }
    return crud.create_linking_request(db, request_data)


@router.get("/enrollments/my-request", response_model=LinkingRequestResponse | None)
async def get_my_linking_request(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Get the current user's pending linking request status."""
    return crud.get_user_pending_linking_request(db, current_user.user_id)


@router.get("/enrollments/link-requests", response_model=list[LinkingRequestResponse])
async def get_all_linking_requests(
    status: str | None = None,
    db: Session = Depends(get_db),
    _current_user=Depends(require_roles("admin", "teacher"))
):
    """Admin/Teacher views linking requests."""
    return crud.get_linking_requests(db, status=status)


@router.post("/enrollments/link-requests/{request_id}/approve")
async def approve_linking_request(
    request_id: uuid.UUID,
    payload: LinkingRequestResolve,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("admin", "teacher"))
):
    """Admin/Teacher approves a linking request."""
    request = crud.get_linking_request_by_id(db, request_id)
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")
    if request.status != "pending":
        raise HTTPException(status_code=400, detail=f"Request is already {request.status}")

    if not payload.link_to_student_id:
        raise HTTPException(status_code=400, detail="link_to_student_id is required for approval")
    
    student = crud.get_student_by_id(db, payload.link_to_student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Target student record not found")

    target_user = crud.get_user_by_id(db, request.user_id)
    if target_user:
        target_user.student_id = student.student_id
    
    request.status = "approved"
    request.admin_notes = payload.admin_notes
    request.resolved_at = datetime.utcnow()
    request.resolved_by = current_user.user_id
    
    db.commit()
    return {"message": "Request approved and student linked"}


@router.post("/enrollments/link-requests/{request_id}/reject")
async def reject_linking_request(
    request_id: uuid.UUID,
    payload: LinkingRequestResolve,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("admin", "teacher"))
):
    """Admin/Teacher rejects a linking request."""
    request = crud.get_linking_request_by_id(db, request_id)
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")
    if request.status != "pending":
        raise HTTPException(status_code=400, detail=f"Request is already {request.status}")

    request.status = "rejected"
    request.admin_notes = payload.admin_notes
    request.resolved_at = datetime.utcnow()
    request.resolved_by = current_user.user_id
    
    db.commit()
    return {"message": "Request rejected"}


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

    student = _resolve_student_for_invite(db, invite)

    user_data = {
        "username": invite.email.split("@")[0],
        "email": invite.email,
        "password_hash": hash_password(payload.password),
        "role": "student",
        "full_name": f"{invite.first_name or 'Student'} {invite.last_name or ''}".strip() or invite.email,
        "is_active": True,
    }
    user = crud.create_user(db, user_data)

    user.student_id = student.student_id
    db.commit()

    invite.status = "accepted"
    invite.accepted_at = datetime.utcnow()
    db.commit()

    return {"message": "Enrollment completed", "student_code": student.student_code}
