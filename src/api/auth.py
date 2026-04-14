"""Authentication API endpoints."""
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session

from src.auth.dependencies import get_current_user, require_roles
from src.auth.security import (
    ACCESS_TOKEN_EXPIRE_MINUTES,
    ACCOUNT_LOCK_MINUTES,
    MAX_FAILED_LOGIN_ATTEMPTS,
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    hash_refresh_token,
    verify_password,
)
from src.database import crud
from src.database.connection import get_db


router = APIRouter(prefix="/auth")


class LoginRequest(BaseModel):
    username_or_email: str = Field(..., min_length=3, max_length=255)
    password: str = Field(..., min_length=1, max_length=255)
    role: str = Field(..., pattern="^(admin|teacher|counselor|student|parent)$")


class RegisterRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=255)
    full_name: str = Field(..., min_length=2, max_length=200)
    role: str = Field("student", pattern="^(admin|teacher|counselor|student|parent)$")
    is_active: bool = True


class SignupRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=255)
    full_name: str = Field(..., min_length=2, max_length=200)
    role: str = Field(..., pattern="^(teacher|student)$")


class RefreshRequest(BaseModel):
    refresh_token: str = Field(..., min_length=10)


class LogoutRequest(BaseModel):
    refresh_token: str = Field(..., min_length=10)


class AuthTokensResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    access_token_expires_in: int


class UserResponse(BaseModel):
    user_id: str
    username: str
    email: EmailStr
    full_name: str
    role: str
    is_active: bool
    last_login: Optional[datetime]


class RegisterResponse(BaseModel):
    user_id: str
    username: str
    email: EmailStr
    full_name: str
    role: str
    is_active: bool
    created_at: datetime


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _extract_request_context(request: Request):
    ip_address = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")
    return ip_address, user_agent


def _log_auth_event(
    db: Session,
    action: str,
    request: Request,
    user_id: Optional[uuid.UUID] = None,
    details: Optional[dict] = None,
):
    ip_address, _ = _extract_request_context(request)
    crud.create_audit_log(
        db,
        {
            "user_id": user_id,
            "action": action,
            "table_name": "auth",
            "record_id": user_id,
            "new_values": details or {},
            "ip_address": ip_address,
        },
    )


@router.post("/register", response_model=RegisterResponse, status_code=201)
async def register_user(
    payload: RegisterRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("admin")),
):
    """
    Register a new user account.
    Admin-only endpoint.
    """
    existing_by_username = crud.get_user_by_username(db, payload.username.strip())
    if existing_by_username:
        _log_auth_event(
            db,
            "auth.register.failed",
            request,
            user_id=current_user.user_id,
            details={"reason": "username_exists", "username": payload.username},
        )
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Username already exists")

    existing_by_email = crud.get_user_by_email(db, payload.email)
    if existing_by_email:
        _log_auth_event(
            db,
            "auth.register.failed",
            request,
            user_id=current_user.user_id,
            details={"reason": "email_exists", "email": payload.email},
        )
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already exists")

    new_user = crud.create_user(
        db,
        {
            "username": payload.username.strip(),
            "email": payload.email,
            "password_hash": hash_password(payload.password),
            "role": payload.role,
            "full_name": payload.full_name.strip(),
            "is_active": payload.is_active,
            "password_changed_at": datetime.utcnow(),
        },
    )

    _log_auth_event(
        db,
        "auth.register.success",
        request,
        user_id=current_user.user_id,
        details={"created_user_id": str(new_user.user_id), "created_username": new_user.username},
    )

    return RegisterResponse(
        user_id=str(new_user.user_id),
        username=new_user.username,
        email=new_user.email,
        full_name=new_user.full_name,
        role=new_user.role or "student",
        is_active=new_user.is_active,
        created_at=new_user.created_at,
    )


