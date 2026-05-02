"""Student management API endpoints"""
from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field, EmailStr
from datetime import date, datetime
from typing import List, Optional
import uuid

from src.auth.dependencies import require_roles, require_self_or_roles
from src.database.connection import get_db
from src.database import crud
from src.database.models import Student

router = APIRouter()

READ_ROLES = ("admin", "teacher")
WRITE_ROLES = ("admin", "teacher")


class StudentCreate(BaseModel):
    student_code: str = Field(..., min_length=3, max_length=50)
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    date_of_birth: Optional[date] = None
    gender: str = Field(..., pattern="^(Male|Female|Other|Prefer not to say)$")
    enrollment_date: Optional[date] = None


class StudentResponse(BaseModel):
    student_id: str
    student_code: str
    first_name: str
    last_name: str
    email: str
    date_of_birth: Optional[date]
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


class AcademicRecordSummary(BaseModel):
    academic_year: str
    semester: str
    gpa: Optional[float]
    attendance_rate: Optional[float]
    study_hours_per_week: Optional[float]

    class Config:
        from_attributes = True


class PredictionSummary(BaseModel):
    predicted_gpa: Optional[float]
    category: Optional[str]
    confidence: Optional[float]
    risk_level: Optional[str]
    recommendation: Optional[str]
    date: datetime

    class Config:
        from_attributes = True


class StudentPerformanceResponse(BaseModel):
    student_code: str
    full_name: str
    email: str
    academic_history: List[AcademicRecordSummary]
    latest_prediction: Optional[PredictionSummary]


def _average(values: List[Optional[float]]) -> Optional[float]:
    valid = [v for v in values if v is not None]
    if not valid:
        return None
    return round(sum(valid) / len(valid), 2)


def _build_student_profile_payload(student: Student, db: Session):
    academic_records = crud.get_student_academic_history(db, student.student_id)
    prediction_history = crud.get_student_prediction_history(db, student.student_id)

    latest_record = academic_records[0] if academic_records else None
    latest_prediction = prediction_history[0] if prediction_history else None

    gpa_values = [record.gpa for record in academic_records]
    attendance_values = [record.attendance_rate for record in academic_records]
    study_hour_values = [record.study_hours_per_week for record in academic_records]
    total_absences = sum((record.absences or 0) for record in academic_records)
    total_late_submissions = sum((record.late_submissions or 0) for record in academic_records)

    gpa_trend = "insufficient_data"
    non_null_gpa = [value for value in gpa_values if value is not None]
    if len(non_null_gpa) >= 2:
        # academic_records are sorted desc; compare latest against oldest.
        delta = non_null_gpa[0] - non_null_gpa[-1]
        if delta > 0.1:
            gpa_trend = "improving"
        elif delta < -0.1:
            gpa_trend = "declining"
        else:
            gpa_trend = "stable"

    academic_history = [
        {
            "record_id": str(record.record_id),
            "academic_year": record.academic_year,
            "semester": record.semester,
            "gpa": record.gpa,
            "total_credits": record.total_credits,
            "attendance_rate": record.attendance_rate,
            "study_hours_per_week": record.study_hours_per_week,
            "class_participation_score": record.class_participation_score,
            "late_submissions": record.late_submissions,
            "absences": record.absences,
            "created_at": record.created_at
        }
        for record in academic_records
    ]

    predictions_payload = []
    recommendation_feed = []
    recommendation_keys = set()

    for prediction in prediction_history:
        prediction_item = {
            "prediction_id": str(prediction.prediction_id),
            "academic_year": prediction.academic_year,
            "semester": prediction.semester,
            "predicted_gpa": prediction.predicted_gpa,
            "predicted_category": prediction.predicted_performance_category,
            "confidence_score": prediction.confidence_score,
            "risk_level": prediction.risk_level,
            "recommendation": prediction.recommendation,
            "prediction_date": prediction.prediction_date,
            "model": {
                "model_name": prediction.model.model_name,
                "model_version": prediction.model.model_version,
                "algorithm": prediction.model.algorithm
            } if prediction.model else None,
            "interventions": [
                {
                    "intervention_id": str(intervention.intervention_id),
                    "intervention_type": intervention.intervention_type,
                    "priority": intervention.priority,
                    "status": intervention.status,
                    "description": intervention.description,
                    "assigned_to": intervention.assigned_to,
                    "due_date": intervention.due_date,
                    "created_at": intervention.created_at
                }
                for intervention in prediction.interventions
            ]
        }
        predictions_payload.append(prediction_item)

        if prediction.recommendation:
            rec_key = ("prediction", prediction.recommendation.strip())
            if rec_key not in recommendation_keys:
                recommendation_keys.add(rec_key)
                recommendation_feed.append({
                    "source": "prediction",
                    "text": prediction.recommendation,
                    "risk_level": prediction.risk_level,
                    "date": prediction.prediction_date
                })

        for intervention in prediction.interventions:
            if not intervention.description:
                continue
            rec_key = ("intervention", intervention.description.strip())
            if rec_key in recommendation_keys:
                continue
            recommendation_keys.add(rec_key)
            recommendation_feed.append({
                "source": "intervention",
                "text": intervention.description,
                "status": intervention.status,
                "priority": intervention.priority,
                "date": intervention.created_at
            })

    return {
        "student": {
            "student_id": str(student.student_id),
            "student_code": student.student_code,
            "first_name": student.first_name,
            "last_name": student.last_name,
            "full_name": f"{student.first_name} {student.last_name}",
            "email": student.email,
            "date_of_birth": student.date_of_birth,
            "gender": student.gender,
            "enrollment_date": student.enrollment_date,
            "status": student.status,
            "created_at": student.created_at
        },
        "academic_metrics": {
            "total_semesters": len(academic_records),
            "latest_gpa": latest_record.gpa if latest_record else None,
            "average_gpa": _average(gpa_values),
            "latest_attendance_rate": latest_record.attendance_rate if latest_record else None,
            "average_attendance_rate": _average(attendance_values),
            "average_study_hours_per_week": _average(study_hour_values),
            "total_absences": total_absences,
            "total_late_submissions": total_late_submissions,
            "gpa_trend": gpa_trend
        },
        "latest_prediction": {
            "prediction_id": str(latest_prediction.prediction_id),
            "predicted_gpa": latest_prediction.predicted_gpa,
            "predicted_category": latest_prediction.predicted_performance_category,
            "confidence_score": latest_prediction.confidence_score,
            "risk_level": latest_prediction.risk_level,
            "recommendation": latest_prediction.recommendation,
            "prediction_date": latest_prediction.prediction_date
        } if latest_prediction else None,
        "academic_history": academic_history,
        "prediction_history": predictions_payload,
        "recommendations": recommendation_feed
    }


