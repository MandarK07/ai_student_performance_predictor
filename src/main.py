
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
from pydantic import BaseModel, Field
import joblib

from fastapi.responses import JSONResponse, Response
from fastapi.responses import HTMLResponse

from fastapi import APIRouter, UploadFile, File

from src.api.predict import router as predict_router
from src.api.upload import router as upload_router



# Load model and expected features
model_bundle = joblib.load("models/random_forest.joblib")
model = model_bundle["model"]
feature_columns = model_bundle["feature_columns"]



app = FastAPI(title="Student Performance Predictor")

# CORS middleware
# Allow requests from the React frontend
origins = [
    "http://localhost:5173",  # React dev server
]
 

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Or specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(predict_router, prefix="/api")
app.include_router(upload_router, prefix="/api")

#endpoint for home
@app.get("/", response_class=HTMLResponse)
def custom_home():
    return """
    <html>
        <head>
            <title>Student Predictor API</title>
        </head>
        <body style="font-family: Arial; text-align: center; margin-top: 50px;">
            <h1>📊 Welcome to the Student Performance Predictor</h1>
            <p>This API helps forecast academic outcomes based on student metrics.</p>
            <a href="/docs">Explore Swagger Docs</a>
            <p>Access the frontend dashboard below:</p>
            <a href="http://localhost:5173" target="_blank">📊 Open Dashboard</a>

        </body>
    </html>
    """


# Define input data model
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

# Prediction endpoint
@app.post("/predict/")
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

# CSV upload endpoint
router = APIRouter()
@router.post("/upload-csv")

async def upload_csv(file: UploadFile = File(...)):
    contents = await file.read()
    # Save or process the CSV as needed
    with open("data/uploads/" + file.filename, "wb") as f:
        f.write(contents)
    return {"filename": file.filename}


# uvicorn src.main:app --reload