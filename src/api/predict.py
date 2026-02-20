"""Prediction API endpoints with database integration"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from datetime import datetime
import joblib
import pandas as pd
from typing import Optional

from src.auth.dependencies import require_roles
from src.database.connection import get_db
from src.database import crud
from src.features.preprocess import preprocess_data

router = APIRouter()
PREDICTION_ROLES = ("admin", "teacher", "counselor")

INTERVENTION_TYPE_MAP = {
    "Academic Support": "Tutoring",
    "Behavioral Support": "Counseling",
    "Attendance Support": "Time Management",
}


# Load ML model
try:
    model_bundle = joblib.load("models/random_forest.joblib")
    model = model_bundle["model"]
    feature_columns = model_bundle["feature_columns"]
except:
    model = None
    feature_columns = []

class StudentFeatures(BaseModel):
    student_code: str = Field(..., description="Student identification code")
    gender: str = Field(..., description="Student gender")
    age: int = Field(..., ge=10, le=100, description="Student age")
    parent_education: str = Field(..., description="Parent education level")
    attendance_rate: float = Field(..., ge=0, le=100, description="Attendance percentage")
    study_hours: float = Field(..., ge=0, description="Weekly study hours")
    previous_gpa: float = Field(..., ge=0, le=4.0, description="Previous semester GPA")
    final_grade: float = Field(..., ge=0, le=100, description="Final grade score")
    assignment_score_avg: float = Field(..., ge=0, le=100, description="Average assignment score")
    exam_score_avg: float = Field(..., ge=0, le=100, description="Average exam score")
    class_participation: float = Field(..., ge=0, le=10, description="Class participation score")
    late_submissions: int = Field(..., ge=0, description="Number of late submissions")
    previous_gpa_sem1: float = Field(..., ge=0, le=4.0, description="Semester 1 GPA")
    previous_gpa_sem2: float = Field(..., ge=0, le=4.0, description="Semester 2 GPA")
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

@router.post("/predict", response_model=PredictionResponse)
async def predict(
    features: StudentFeatures,
    db: Session = Depends(get_db),
    _current_user=Depends(require_roles(*PREDICTION_ROLES))
):
    """
    Generate performance prediction for a student and save to database
    """
    if model is None:
        raise HTTPException(status_code=503, detail="ML model not loaded")
    
    try:
        # Check if student exists, create if not
        student = crud.get_student_by_code(db, features.student_code)
        if not student:
            # Create new student record
            student_data = {
                "student_code": features.student_code,
                "first_name": features.student_code.split("-")[0] if "-" in features.student_code else "Student",
                "last_name": "TBD",
                "email": f"{features.student_code}@student.edu",
                "date_of_birth": datetime(2005, 1, 1).date(),
                "gender": features.gender,
                "enrollment_date": datetime.now().date()
            }
            student = crud.create_student(db, student_data)
        
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
        predicted_gpa = round(prediction if isinstance(prediction, float) else features.previous_gpa * 0.9, 2)
        
        # Determine performance category and risk level
        if predicted_gpa >= 3.5:
            category = "Excellent"
            risk_level = "Low"
        elif predicted_gpa >= 3.0:
            category = "Good"
            risk_level = "Low"
        elif predicted_gpa >= 2.5:
            category = "Average"
            risk_level = "Medium"
        elif predicted_gpa >= 2.0:
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
                "file_path": "models/random_forest.joblib",
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
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


@router.get("/predictions/{student_code}")
async def get_student_predictions(
    student_code: str,
    db: Session = Depends(get_db),
    _current_user=Depends(require_roles(*PREDICTION_ROLES))
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
    _current_user=Depends(require_roles(*PREDICTION_ROLES))
):
    """
    Get list of students at high or critical risk
    """
    at_risk = crud.get_at_risk_students(db)
    return {
        "count": len(at_risk),
        "students": at_risk
    }