@router.post("/students", response_model=StudentResponse, status_code=201)
async def create_student(
    student: StudentCreate,
    db: Session = Depends(get_db),
    _current_user=Depends(require_roles(*WRITE_ROLES))
):
    """
    Create a new student record
    """
    normalized_student_code = student.student_code.strip()
    normalized_email = student.email.strip().lower()

    # Check if student code already exists
    existing = crud.get_student_by_code(db, normalized_student_code)
    if existing:
        raise HTTPException(status_code=400, detail="Student code already exists")
    
    # Check if email already exists
    existing_email = crud.get_student_by_email_case_insensitive(db, normalized_email)
    if existing_email:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    student_data = student.model_dump()
    student_data["student_code"] = normalized_student_code
    student_data["first_name"] = student.first_name.strip()
    student_data["last_name"] = student.last_name.strip()
    student_data["email"] = normalized_email
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
    db: Session = Depends(get_db),
    _current_user=Depends(require_roles(*READ_ROLES))
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
    db: Session = Depends(get_db),
    _current_user=Depends(require_roles(*READ_ROLES))
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
async def get_student(
    student_code: str,
    db: Session = Depends(get_db),
    _current_user=Depends(require_self_or_roles(*READ_ROLES))
):
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


@router.get("/students/{student_code}/performance", response_model=StudentPerformanceResponse)
async def get_student_performance(
    student_code: str,
    db: Session = Depends(get_db),
    _current_user=Depends(require_self_or_roles(*READ_ROLES))
):
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
    
    return StudentPerformanceResponse(
        student_code=student_code,
        full_name=f"{student.first_name} {student.last_name}",
        email=student.email,
        academic_history=[
            AcademicRecordSummary(
                academic_year=ar.academic_year,
                semester=ar.semester,
                gpa=ar.gpa,
                attendance_rate=ar.attendance_rate,
                study_hours_per_week=ar.study_hours_per_week
            )
            for ar in academic_records
        ],
        latest_prediction=PredictionSummary(
            predicted_gpa=latest_prediction.predicted_gpa,
            category=latest_prediction.predicted_performance_category,
            confidence=latest_prediction.confidence_score,
            risk_level=latest_prediction.risk_level,
            recommendation=latest_prediction.recommendation,
            date=latest_prediction.prediction_date
        ) if latest_prediction else None
    )


@router.get("/students/{student_code}/profile")
async def get_student_profile(
    student_code: str,
    db: Session = Depends(get_db),
    _current_user=Depends(require_self_or_roles(*READ_ROLES))
):
    """
    Get detailed student profile from the database:
    academic metrics, prediction history, and recommendation feed.
    """
    student = crud.get_student_by_code(db, student_code)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return _build_student_profile_payload(student, db)


@router.put("/students/{student_code}", response_model=StudentResponse)
async def update_student(
    student_code: str,
    student_update: StudentUpdate,
    db: Session = Depends(get_db),
    _current_user=Depends(require_roles(*WRITE_ROLES))
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
async def delete_student(
    student_code: str,
    db: Session = Depends(get_db),
    _current_user=Depends(require_roles("admin"))
):
    """
    Deactivate a student (soft delete)
    """
    student = crud.get_student_by_code(db, student_code)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    crud.update_student(db, student.student_id, {"status": "inactive"})
    return None
