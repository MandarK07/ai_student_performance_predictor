"""Dashboard API endpoints"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from src.auth.dependencies import require_roles
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
    # Find student by email linkage
    student = crud.get_student_by_email(db, current_user.email)
    if not student:
         raise HTTPException(
             status_code=status.HTTP_404_NOT_FOUND, 
             detail="No corresponding student record found for this user account"
         )
    # Re-use the comprehensive profile payload generated for student analytics
    return _build_student_profile_payload(student, db)
