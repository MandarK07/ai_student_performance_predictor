import pandas as pd
import numpy as np

def preprocess_data(df: pd.DataFrame) -> pd.DataFrame:
    """
    Clean and transform raw student data into model-ready features.
    Handles missing values, categorical encoding, and feature engineering.
    """
    if df.empty:
        return df

    # 1. Drop duplicate rows
    df = df.drop_duplicates()

    # 2. Handle missing values
    # Numeric columns: fill with median or mean
    numeric_fill_median = ["attendance_rate", "previous_gpa", "previous_gpa_sem1", "previous_gpa_sem2", "age"]
    numeric_fill_mean = ["assignment_score_avg", "exam_score_avg", "study_hours", "final_grade"]

    for col in numeric_fill_median:
        if col in df.columns:
            # fillna with median, fallback to 0 if median is NaN (all values missing)
            median_val = df[col].median()
            if pd.isna(median_val):
                median_val = 0
            df[col] = df[col].fillna(median_val)

    for col in numeric_fill_mean:
        if col in df.columns:
            # fillna with mean, fallback to 0 if mean is NaN (all values missing)
            mean_val = df[col].mean()
            if pd.isna(mean_val):
                mean_val = 0
            df[col] = df[col].fillna(mean_val)

    # Special handling for participation and late submissions
    if "class_participation" in df.columns:
        df["class_participation"] = df["class_participation"].fillna(5)
    if "late_submissions" in df.columns:
        df["late_submissions"] = df["late_submissions"].fillna(0)

    # 3. Encode categorical features
    # Gender one-hot encode
    if "gender" in df.columns:
        # Normalize gender strings
        df["gender"] = df["gender"].astype(str).str.strip().str.capitalize()
        df = pd.get_dummies(df, columns=["gender"], prefix="gender")
    
    # Ensure gender columns exist for model alignment fallback
    if "gender_Male" not in df.columns and "gender" not in df.columns:
        df["gender_Male"] = 0
    if "gender_Female" not in df.columns and "gender" not in df.columns:
        df["gender_Female"] = 0

    # Parent education one-hot encode
    if "parent_education" in df.columns:
        # Normalize values: remove spaces for consistent column naming
        # e.g. "High School" -> "HighSchool"
        df["parent_education"] = df["parent_education"].astype(str).str.replace(" ", "")
        df = pd.get_dummies(df, columns=["parent_education"], prefix="edu")

    # Academic year and semester one-hot
    if "academic_year" in df.columns:
        df["academic_year"] = df["academic_year"].astype(str).str.replace("-", "_")
        df = pd.get_dummies(df, columns=["academic_year"], prefix="year")
    
    if "semester" in df.columns:
        df = pd.get_dummies(df, columns=["semester"], prefix="sem")

    # 4. Feature engineering
    if "study_hours" in df.columns and "previous_gpa" in df.columns:
        # Use +1 to avoid division by zero if GPA is 0
        df["hours_per_gpa"] = df["study_hours"] / (df["previous_gpa"] + 1)

    if "previous_gpa_sem1" in df.columns and "previous_gpa_sem2" in df.columns:
        df["grade_trend"] = df["previous_gpa_sem2"] - df["previous_gpa_sem1"]

    return df
