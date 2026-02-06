"""Student management API endpoints"""
from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field, EmailStr
from datetime import date, datetime
from typing import List, Optional
import uuid

from src.database.connection import get_db
from src.database import crud
from src.database.models import Student

router = APIRouter()


class StudentCreate(BaseModel):
    student_code: str = Field(..., min_length=3, max_length=50)
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    date_of_birth: date
    gender: str = Field(..., pattern="^(Male|Female|Other|Prefer not to say)$")
    enrollment_date: Optional[date] = None


class StudentResponse(BaseModel):
    student_id: str
    student_code: str
    first_name: str
    last_name: str
    email: str
    date_of_birth: date
    gender: str
    enrollment_date: date
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class StudentUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    status: Optional[str] = None


@router.post("/students", response_model=StudentResponse, status_code=201)
async def create_student(student: StudentCreate, db: Session = Depends(get_db)):
    """
    Create a new student record
    """
    # Check if student code already exists
    existing = crud.get_student_by_code(db, student.student_code)
    if existing:
        raise HTTPException(status_code=400, detail="Student code already exists")
    
    # Check if email already exists
    existing_email = db.query(Student).filter(Student.email == student.email).first()
    if existing_email:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    student_data = student.dict()
    if not student_data.get('enrollment_date'):
        student_data['enrollment_date'] = date.today()
    
    new_student = crud.create_student(db, student_data)
    
    return StudentResponse(
        student_id=str(new_student.student_id),
        student_code=new_student.student_code,
        first_name=new_student.first_name,
        last_name=new_student.last_name,
        email=new_student.email,
        date_of_birth=new_student.date_of_birth,
        gender=new_student.gender,
        enrollment_date=new_student.enrollment_date,
        status=new_student.status,
        created_at=new_student.created_at
    )


@router.get("/students", response_model=List[StudentResponse])
async def get_students(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    status: Optional[str] = Query(None, pattern="^(active|inactive|graduated|suspended)$"),
    db: Session = Depends(get_db)
):
    """
    Get list of students with pagination
    """
    students = crud.get_students(db, skip=skip, limit=limit, status=status)
    return [
        StudentResponse(
            student_id=str(s.student_id),
            student_code=s.student_code,
            first_name=s.first_name,
            last_name=s.last_name,
            email=s.email,
            date_of_birth=s.date_of_birth,
            gender=s.gender,
            enrollment_date=s.enrollment_date,
            status=s.status,
            created_at=s.created_at
        )
        for s in students
    ]


@router.get("/students/search")
async def search_students(
    q: str = Query(..., min_length=2, description="Search term"),
    db: Session = Depends(get_db)
):
    """
    Search students by name, email, or student code
    """
    students = crud.search_students(db, q)
    return [
        {
            "student_id": str(s.student_id),
            "student_code": s.student_code,
            "full_name": f"{s.first_name} {s.last_name}",
            "email": s.email,
            "status": s.status
        }
        for s in students
    ]


@router.get("/students/{student_code}", response_model=StudentResponse)
async def get_student(student_code: str, db: Session = Depends(get_db)):
    """
    Get student details by student code
    """
    student = crud.get_student_by_code(db, student_code)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    return StudentResponse(
        student_id=str(student.student_id),
        student_code=student.student_code,
        first_name=student.first_name,
        last_name=student.last_name,
        email=student.email,
        date_of_birth=student.date_of_birth,
        gender=student.gender,
        enrollment_date=student.enrollment_date,
        status=student.status,
        created_at=student.created_at
    )


@router.get("/students/{student_code}/performance")
async def get_student_performance(student_code: str, db: Session = Depends(get_db)):
    """
    Get comprehensive performance data for a student
    """
    student = crud.get_student_by_code(db, student_code)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Get academic history
    academic_records = crud.get_student_academic_history(db, student.student_id)
    
    # Get latest prediction
    latest_prediction = crud.get_latest_prediction(db, student.student_id)
    
    return {
        "student_code": student_code,
        "full_name": f"{student.first_name} {student.last_name}",
        "email": student.email,
        "academic_history": [
            {
                "academic_year": ar.academic_year,
                "semester": ar.semester,
                "gpa": ar.gpa,
                "attendance_rate": ar.attendance_rate,
                "study_hours_per_week": ar.study_hours_per_week
            }
            for ar in academic_records
        ],
        "latest_prediction": {
            "predicted_gpa": latest_prediction.predicted_gpa,
            "category": latest_prediction.predicted_performance_category,
            "confidence": latest_prediction.confidence_score,
            "risk_level": latest_prediction.risk_level,
            "recommendation": latest_prediction.recommendation,
            "date": latest_prediction.prediction_date
        } if latest_prediction else None
    }


@router.put("/students/{student_code}", response_model=StudentResponse)
async def update_student(
    student_code: str,
    student_update: StudentUpdate,
    db: Session = Depends(get_db)
):
    """
    Update student information
    """
    student = crud.get_student_by_code(db, student_code)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    update_data = student_update.dict(exclude_unset=True)
    updated_student = crud.update_student(db, student.student_id, update_data)
    
    return StudentResponse(
        student_id=str(updated_student.student_id),
        student_code=updated_student.student_code,
        first_name=updated_student.first_name,
        last_name=updated_student.last_name,
        email=updated_student.email,
        date_of_birth=updated_student.date_of_birth,
        gender=updated_student.gender,
        enrollment_date=updated_student.enrollment_date,
        status=updated_student.status,
        created_at=updated_student.created_at
    )


@router.delete("/students/{student_code}", status_code=204)
async def delete_student(student_code: str, db: Session = Depends(get_db)):
    """
    Deactivate a student (soft delete)
    """
    student = crud.get_student_by_code(db, student_code)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    crud.update_student(db, student.student_id, {"status": "inactive"})
    return None