@router.post("/signup", response_model=RegisterResponse, status_code=201)
async def signup_user(payload: SignupRequest, request: Request, db: Session = Depends(get_db)):
    """
    Public self-signup endpoint.
    Security constraint: self-signup users are always created with `student` role.
    """
    existing_by_username = crud.get_user_by_username(db, payload.username.strip())
    if existing_by_username:
        _log_auth_event(
            db,
            "auth.signup.failed",
            request,
            details={"reason": "username_exists", "username": payload.username},
        )
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Username already exists")

    existing_by_email = crud.get_user_by_email(db, payload.email)
    if existing_by_email:
        _log_auth_event(
            db,
            "auth.signup.failed",
            request,
            details={"reason": "email_exists", "email": payload.email},
        )
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already exists")

    new_user = crud.create_user(
        db,
        {
            "username": payload.username.strip(),
            "email": payload.email,
            "password_hash": hash_password(payload.password),
            "role": payload.role,
            "full_name": payload.full_name.strip(),
            "is_active": True,
            "password_changed_at": datetime.utcnow(),
        },
    )

    _log_auth_event(
        db,
        "auth.signup.success",
        request,
        user_id=new_user.user_id,
        details={"username": new_user.username},
    )

    return RegisterResponse(
        user_id=str(new_user.user_id),
        username=new_user.username,
        email=new_user.email,
        full_name=new_user.full_name,
        role=new_user.role or "student",
        is_active=new_user.is_active,
        created_at=new_user.created_at,
    )


@router.post("/login", response_model=AuthTokensResponse)
async def login(payload: LoginRequest, request: Request, db: Session = Depends(get_db)):
    """
    Authenticate a user and issue access/refresh tokens.
    """
    identifier = payload.username_or_email.strip()
    user = crud.get_user_by_email(db, identifier) if "@" in identifier else crud.get_user_by_username(db, identifier)
    if not user:
        _log_auth_event(db, "auth.login.failed", request, details={"reason": "user_not_found", "identifier": identifier})
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    if not user.is_active:
        _log_auth_event(db, "auth.login.failed", request, user_id=user.user_id, details={"reason": "inactive"})
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is inactive")

    # Strict Role Validation
    if user.role != payload.role:
        _log_auth_event(
            db, 
            "auth.login.failed", 
            request, 
            user_id=user.user_id, 
            details={"reason": "role_mismatch", "selected": payload.role, "actual": user.role}
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Invalid role selection for this account"
        )

    if user.locked_until and user.locked_until.replace(tzinfo=timezone.utc) > _utcnow():
        _log_auth_event(db, "auth.login.failed", request, user_id=user.user_id, details={"reason": "locked"})
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is temporarily locked")

    if not verify_password(payload.password, user.password_hash):
        lock_until = None
        next_attempts = (user.failed_login_attempts or 0) + 1
        if next_attempts >= MAX_FAILED_LOGIN_ATTEMPTS:
            lock_until = _utcnow() + timedelta(minutes=ACCOUNT_LOCK_MINUTES)
        crud.increment_failed_login_attempts(db, user.user_id, lock_until=lock_until)
        _log_auth_event(
            db,
            "auth.login.failed",
            request,
            user_id=user.user_id,
            details={"reason": "invalid_password", "attempts": next_attempts},
        )
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    crud.update_user_last_login(db, user.user_id)

    session_id = uuid.uuid4()
    token_family = uuid.uuid4()
    refresh_token = create_refresh_token(str(user.user_id), session_id=session_id, token_family=token_family)
    refresh_hash = hash_refresh_token(refresh_token)
    ip_address, user_agent = _extract_request_context(request)

    crud.create_auth_session(
        db,
        {
            "session_id": session_id,
            "user_id": user.user_id,
            "refresh_token_hash": refresh_hash,
            "token_family": token_family,
            "expires_at": _utcnow() + timedelta(days=7),
            "user_agent": user_agent,
            "ip_address": ip_address,
            "last_used_at": _utcnow(),
        },
    )

    access_token = create_access_token(str(user.user_id), user.username, user.role or "student")
    _log_auth_event(db, "auth.login.success", request, user_id=user.user_id, details={"username": user.username})

    return AuthTokensResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        access_token_expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


