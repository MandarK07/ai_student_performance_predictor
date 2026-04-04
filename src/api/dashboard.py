"""Dashboard API endpoints"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from src.auth.dependencies import require_roles, _resolve_student_for_user
from src.database.connection import get_db
from src.database import crud
from src.api.students import _build_student_profile_payload

router = APIRouter()

@router.get("/dashboard/student/me")
async def get_student_dashboard(
    current_user=Depends(require_roles("student")),
    db: Session = Depends(get_db)
):
    """Get the personalized dashboard for the logged-in student."""
    # Prefer explicit linkage via user.student_id; fall back to email
    student = _resolve_student_for_user(db, current_user)
    if not student:
         raise HTTPException(
             status_code=status.HTTP_404_NOT_FOUND, 
             detail="No corresponding student record found for this user account"
         )
    # Re-use the comprehensive profile payload generated for student analytics
    return _build_student_profile_payload(student, db)
