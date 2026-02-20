"""Authentication security utilities (password hashing and JWT)."""
import hashlib
import os
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Dict

from jose import JWTError, jwt
from passlib.context import CryptContext


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

JWT_SECRET = os.getenv("JWT_SECRET", "change-me-in-production")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_ISSUER = os.getenv("JWT_ISSUER", "ai-student-performance-predictor")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "15"))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))
MAX_FAILED_LOGIN_ATTEMPTS = int(os.getenv("MAX_FAILED_LOGIN_ATTEMPTS", "5"))
ACCOUNT_LOCK_MINUTES = int(os.getenv("ACCOUNT_LOCK_MINUTES", "15"))


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except Exception:
        # Treat backend/hash failures as invalid credentials instead of 500.
        return False


def hash_refresh_token(refresh_token: str) -> str:
    return hashlib.sha256(refresh_token.encode("utf-8")).hexdigest()


def _encode_token(payload: Dict[str, Any], expires_delta: timedelta) -> str:
    issued_at = now_utc()
    expire_at = issued_at + expires_delta
    token_payload = {
        **payload,
        "iss": JWT_ISSUER,
        "iat": int(issued_at.timestamp()),
        "exp": int(expire_at.timestamp()),
    }
    return jwt.encode(token_payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def create_access_token(user_id: str, username: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "username": username,
        "role": role,
        "token_type": "access",
    }
    return _encode_token(payload, timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))


def create_refresh_token(user_id: str, session_id: uuid.UUID, token_family: uuid.UUID) -> str:
    payload = {
        "sub": user_id,
        "sid": str(session_id),
        "fam": str(token_family),
        "token_type": "refresh",
    }
    return _encode_token(payload, timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS))


def decode_token(token: str, expected_type: str) -> Dict[str, Any]:
    try:
        payload = jwt.decode(
            token,
            JWT_SECRET,
            algorithms=[JWT_ALGORITHM],
            issuer=JWT_ISSUER,
            options={"require_exp": True, "require_iat": True, "require_sub": True},
        )
    except JWTError as exc:
        raise ValueError("Invalid token") from exc

    token_type = payload.get("token_type")
    if token_type != expected_type:
        raise ValueError("Invalid token type")
    return payload
