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
            last_login=u.last_login
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
