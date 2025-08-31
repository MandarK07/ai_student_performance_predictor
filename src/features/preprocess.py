import pandas as pd

def preprocess_data(df: pd.DataFrame) -> pd.DataFrame:
    df = df.drop_duplicates()

    # Fill missing values only if columns exist
    if "attendance_rate" in df.columns:
        df["attendance_rate"] = df["attendance_rate"].fillna(df["attendance_rate"].median())
    if "previous_gpa" in df.columns:
        df["previous_gpa"] = df["previous_gpa"].fillna(df["previous_gpa"].median())
    if "assignment_score_avg" in df.columns:
        df["assignment_score_avg"] = df["assignment_score_avg"].fillna(df["assignment_score_avg"].mean())
    if "exam_score_avg" in df.columns:
        df["exam_score_avg"] = df["exam_score_avg"].fillna(df["exam_score_avg"].mean())
    if "class_participation" in df.columns:
        df["class_participation"] = df["class_participation"].fillna(5)
    if "late_submissions" in df.columns:
        df["late_submissions"] = df["late_submissions"].fillna(0)

    # Encode gender
    if "gender" in df.columns:
        df["gender"] = df["gender"].map({"Male": 0, "Female": 1})

    # One-hot encode parent education
    if "parent_education" in df.columns:
        df = pd.get_dummies(df, columns=["parent_education"], prefix="edu")

    # Feature engineering
    if "study_hours" in df.columns and "previous_gpa" in df.columns:
        df["hours_per_gpa"] = df["study_hours"] / (df["previous_gpa"] + 1)
    if "previous_gpa_sem2" in df.columns and "previous_gpa_sem1" in df.columns:
        df["grade_trend"] = df["previous_gpa_sem2"] - df["previous_gpa_sem1"]

    return df