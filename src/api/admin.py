"""Admin management API endpoints"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, EmailStr

from src.auth.dependencies import require_roles
from src.database.connection import get_db
from src.database import crud
from src.database.models import User, AuditLog

router = APIRouter()

# Schema for User summary response
class UserSummaryResponse(BaseModel):
    user_id: str
    username: str
    email: EmailStr
    full_name: str
    role: str
    is_active: bool
    last_login: Optional[datetime]
    student_id: Optional[str] = None

# Schema for Audit log response
class AuditLogResponse(BaseModel):
    log_id: str
    action: str
    table_name: Optional[str]
    created_at: datetime
    user_id: Optional[str]

@router.get("/admin/users", response_model=List[UserSummaryResponse])
async def get_all_users(
    skip: int = 0, limit: int = 100,
    current_user=Depends(require_roles("admin")),
    db: Session = Depends(get_db)
):
    """Get all users (Admin only)"""
    users = db.query(User).offset(skip).limit(limit).all()
    return [
        UserSummaryResponse(
            user_id=str(u.user_id),
            username=u.username,
            email=u.email,
            full_name=u.full_name,
            role=u.role or "unknown",
            is_active=u.is_active,
            last_login=u.last_login,
            student_id=str(u.student_id) if u.student_id else None
        ) for u in users
    ]

@router.delete("/admin/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: str,
    current_user=Depends(require_roles("admin")),
    db: Session = Depends(get_db)
):
    """Soft delete a user by preventing login (Admin only)"""
    user_to_delete = crud.get_user_by_id(db, user_id)
    if not user_to_delete:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Don't let admin delete themselves
    if str(user_to_delete.user_id) == str(current_user.user_id):
        raise HTTPException(status_code=400, detail="Cannot delete your own admin account")
        
    user_to_delete.is_active = False
    
    # Revoke sessions
    crud.revoke_all_auth_sessions_for_user(db, user_to_delete.user_id, reason="admin_delete")
    
    crud.create_audit_log(
        db,
        {
            "user_id": current_user.user_id,
            "action": "admin.user.delete",
            "table_name": "users",
            "record_id": user_to_delete.user_id,
            "new_values": {"is_active": False}
        }
    )
    
    db.commit()
    return None

# Schema for updating user
class UserUpdateRequest(BaseModel):
    role: Optional[str] = None
    is_active: Optional[bool] = None

@router.patch("/admin/users/{user_id}", response_model=UserSummaryResponse)
async def update_user(
    user_id: str,
    payload: UserUpdateRequest,
    current_user=Depends(require_roles("admin")),
    db: Session = Depends(get_db)
):
    """Update a user's role or active status (Admin only)"""
    user = crud.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    allowed_roles = {"admin", "teacher", "student"}
    old_values = {}
    new_values = {}

    if payload.role is not None:
        if payload.role not in allowed_roles:
            raise HTTPException(status_code=400, detail=f"Invalid role. Must be one of: {', '.join(allowed_roles)}")
        # Don't let the only admin demote themselves
        if str(user.user_id) == str(current_user.user_id) and payload.role != "admin":
            raise HTTPException(status_code=400, detail="Cannot change your own admin role")
        old_values["role"] = user.role
        user.role = payload.role
        new_values["role"] = payload.role

    if payload.is_active is not None:
        if str(user.user_id) == str(current_user.user_id) and not payload.is_active:
            raise HTTPException(status_code=400, detail="Cannot deactivate your own account")
        old_values["is_active"] = user.is_active
        user.is_active = payload.is_active
        new_values["is_active"] = payload.is_active
        # If deactivating, revoke sessions
        if not payload.is_active:
            crud.revoke_all_auth_sessions_for_user(db, user.user_id, reason="admin_deactivate")

    if not new_values:
        raise HTTPException(status_code=400, detail="No fields to update")

    crud.create_audit_log(
        db,
        {
            "user_id": current_user.user_id,
            "action": "admin.user.update",
            "table_name": "users",
            "record_id": user.user_id,
            "old_values": old_values,
            "new_values": new_values,
        }
    )
    db.commit()
    db.refresh(user)

    return UserSummaryResponse(
        user_id=str(user.user_id),
        username=user.username,
        email=user.email,
        full_name=user.full_name,
        role=user.role or "unknown",
        is_active=user.is_active,
        last_login=user.last_login
    )

@router.get("/admin/audit-logs", response_model=List[AuditLogResponse])
async def get_audit_logs(
    skip: int = 0, limit: int = 100,
    current_user=Depends(require_roles("admin")),
    db: Session = Depends(get_db)
):
    """Get recent audit logs (Admin only)"""
    logs = db.query(AuditLog).order_by(AuditLog.created_at.desc()).offset(skip).limit(limit).all()
    return [
        AuditLogResponse(
            log_id=str(log.log_id),
            action=log.action,
            table_name=log.table_name,
            created_at=log.created_at,
            user_id=str(log.user_id) if log.user_id else None
        ) for log in logs
    ]
