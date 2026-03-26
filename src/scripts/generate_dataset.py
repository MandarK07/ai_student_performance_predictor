"""
Generate a large realistic dataset for AI Student Performance Predictor
"""
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import random

# Set random seed for reproducibility
np.random.seed(42)
random.seed(42)

def generate_student_dataset(num_students=1000):
    """
    Generate realistic student performance data
    """

    # Derive current Indian academic year (July–June cycle)
    today = datetime.now()
    start_year = today.year if today.month >= 7 else today.year - 1
    academic_year_value = f"{start_year}-{start_year + 1}"
    semesters = ["Odd", "Even"]

    # Define realistic value ranges and distributions
    genders = ['Male', 'Female', 'Other']
    parent_education_levels = [
        'High School', 'Some College', 'Associate Degree', 
        'Bachelor Degree', 'Master Degree', 'Doctorate'
    ]
    
    # Weight education levels realistically
    education_weights = [0.25, 0.20, 0.15, 0.25, 0.10, 0.05]
    
    data = []
    
    for i in range(num_students):
        student_code = f"{start_year}{(i + 1):05d}"
        
        # Basic demographics
        gender = random.choice(genders)
        age = random.randint(17, 26)
        parent_education = random.choices(parent_education_levels, weights=education_weights)[0]
        
        # Parent education influences base performance
        edu_impact = {
            'High School': 0.0,
            'Some College': 0.1,
            'Associate Degree': 0.2,
            'Bachelor Degree': 0.3,
            'Master Degree': 0.4,
            'Doctorate': 0.5
        }
        # Base performance now centered around 6 on a 0-10 GPA scale
        base_performance = 6.0 + (edu_impact[parent_education] * 2)
        
        # Attendance rate (70-100%) - normally distributed
        attendance_rate = np.clip(np.random.normal(85, 10), 70, 100)
        
        # Study hours per week (0-40) - skewed distribution
        study_hours = np.clip(np.random.gamma(3, 3), 0, 40)
        
        # Previous GPAs (influenced by study habits and attendance)
        attendance_factor = (attendance_rate - 70) / 30
        study_factor = study_hours / 40
        
        previous_gpa_sem1 = np.clip(
            base_performance +
            attendance_factor * 1.2 +
            study_factor * 1.0 +
            np.random.normal(0, 0.5),
            0, 10.0
        )

        previous_gpa_sem2 = np.clip(
            previous_gpa_sem1 + np.random.normal(0, 0.4),
            0, 10.0
        )
        
        previous_gpa = (previous_gpa_sem1 + previous_gpa_sem2) / 2
        
        # Class participation (0-10) - correlated with engagement
        class_participation = np.clip(
            5 + (study_hours / 8) + np.random.normal(0, 1.5),
            0, 10
        )
        
        # Assignment scores (influenced by study hours and participation)
        assignment_score_avg = np.clip(
            60 + 
            (study_hours * 0.8) + 
            (class_participation * 2) + 
            np.random.normal(0, 8),
            0, 100
        )
        
        # Exam scores (similar pattern but slightly different)
        exam_score_avg = np.clip(
            55 +
            (study_hours * 0.9) +
            (previous_gpa * 4) +
            np.random.normal(0, 10),
            0, 100
        )
        
        # Final grade (weighted combination)
        final_grade = np.clip(
            assignment_score_avg * 0.4 + 
            exam_score_avg * 0.4 + 
            class_participation * 2 + 
            np.random.normal(0, 5),
            0, 100
        )
        
        # Late submissions (inversely correlated with performance)
        late_submissions = int(np.clip(
            np.random.poisson(max(0, 10 - study_hours / 2)),
            0, 20
        ))
        
        # Additional fields for enriched dataset
        first_name = generate_first_name(gender)
        last_name = generate_last_name()
        email = f"{first_name.lower()}.{last_name.lower()}@student.in"
        enrollment_date = (today - timedelta(days=random.randint(365, 1460))).strftime('%Y-%m-%d')
        
        # Academic info
        academic_year = academic_year_value
        semester = random.choice(semesters)
        
        data.append({
            'student_code': student_code,
            'first_name': first_name,
            'last_name': last_name,
            'email': email,
            'gender': gender,
            'age': age,
            'enrollment_date': enrollment_date,
            'academic_year': academic_year,
            'semester': semester,
            'parent_education': parent_education,
            'attendance_rate': round(attendance_rate, 2),
            'study_hours': round(study_hours, 2),
            'previous_gpa': round(previous_gpa, 2),
            'previous_gpa_sem1': round(previous_gpa_sem1, 2),
            'previous_gpa_sem2': round(previous_gpa_sem2, 2),
            'class_participation': round(class_participation, 2),
            'assignment_score_avg': round(assignment_score_avg, 2),
            'exam_score_avg': round(exam_score_avg, 2),
            'final_grade': round(final_grade, 2),
            'late_submissions': late_submissions
        })
    
    return pd.DataFrame(data)