@router.post("/refresh", response_model=AuthTokensResponse)
async def refresh_tokens(payload: RefreshRequest, request: Request, db: Session = Depends(get_db)):
    """
    Rotate refresh token and issue a new access token.
    """
    try:
        token_payload = decode_token(payload.refresh_token, expected_type="refresh")
        session_id = uuid.UUID(token_payload["sid"])
        user_id = uuid.UUID(token_payload["sub"])
        token_family = uuid.UUID(token_payload["fam"])
    except Exception as exc:
        _log_auth_event(db, "auth.refresh.failed", request, details={"reason": "invalid_refresh_token"})
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token") from exc

    session = crud.get_auth_session_by_id(db, session_id)
    if not session:
        _log_auth_event(db, "auth.refresh.failed", request, user_id=user_id, details={"reason": "session_not_found"})
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

    if session.revoked_at is not None or session.expires_at.replace(tzinfo=timezone.utc) <= _utcnow():
        _log_auth_event(db, "auth.refresh.failed", request, user_id=user_id, details={"reason": "expired_or_revoked"})
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token expired or revoked")

    incoming_hash = hash_refresh_token(payload.refresh_token)
    if incoming_hash != session.refresh_token_hash:
        crud.revoke_auth_sessions_by_family(db, token_family, reason="refresh_reuse_detected")
        _log_auth_event(db, "auth.refresh.failed", request, user_id=user_id, details={"reason": "token_reuse_detected"})
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token rejected")

    user = crud.get_user_by_id(db, user_id)
    if not user or not user.is_active:
        crud.revoke_auth_session(db, session_id, reason="user_inactive")
        _log_auth_event(db, "auth.refresh.failed", request, user_id=user_id, details={"reason": "inactive_user"})
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not active")

    new_session_id = uuid.uuid4()
    new_refresh_token = create_refresh_token(str(user.user_id), session_id=new_session_id, token_family=token_family)
    ip_address, user_agent = _extract_request_context(request)

    new_session = crud.rotate_auth_session(
        db,
        old_session_id=session_id,
        new_session_data={
            "session_id": new_session_id,
            "user_id": user.user_id,
            "refresh_token_hash": hash_refresh_token(new_refresh_token),
            "token_family": token_family,
            "expires_at": _utcnow() + timedelta(days=7),
            "user_agent": user_agent,
            "ip_address": ip_address,
            "last_used_at": _utcnow(),
        },
        revoke_reason="rotated",
    )
    if not new_session:
        _log_auth_event(db, "auth.refresh.failed", request, user_id=user.user_id, details={"reason": "rotation_failed"})
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session rotation failed")

    access_token = create_access_token(str(user.user_id), user.username, user.role or "student")
    _log_auth_event(db, "auth.refresh.success", request, user_id=user.user_id, details={"session_id": str(new_session.session_id)})
    return AuthTokensResponse(
        access_token=access_token,
        refresh_token=new_refresh_token,
        access_token_expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


@router.post("/logout")
async def logout(payload: LogoutRequest, db: Session = Depends(get_db)):
    """
    Revoke one refresh session (idempotent).
    """
    try:
        token_payload = decode_token(payload.refresh_token, expected_type="refresh")
        session_id = uuid.UUID(token_payload["sid"])
        user_id = uuid.UUID(token_payload["sub"])
    except Exception:
        return {"message": "Logged out"}

    session = crud.get_auth_session_by_id(db, session_id)
    if session and session.revoked_at is None:
        crud.revoke_auth_session(db, session_id, reason="logout")
        crud.create_audit_log(
            db,
            {
                "user_id": user_id,
                "action": "auth.logout.success",
                "table_name": "auth_sessions",
                "record_id": session_id,
                "new_values": {"reason": "logout"},
            },
        )
    return {"message": "Logged out"}


@router.post("/logout-all")
async def logout_all(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Revoke all active sessions for the current user.
    """
    revoked = crud.revoke_all_auth_sessions_for_user(db, current_user.user_id, reason="logout_all")
    crud.create_audit_log(
        db,
        {
            "user_id": current_user.user_id,
            "action": "auth.logout_all.success",
            "table_name": "auth_sessions",
            "record_id": current_user.user_id,
            "new_values": {"revoked_sessions": revoked},
        },
    )
    return {"message": "All sessions revoked", "revoked_sessions": revoked}


@router.get("/me", response_model=UserResponse)
async def me(current_user=Depends(get_current_user)):
    """
    Get currently authenticated user profile.
    """
    return UserResponse(
        user_id=str(current_user.user_id),
        username=current_user.username,
        email=current_user.email,
        full_name=current_user.full_name,
        role=current_user.role or "student",
        is_active=current_user.is_active,
        last_login=current_user.last_login,
    )
