"""Prediction API endpoints with database integration"""
from datetime import date, datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
import pandas as pd

from src.auth.dependencies import require_roles, require_self_or_roles, _resolve_student_for_user
from src.database.connection import get_db
from src.database import crud
from src.features.preprocess import preprocess_data
from src.model_loader import get_model_path, load_prediction_artifacts
from src.services.email_service import send_intervention_email

router = APIRouter()
PREDICT_ROLES = ("admin", "teacher", "student")
AT_RISK_ROLES = ("admin", "teacher")

INTERVENTION_TYPE_MAP = {
    "Academic Support": "Tutoring",
    "Behavioral Support": "Counseling",
    "Attendance Support": "Time Management",
}


# Load ML model
model, feature_columns = load_prediction_artifacts()
MODEL_PATH = get_model_path()

class StudentFeatures(BaseModel):
    student_code: str = Field(..., description="Student identification code")
    gender: str = Field(..., description="Student gender")
    age: int = Field(..., ge=10, le=100, description="Student age")
    parent_education: str = Field(..., description="Parent education level")
    attendance_rate: float = Field(..., ge=0, le=100, description="Attendance percentage")
    study_hours: float = Field(..., ge=0, description="Weekly study hours")
    previous_gpa: float = Field(..., ge=0, le=10.0, description="Previous semester GPA")
    final_grade: float = Field(..., ge=0, le=100, description="Final grade score")
    assignment_score_avg: float = Field(..., ge=0, le=100, description="Average assignment score")
    exam_score_avg: float = Field(..., ge=0, le=100, description="Average exam score")
    class_participation: float = Field(..., ge=0, le=10, description="Class participation score")
    late_submissions: int = Field(..., ge=0, description="Number of late submissions")
    previous_gpa_sem1: float = Field(..., ge=0, le=10.0, description="Semester 1 GPA")
    previous_gpa_sem2: float = Field(..., ge=0, le=10.0, description="Semester 2 GPA")
    academic_year: Optional[str] = Field("2023-2024", description="Academic year")
    semester: Optional[str] = Field("Fall", description="Current semester")

class PredictionResponse(BaseModel):
    prediction_id: str
    student_code: str
    predicted_gpa: float
    predicted_category: str
    confidence_score: float
    risk_level: str
    recommendation: str
    prediction_date: datetime


class CreateInterventionRequest(BaseModel):
    intervention_type: str = Field(..., pattern="^(Tutoring|Counseling|Study Group|Time Management|Mentorship|Resource Allocation|Other)$")
    priority: str = Field(..., pattern="^(Low|Medium|High|Urgent)$")
    description: str = Field(..., min_length=10, max_length=1000)
    assigned_to: Optional[str] = Field(None, max_length=200)
    due_date: Optional[date] = None


class InterventionResponse(BaseModel):
    intervention_id: str
    student_code: str
    prediction_id: str
    intervention_type: str
    priority: str
    status: str
    description: str
    assigned_to: Optional[str]
    due_date: Optional[date]
    created_at: datetime


class GuardianContactItem(BaseModel):
    parent_id: str
    name: str
    relation: Optional[str]
    email: Optional[str]
    phone: Optional[str]
    is_primary_contact: bool


class GuardianContactResponse(BaseModel):
    student_code: str
    student_name: str
    contacts: list[GuardianContactItem]


class CreateGuardianContactRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=200)
    relation: str = Field(..., pattern="^(Mother|Father|Guardian|Other)$")
    email: Optional[str] = Field(None, max_length=255)
    phone: Optional[str] = Field(None, max_length=20)
    education_level: Optional[str] = Field(None, max_length=100)
    occupation: Optional[str] = Field(None, max_length=200)
    is_primary_contact: bool = True

