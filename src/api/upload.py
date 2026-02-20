"""CSV Upload API with database integration and batch predictions"""
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session
import pandas as pd
from io import BytesIO
from datetime import datetime
import joblib

from src.auth.dependencies import require_roles
from src.database.connection import get_db
from src.database import crud
from src.features.preprocess import preprocess_data

from sqlalchemy.exc import IntegrityError

import math

def clean_for_json(obj):
    """
    Replace NaN values with None so PostgreSQL JSON columns accept the data
    """
    if isinstance(obj, dict):
        return {k: clean_for_json(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [clean_for_json(v) for v in obj]
    elif isinstance(obj, float) and math.isnan(obj):
        return None
    else:
        return obj



router = APIRouter()
UPLOAD_ROLES = ("admin", "teacher", "counselor")

REQUIRED_COLUMNS = {
    "student_code", "gender", "age", "parent_education", "attendance_rate",
    "study_hours", "previous_gpa", "final_grade", "assignment_score_avg",
    "exam_score_avg", "class_participation", "late_submissions",
    "previous_gpa_sem1", "previous_gpa_sem2"
}

# Load ML model
try:
    model_bundle = joblib.load("models/random_forest.joblib")
    model = model_bundle["model"]
    feature_columns = model_bundle["feature_columns"]
except:
    model = None
    feature_columns = []


@router.post("/upload-csv")
async def upload_csv(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    _current_user=Depends(require_roles(*UPLOAD_ROLES))
):
    """
    Upload CSV file with student data and generate batch predictions
    """
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported.")

    if model is None:
        raise HTTPException(status_code=503, detail="ML model not loaded")

    try:
        # Read and validate CSV
        contents = await file.read()
        df = pd.read_csv(BytesIO(contents))

        # Normalize headers
        df.columns = [
            col.strip().lower()
            .replace(" ", "_")
            .replace("-", "_")
            .replace(".", "_")
            for col in df.columns
        ]

        # Validate required columns
        missing = REQUIRED_COLUMNS - set(df.columns)
        if missing:
            raise HTTPException(
                status_code=422, 
                detail={
                    "error": "Missing required columns",
                    "missing": list(missing),
                    "received": list(df.columns)
                }
            )

        # Get active model
        active_model = crud.get_active_model(db)
        if not active_model:
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

        results = []
        success_count = 0
        failed_count = 0
        errors = []

        # Process each student
        for idx, row in df.iterrows():
            try:
                student_code = str(row['student_code'])
                
                # Check if student exists, create if not
                email = row.get('email', f"{student_code}@student.edu")

                # Try to find by email FIRST (email is unique)
                student = crud.get_student_by_email(db, email)

                if not student:
                    student_data = {
                        "student_code": student_code,
                        "first_name": row.get('first_name', 'Student'),
                        "last_name": row.get('last_name', student_code),
                        "email": email,
                        "date_of_birth": datetime(2005, 1, 1).date(),
                        "gender": str(row['gender']),
                        "enrollment_date": datetime.now().date()
                    }

                    try:
                        student = crud.create_student(db, student_data)
                    except IntegrityError:
                        db.rollback()
                        failed_count += 1
                        errors.append({
                            "row": idx + 1,
                            "student_code": student_code,
                            "error": "Duplicate email"
                        })
                        continue

                # Prepare features for prediction
                input_data = {
                    "gender": str(row['gender']),
                    "age": int(row['age']),
                    "parent_education": str(row['parent_education']),
                    "attendance_rate": float(row['attendance_rate']),
                    "study_hours": float(row['study_hours']),
                    "previous_gpa": float(row['previous_gpa']),
                    "final_grade": float(row['final_grade']),
                    "assignment_score_avg": float(row['assignment_score_avg']),
                    "exam_score_avg": float(row['exam_score_avg']),
                    "class_participation": float(row['class_participation']),
                    "late_submissions": int(row['late_submissions']),
                    "previous_gpa_sem1": float(row['previous_gpa_sem1']),
                    "previous_gpa_sem2": float(row['previous_gpa_sem2'])
                }

                # Preprocess and predict
                input_df = pd.DataFrame([input_data])
                processed_df = preprocess_data(input_df)
                
                for col in feature_columns:
                    if col not in processed_df.columns:
                        processed_df[col] = 0
                processed_df = processed_df[feature_columns]
                
                prediction = model.predict(processed_df)[0]
                probabilities = model.predict_proba(processed_df)[0]
                confidence = float(max(probabilities))
                
                # Calculate predicted GPA
                predicted_gpa = round(prediction if isinstance(prediction, float) else input_data['previous_gpa'] * 0.9, 2)
                
                # Determine category and risk
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

                # Save prediction to database
                clean_input_features = clean_for_json(input_data)
                
                prediction_data = {
                    "student_id": student.student_id,
                    "model_id": active_model.model_id,
                    "academic_year": row.get('academic_year', '2023-2024'),
                    "semester": row.get('semester', 'Fall'),
                    "predicted_gpa": predicted_gpa,
                    "predicted_performance_category": category,
                    "confidence_score": confidence,
                    "risk_level": risk_level,
                    "input_features": clean_input_features,
                    "recommendation": f"Predicted GPA: {predicted_gpa}",
                    "prediction_date": datetime.now()
                }
                
                db_prediction = crud.create_prediction(db, prediction_data)

                results.append({
                    "student_code": student_code,
                    "predicted_gpa": predicted_gpa,
                    "category": category,
                    "confidence": round(confidence * 100, 2),
                    "risk_level": risk_level
                })
                success_count += 1

            except Exception as e:
                failed_count += 1
                errors.append({
                    "row": idx + 1,
                    "student_code": row.get('student_code', 'Unknown'),
                    "error": str(e)
                })

        return {
            "message": "Batch prediction completed",
            "total_records": len(df),
            "success": success_count,
            "failed": failed_count,
            "results": results,
            "errors": errors if errors else None
        }

    except HTTPException as he:
        # Re-raise HTTP exceptions to maintain their status code and detail
        raise he
    except Exception as e:
        import traceback
        print(f"ERROR processing CSV: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")


@router.get("/upload-history")
async def get_upload_history(
    db: Session = Depends(get_db),
    _current_user=Depends(require_roles(*UPLOAD_ROLES))
):
    """
    Get history of CSV uploads
    """
    # This would query the upload_history table
    return {"message": "Upload history feature coming soon"}