def generate_first_name(gender):
    """Generate realistic first names (Indian context)"""
    male_names = [
        'Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Reyansh', 'Muhammad',
        'Sai', 'Ishaan', 'Kabir', 'Rudra', 'Atharv', 'Anirudh', 'Krishna',
        'Rohan', 'Rishi', 'Hrithik', 'Kunal', 'Sarthak', 'Yash'
    ]
    
    female_names = [
        'Aadhya', 'Aarohi', 'Diya', 'Myra', 'Ananya', 'Ira', 'Pari', 'Navya',
        'Saanvi', 'Anika', 'Ishita', 'Kiara', 'Meera', 'Ritika', 'Sneha',
        'Tara', 'Vaishnavi', 'Zara', 'Aanya', 'Nandini'
    ]

    neutral_names = ['Arya', 'Dev', 'Hari', 'Jai', 'Avi', 'Sam']
    
    if gender == 'Male':
        return random.choice(male_names)
    if gender == 'Female':
        return random.choice(female_names)
    return random.choice(neutral_names)


def generate_last_name():
    """Generate realistic last names (Indian context)"""
    last_names = [
        'Sharma', 'Verma', 'Iyer', 'Reddy', 'Patel', 'Singh', 'Gupta', 'Kumar',
        'Das', 'Nair', 'Bose', 'Chopra', 'Yadav', 'Rao', 'Pillai', 'Chowdhury',
        'Sheikh', 'Khan', 'Dutta', 'Menon', 'Mehta', 'Mukherjee', 'Joshi',
        'Kulkarni', 'Desai', 'Bhatt', 'Naidu', 'Mishra', 'Jain', 'Bhatia'
    ]
    return random.choice(last_names)


def add_data_quality_issues(df, missing_rate=0.02):
    """
    Add realistic data quality issues (missing values, outliers)
    """
    df_copy = df.copy()
    
    # Add some missing values randomly (2% of numeric fields)
    numeric_columns = ['attendance_rate', 'study_hours', 'class_participation']
    for col in numeric_columns:
        mask = np.random.random(len(df_copy)) < missing_rate
        df_copy.loc[mask, col] = np.nan
    
    return df_copy


def generate_test_dataset(num_students=200):
    """
    Generate a smaller test dataset with edge cases
    """
    df = generate_student_dataset(num_students)
    
    # Add some edge cases
    # High performers
    high_performers = df.sample(n=20)
    high_performers['attendance_rate'] = np.random.uniform(95, 100, 20)
    high_performers['study_hours'] = np.random.uniform(20, 35, 20)
    high_performers['previous_gpa'] = np.random.uniform(8.5, 10.0, 20)
    
    # At-risk students
    at_risk = df.sample(n=20)
    at_risk['attendance_rate'] = np.random.uniform(60, 75, 20)
    at_risk['study_hours'] = np.random.uniform(0, 8, 20)
    at_risk['previous_gpa'] = np.random.uniform(2.0, 5.0, 20)
    at_risk['late_submissions'] = np.random.randint(8, 20, 20)
    
    return df


if __name__ == "__main__":
    print("🔄 Generating student performance dataset...")
    
    # Generate main dataset (1000 students)
    print("📊 Creating main dataset with 1000 students...")
    df_main = generate_student_dataset(num_students=1000)
    
    # Save main dataset
    output_path = "data/raw/students.csv"
    df_main.to_csv(output_path, index=False)
    print(f"✅ Main dataset saved to: {output_path}")
    print(f"   - Total records: {len(df_main)}")
    print(f"   - Columns: {len(df_main.columns)}")
    
    # Generate larger dataset (5000 students) for training
    print("\n📊 Creating large training dataset with 5000 students...")
    df_large = generate_student_dataset(num_students=5000)
    df_large = add_data_quality_issues(df_large, missing_rate=0.02)
    
    output_path_large = "data/raw/students_large.csv"
    df_large.to_csv(output_path_large, index=False)
    print(f"✅ Large dataset saved to: {output_path_large}")
    print(f"   - Total records: {len(df_large)}")
    
    # Generate test dataset (200 students with edge cases)
    print("\n📊 Creating test dataset with 200 students...")
    df_test = generate_test_dataset(num_students=200)
    
    output_path_test = "data/raw/students_test.csv"
    df_test.to_csv(output_path_test, index=False)
    print(f"✅ Test dataset saved to: {output_path_test}")
    print(f"   - Total records: {len(df_test)}")
    
    # Display statistics
    print("\n📈 Dataset Statistics:")
    print(f"   Average GPA: {df_main['previous_gpa'].mean():.2f}")
    print(f"   Average Attendance: {df_main['attendance_rate'].mean():.2f}%")
    print(f"   Average Study Hours: {df_main['study_hours'].mean():.2f}")
    print(f"   Gender Distribution:")
    print(df_main['gender'].value_counts())
    print(f"\n   Parent Education Distribution:")
    print(df_main['parent_education'].value_counts())
    
    print("\n✨ Dataset generation complete!")
    print("\n💡 Next steps:")
    print("   1. Review the generated CSV files in data/raw/")
    print("   2. Run preprocessing: python scripts/ingest_data.py")
    print("   3. Train the model with the new data")