@router.post("/predict", response_model=PredictionResponse)
async def predict(
    features: StudentFeatures,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    _current_user=Depends(require_roles(*PREDICT_ROLES))
):
    """
    Generate performance prediction for a student and save to database
    """
    if model is None:
        raise HTTPException(status_code=503, detail="ML model not loaded")
    
    try:
        # Check if student exists
        student = crud.get_student_by_code(db, features.student_code)

        # Students may only predict for themselves (email-linked)
        if _current_user.role == "student":
            self_student = _resolve_student_for_user(db, _current_user)
            if features.student_code != self_student.student_code:
                raise HTTPException(status_code=403, detail="Students can only run predictions for their own code")
            student = self_student
        if not student:
            raise HTTPException(status_code=404, detail="Student not found")
        
        # Prepare data for model
        input_data = {
            "gender": features.gender,
            "age": features.age,
            "parent_education": features.parent_education,
            "attendance_rate": features.attendance_rate,
            "study_hours": features.study_hours,
            "previous_gpa": features.previous_gpa,
            "final_grade": features.final_grade,
            "assignment_score_avg": features.assignment_score_avg,
            "exam_score_avg": features.exam_score_avg,
            "class_participation": features.class_participation,
            "late_submissions": features.late_submissions,
            "previous_gpa_sem1": features.previous_gpa_sem1,
            "previous_gpa_sem2": features.previous_gpa_sem2
        }
        
        input_df = pd.DataFrame([input_data])
        processed_df = preprocess_data(input_df)
        
        # Align features with model expectations
        for col in feature_columns:
            if col not in processed_df.columns:
                processed_df[col] = 0
        processed_df = processed_df[feature_columns]
        
        # Make prediction
        prediction = model.predict(processed_df)[0]
        probabilities = model.predict_proba(processed_df)[0]
        confidence = float(max(probabilities))
        
        # Calculate predicted GPA (convert from classification to GPA scale)
        prob_high = float(probabilities[1]) if len(probabilities) > 1 else float(probabilities[0])
        predicted_gpa = round(prob_high * 10, 2)
        predicted_gpa = max(0.0, min(10.0, predicted_gpa))
        
        # Determine performance category and risk level
        if predicted_gpa >= 8.75:
            category = "Excellent"
            risk_level = "Low"
        elif predicted_gpa >= 7.5:
            category = "Good"
            risk_level = "Low"
        elif predicted_gpa >= 6.25:
            category = "Average"
            risk_level = "Medium"
        elif predicted_gpa >= 5.0:
            category = "Below Average"
            risk_level = "High"
        else:
            category = "At Risk"
            risk_level = "Critical"
        
        # Generate recommendation
        recommendations = []
        if features.attendance_rate < 80:
            recommendations.append("Improve attendance (currently below 80%)")
        if features.study_hours < 10:
            recommendations.append("Increase weekly study hours (recommended: 15+ hours)")
        if features.late_submissions > 3:
            recommendations.append("Submit assignments on time to improve grades")
        if features.class_participation < 5:
            recommendations.append("Increase class participation for better engagement")
        
        recommendation = "; ".join(recommendations) if recommendations else "Keep up the good work!"
        
        # Get active model from database
        active_model = crud.get_active_model(db)
        if not active_model:
            # Create default model entry if none exists
            model_data = {
                "model_name": "Random Forest Classifier",
                "model_version": "v1.0",
                "algorithm": "Random Forest",
                "file_path": MODEL_PATH,
                "accuracy": 0.875,
                "training_date": datetime.now(),
                "is_active": True
            }
            active_model = crud.create_ml_model(db, model_data)
        
        # Save prediction to database
        prediction_data = {
            "student_id": student.student_id,
            "model_id": active_model.model_id,
            "academic_year": features.academic_year,
            "semester": features.semester,
            "predicted_gpa": predicted_gpa,
            "predicted_performance_category": category,
            "confidence_score": confidence,
            "risk_level": risk_level,
            "input_features": input_data,
            "recommendation": recommendation,
            "prediction_date": datetime.now()
        }
        
        db_prediction = crud.create_prediction(db, prediction_data)
        
        # Create intervention if high risk
        if risk_level in ["High", "Critical"]:
            raw_type = "Academic Support"  # model / rule output

            intervention_type = INTERVENTION_TYPE_MAP.get(raw_type, "Other")

            intervention_data = {
                "prediction_id": db_prediction.prediction_id,
                "intervention_type": intervention_type,  # ✅ DB-safe value
                "priority": "High" if risk_level == "High" else "Urgent",
                "description": recommendation,
                "status": "pending"
            }

            crud.create_intervention(db, intervention_data)
            
            # Send notification email
            background_tasks.add_task(
                send_intervention_email,
                student.email,
                f"{student.first_name} {student.last_name}",
                intervention_type,
                recommendation
            )
            
            print("Mapped intervention type:", intervention_type)
        
        return PredictionResponse(
            prediction_id=str(db_prediction.prediction_id),
            student_code=features.student_code,
            predicted_gpa=predicted_gpa,
            predicted_category=category,
            confidence_score=round(confidence * 100, 2),
            risk_level=risk_level,
            recommendation=recommendation,
            prediction_date=db_prediction.prediction_date
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


@router.get("/predictions/{student_code}")
async def get_student_predictions(
    student_code: str,
    db: Session = Depends(get_db),
    _current_user=Depends(require_self_or_roles("admin", "teacher"))
):
    """
    Get all predictions for a specific student
    """
    student = crud.get_student_by_code(db, student_code)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    latest_prediction = crud.get_latest_prediction(db, student.student_id)
    if not latest_prediction:
        return {"message": "No predictions found for this student"}
    
    return {
        "student_code": student_code,
        "latest_prediction": {
            "predicted_gpa": latest_prediction.predicted_gpa,
            "category": latest_prediction.predicted_performance_category,
            "confidence": latest_prediction.confidence_score,
            "risk_level": latest_prediction.risk_level,
            "recommendation": latest_prediction.recommendation,
            "date": latest_prediction.prediction_date
        }
    }


@router.get("/at-risk-students")
async def get_at_risk_students(
    db: Session = Depends(get_db),
    _current_user=Depends(require_roles(*AT_RISK_ROLES))
):
    """
    Get list of students at high or critical risk
    """
    at_risk = crud.get_at_risk_students(db)
    return {
        "count": len(at_risk),
        "students": at_risk
    }


@router.get("/at-risk-students/{student_code}/guardian-contact", response_model=GuardianContactResponse)
async def get_guardian_contact(
    student_code: str,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(*AT_RISK_ROLES))
):
    """Fetch guardian contacts for an at-risk student."""
    student = crud.get_student_by_code(db, student_code)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    contacts = crud.get_student_parents(db, student.student_id)
    if not contacts:
        raise HTTPException(status_code=404, detail="No guardian contacts found for this student")

    crud.create_audit_log(
        db,
        {
            "user_id": current_user.user_id,
            "action": "guardian.contact.viewed",
            "table_name": "parents",
            "record_id": student.student_id,
            "new_values": {"student_code": student.student_code, "contact_count": len(contacts)},
        },
    )

    return GuardianContactResponse(
        student_code=student.student_code,
        student_name=f"{student.first_name} {student.last_name}",
        contacts=[
            GuardianContactItem(
                parent_id=str(contact.parent_id),
                name=contact.name,
                relation=contact.relation,
                email=contact.email,
                phone=contact.phone,
                is_primary_contact=bool(contact.is_primary_contact),
            )
            for contact in contacts
        ],
    )


