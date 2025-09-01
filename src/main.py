
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
from pydantic import BaseModel, Field
import joblib

# Load model and expected features
model_bundle = joblib.load("models/random_forest.joblib")
model = model_bundle["model"]
feature_columns = model_bundle["feature_columns"]

app = FastAPI()

# Insert CORS middleware here
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Or specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class StudentData(BaseModel):
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

@app.post("/predict")
def predict(data: StudentData):
    try:
        # Convert input to DataFrame
        input_df = pd.DataFrame([data.dict()])

        # Apply preprocessing
        from src.features.preprocess import preprocess_data  # assuming it's modularized
        processed_df = preprocess_data(input_df)

        # One-hot encode gender for expected columns
        for col in feature_columns:
            if col.startswith("gender_"):
                gender_value = data.gender.strip().lower()
                processed_df[col] = 1 if col[7:].lower() == gender_value else 0

        # Remove raw 'gender' column if not expected
        if "gender" not in feature_columns and "gender" in processed_df.columns:
            processed_df = processed_df.drop(columns=["gender"])


        # Align with expected features
        for col in feature_columns:
            if col not in processed_df.columns:
                processed_df[col] = 0
        processed_df = processed_df[feature_columns]

        # Predict
        prediction = model.predict(processed_df)[0]
        probability = model.predict_proba(processed_df)[0][prediction]

        return {
            "prediction": "Pass" if prediction == 1 else "Fail",
            "confidence": round(probability * 100, 2),
            "features_used": feature_columns
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Model prediction failed: {str(e)}")

# uvicorn src.main:app --reload