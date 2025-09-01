# backend/app/api/predict.py
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

class StudentFeatures(BaseModel):
    student_id: str
    gender: str
    age: int
    parent_education: str
    attendance_rate: float
    study_hours: float
    previous_gpa: float
    final_grade: float
    assignment_score_avg: float
    exam_score_avg: float
    class_participation: float
    late_submissions: int
    previous_gpa_sem1: float
    previous_gpa_sem2: float

@router.post("/predict")
def predict(features: StudentFeatures):
    # Replace with actual model inference
    score = (
        features.attendance_rate * 0.2 +
        features.study_hours * 0.3 +
        features.previous_gpa * 0.3 +
        features.class_participation * 0.2
    )
    return {"prediction": round(score, 2)}