@router.post("/at-risk-students/{student_code}/guardian-contact", response_model=GuardianContactItem, status_code=201)
async def create_guardian_contact(
    student_code: str,
    payload: CreateGuardianContactRequest,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(*AT_RISK_ROLES))
):
    """Create a guardian contact for a student from the At-Risk workflow."""
    student = crud.get_student_by_code(db, student_code)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    if not payload.email and not payload.phone:
        raise HTTPException(status_code=400, detail="Provide at least an email or phone number for the guardian")

    contact = crud.create_parent(
        db,
        {
            "student_id": student.student_id,
            "name": payload.name.strip(),
            "relation": payload.relation,
            "education_level": payload.education_level.strip() if payload.education_level else None,
            "occupation": payload.occupation.strip() if payload.occupation else None,
            "phone": payload.phone.strip() if payload.phone else None,
            "email": payload.email.strip().lower() if payload.email else None,
            "is_primary_contact": payload.is_primary_contact,
        },
    )

    crud.create_audit_log(
        db,
        {
            "user_id": current_user.user_id,
            "action": "guardian.contact.created",
            "table_name": "parents",
            "record_id": contact.parent_id,
            "new_values": {
                "student_code": student.student_code,
                "relation": contact.relation,
                "is_primary_contact": bool(contact.is_primary_contact),
            },
        },
    )

    return GuardianContactItem(
        parent_id=str(contact.parent_id),
        name=contact.name,
        relation=contact.relation,
        email=contact.email,
        phone=contact.phone,
        is_primary_contact=bool(contact.is_primary_contact),
    )


@router.post("/at-risk-students/{student_code}/interventions", response_model=InterventionResponse, status_code=201)
async def create_manual_intervention(
    student_code: str,
    payload: CreateInterventionRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(*AT_RISK_ROLES))
):
    """Create a manual intervention for the student's latest at-risk prediction."""
    student = crud.get_student_by_code(db, student_code)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    latest_prediction = crud.get_latest_prediction(db, student.student_id)
    if not latest_prediction:
        raise HTTPException(status_code=404, detail="No prediction found for this student")

    if latest_prediction.risk_level not in {"High", "Critical"}:
        raise HTTPException(status_code=400, detail="Manual interventions can only be created for high-risk students")

    intervention = crud.create_intervention(
        db,
        {
            "prediction_id": latest_prediction.prediction_id,
            "intervention_type": payload.intervention_type,
            "priority": payload.priority,
            "description": payload.description.strip(),
            "assigned_to": payload.assigned_to.strip() if payload.assigned_to else None,
            "due_date": payload.due_date,
            "status": "pending",
        },
    )

    crud.create_audit_log(
        db,
        {
            "user_id": current_user.user_id,
            "action": "intervention.created",
            "table_name": "interventions",
            "record_id": intervention.intervention_id,
            "new_values": {
                "student_code": student.student_code,
                "prediction_id": str(latest_prediction.prediction_id),
                "intervention_type": intervention.intervention_type,
                "priority": intervention.priority,
            },
        },
    )
    
    # Send notification email
    background_tasks.add_task(
        send_intervention_email,
        student.email,
        f"{student.first_name} {student.last_name}",
        intervention.intervention_type,
        intervention.description
    )

    return InterventionResponse(
        intervention_id=str(intervention.intervention_id),
        student_code=student.student_code,
        prediction_id=str(latest_prediction.prediction_id),
        intervention_type=intervention.intervention_type,
        priority=intervention.priority,
        status=intervention.status,
        description=intervention.description,
        assigned_to=intervention.assigned_to,
        due_date=intervention.due_date,
        created_at=intervention.created_at,
    )
