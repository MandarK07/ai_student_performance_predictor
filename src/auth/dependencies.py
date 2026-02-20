"""FastAPI auth dependencies."""
import uuid
from typing import Callable

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from src.auth.security import decode_token
from src.database.connection import get_db
from src.database import crud


bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    request: Request = None,
    db: Session = Depends(get_db),
):
    ip_address = request.client.host if request and request.client else None
    endpoint = f"{request.method} {request.url.path}" if request else "unknown"

    if not credentials:
        crud.create_audit_log(
            db,
            {
                "action": "api.access.denied",
                "table_name": "auth",
                "new_values": {"reason": "missing_token", "endpoint": endpoint},
                "ip_address": ip_address,
            },
        )
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")

    try:
        payload = decode_token(credentials.credentials, expected_type="access")
        user_id = uuid.UUID(payload["sub"])
    except Exception as exc:
        crud.create_audit_log(
            db,
            {
                "action": "api.access.denied",
                "table_name": "auth",
                "new_values": {"reason": "invalid_token", "endpoint": endpoint},
                "ip_address": ip_address,
            },
        )
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid access token") from exc

    user = crud.get_user_by_id(db, user_id)
    if not user or not user.is_active:
        crud.create_audit_log(
            db,
            {
                "user_id": user_id,
                "action": "api.access.denied",
                "table_name": "users",
                "record_id": user_id,
                "new_values": {"reason": "inactive_or_missing_user", "endpoint": endpoint},
                "ip_address": ip_address,
            },
        )
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not active")
    return user


def require_roles(*allowed_roles: str) -> Callable:
    def role_dependency(
        request: Request,
        db: Session = Depends(get_db),
        current_user=Depends(get_current_user)
    ):
        endpoint = f"{request.method} {request.url.path}"
        ip_address = request.client.host if request.client else None

        if current_user.role not in allowed_roles:
            crud.create_audit_log(
                db,
                {
                    "user_id": current_user.user_id,
                    "action": "api.access.denied",
                    "table_name": "users",
                    "record_id": current_user.user_id,
                    "new_values": {
                        "reason": "insufficient_role",
                        "role": current_user.role,
                        "allowed_roles": list(allowed_roles),
                        "endpoint": endpoint,
                    },
                    "ip_address": ip_address,
                },
            )
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")

        crud.create_audit_log(
            db,
            {
                "user_id": current_user.user_id,
                "action": "api.access.granted",
                "table_name": "users",
                "record_id": current_user.user_id,
                "new_values": {"role": current_user.role, "endpoint": endpoint},
                "ip_address": ip_address,
            },
        )
        return current_user

    return role_dependency
