from fastapi import APIRouter, UploadFile, File, HTTPException
import pandas as pd
from io import BytesIO

router = APIRouter()

REQUIRED_COLUMNS = {
    "student_id", "gender", "age", "parent_education", "attendance_rate",
    "study_hours", "previous_gpa", "final_grade", "assignment_score_avg",
    "exam_score_avg", "class_participation", "late_submissions",
    "previous_gpa_sem1", "previous_gpa_sem2"
}

@router.post("/upload-csv")
async def upload_csv(file: UploadFile = File(...)):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported.")

    try:
        contents = await file.read()
        df = pd.read_csv(BytesIO(contents))

        # Normalize headers
        df.columns = [col.strip().lower().replace(" ", "_") for col in df.columns]

        # Validate required columns
        missing = REQUIRED_COLUMNS - set(df.columns)
        if missing:
            raise HTTPException(status_code=422, detail=f"Missing columns: {', '.join(missing)}")

        # Dummy prediction logic (replace with real model)
        df["confidence"] = 0.72  # placeholder
        df["prediction"] = df["confidence"].apply(lambda x: "pass" if x > 0.5 else "fail")

        results = df[["student_id", "prediction", "confidence"]].to_dict(orient="records")
        return {
            "results": results,
            "count": len(results),
            "columns_received": list(df.columns)
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")