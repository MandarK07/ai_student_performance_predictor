"""
CRUD operations for database models
"""
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc, and_, or_
from datetime import datetime
import uuid

from src.database.models import (
    Student, Parent, AcademicRecord, Course, 
    Enrollment, Grade, Prediction, MLModel, Intervention
)


# =============================================================================
# STUDENT OPERATIONS
# =============================================================================

def create_student(db: Session, student_data: dict) -> Student:
    """Create a new student"""
    student = Student(**student_data)
    db.add(student)
    db.commit()
    db.refresh(student)
    return student


def get_student_by_id(db: Session, student_id: uuid.UUID) -> Optional[Student]:
    """Get student by UUID"""
    return db.query(Student).filter(Student.student_id == student_id).first()


def get_student_by_code(db: Session, student_code: str) -> Optional[Student]:
    """Get student by student code"""
    return db.query(Student).filter(Student.student_code == student_code).first()


def get_students(
    db: Session, 
    skip: int = 0, 
    limit: int = 100, 
    status: Optional[str] = None
) -> List[Student]:
    """Get list of students with pagination"""
    query = db.query(Student)
    if status:
        query = query.filter(Student.status == status)
    return query.offset(skip).limit(limit).all()


def search_students(db: Session, search_term: str) -> List[Student]:
    """Search students by name or email"""
    search_pattern = f"%{search_term}%"
    return db.query(Student).filter(
        or_(
            Student.first_name.ilike(search_pattern),
            Student.last_name.ilike(search_pattern),
            Student.email.ilike(search_pattern),
            Student.student_code.ilike(search_pattern)
        )
    ).all()


def update_student(db: Session, student_id: uuid.UUID, update_data: dict) -> Optional[Student]:
    """Update student information"""
    student = get_student_by_id(db, student_id)
    if student:
        for key, value in update_data.items():
            setattr(student, key, value)
        student.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(student)
    return student

def get_student_by_email(db: Session, email: str):
    return db.query(Student).filter(Student.email == email).first()


# =============================================================================
# ACADEMIC RECORD OPERATIONS
# =============================================================================

def create_academic_record(db: Session, record_data: dict) -> AcademicRecord:
    """Create or update academic record"""
    existing = db.query(AcademicRecord).filter(
        and_(
            AcademicRecord.student_id == record_data['student_id'],
            AcademicRecord.academic_year == record_data['academic_year'],
            AcademicRecord.semester == record_data['semester']
        )
    ).first()
    
    if existing:
        for key, value in record_data.items():
            setattr(existing, key, value)
        existing.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(existing)
        return existing
    else:
        record = AcademicRecord(**record_data)
        db.add(record)
        db.commit()
        db.refresh(record)
        return record


def get_student_academic_history(
    db: Session, 
    student_id: uuid.UUID
) -> List[AcademicRecord]:
    """Get all academic records for a student"""
    return db.query(AcademicRecord).filter(
        AcademicRecord.student_id == student_id
    ).order_by(
        desc(AcademicRecord.academic_year), 
        desc(AcademicRecord.semester)
    ).all()


def get_latest_academic_record(
    db: Session, 
    student_id: uuid.UUID
) -> Optional[AcademicRecord]:
    """Get the most recent academic record for a student"""
    return db.query(AcademicRecord).filter(
        AcademicRecord.student_id == student_id
    ).order_by(
        desc(AcademicRecord.academic_year), 
        desc(AcademicRecord.semester)
    ).first()


# =============================================================================
# PREDICTION OPERATIONS
# =============================================================================

def create_prediction(db: Session, prediction_data: dict) -> Prediction:
    """Save a new prediction"""
    prediction = Prediction(**prediction_data)
    db.add(prediction)
    db.commit()
    db.refresh(prediction)
    return prediction


def get_latest_prediction(
    db: Session, 
    student_id: uuid.UUID
) -> Optional[Prediction]:
    """Get the most recent prediction for a student"""
    return db.query(Prediction).filter(
        Prediction.student_id == student_id
    ).order_by(desc(Prediction.prediction_date)).first()


def get_predictions_by_risk_level(
    db: Session, 
    risk_level: str, 
    limit: int = 50
) -> List[Prediction]:
    """Get predictions filtered by risk level"""
    return db.query(Prediction).filter(
        Prediction.risk_level == risk_level
    ).order_by(desc(Prediction.prediction_date)).limit(limit).all()


def get_at_risk_students(db: Session) -> List[dict]:
    """Get students with high or critical risk levels"""
    results = db.query(
        Student.student_code,
        Student.first_name,
        Student.last_name,
        Student.email,
        Prediction.predicted_gpa,
        Prediction.risk_level,
        Prediction.confidence_score,
        Prediction.recommendation
    ).join(
        Prediction, Student.student_id == Prediction.student_id
    ).filter(
        and_(
            Student.status == 'active',
            Prediction.risk_level.in_(['High', 'Critical'])
        )
    ).order_by(desc(Prediction.prediction_date)).all()
    
    return [
        {
            'student_code': r.student_code,
            'full_name': f"{r.first_name} {r.last_name}",
            'email': r.email,
            'predicted_gpa': r.predicted_gpa,
            'risk_level': r.risk_level,
            'confidence_score': r.confidence_score,
            'recommendation': r.recommendation
        }
        for r in results
    ]


# =============================================================================
# ML MODEL OPERATIONS
# =============================================================================

def create_ml_model(db: Session, model_data: dict) -> MLModel:
    """Register a new ML model"""
    # Deactivate previous active models with same name
    db.query(MLModel).filter(
        and_(
            MLModel.model_name == model_data['model_name'],
            MLModel.is_active == True
        )
    ).update({'is_active': False})
    
    model = MLModel(**model_data)
    db.add(model)
    db.commit()
    db.refresh(model)
    return model


def get_active_model(db: Session) -> Optional[MLModel]:
    """Get the currently active ML model"""
    return db.query(MLModel).filter(MLModel.is_active == True).first()


def get_model_by_id(db: Session, model_id: uuid.UUID) -> Optional[MLModel]:
    """Get ML model by ID"""
    return db.query(MLModel).filter(MLModel.model_id == model_id).first()


# =============================================================================
# INTERVENTION OPERATIONS
# =============================================================================

def create_intervention(db: Session, intervention_data: dict) -> Intervention:
    """Create a new intervention"""
    intervention = Intervention(**intervention_data)
    db.add(intervention)
    db.commit()
    db.refresh(intervention)
    return intervention


def get_pending_interventions(db: Session, limit: int = 50) -> List[Intervention]:
    """Get all pending interventions"""
    return db.query(Intervention).filter(
        Intervention.status == 'pending'
    ).order_by(
        Intervention.priority.desc(),
        Intervention.due_date.asc()
    ).limit(limit).all()


def update_intervention_status(
    db: Session, 
    intervention_id: uuid.UUID, 
    status: str,
    outcome: Optional[str] = None
) -> Optional[Intervention]:
    """Update intervention status"""
    intervention = db.query(Intervention).filter(
        Intervention.intervention_id == intervention_id
    ).first()
    
    if intervention:
        intervention.status = status
        if outcome:
            intervention.outcome = outcome
        if status == 'completed':
            intervention.completed_date = datetime.utcnow().date()
        intervention.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(intervention)
    return intervention


# =============================================================================
# ENROLLMENT & GRADE OPERATIONS
# =============================================================================

def create_enrollment(db: Session, enrollment_data: dict) -> Enrollment:
    """Enroll a student in a course"""
    enrollment = Enrollment(**enrollment_data)
    db.add(enrollment)
    db.commit()
    db.refresh(enrollment)
    return enrollment


def get_student_enrollments(
    db: Session, 
    student_id: uuid.UUID, 
    academic_year: Optional[str] = None,
    semester: Optional[str] = None
) -> List[Enrollment]:
    """Get student's course enrollments"""
    query = db.query(Enrollment).filter(Enrollment.student_id == student_id)
    if academic_year:
        query = query.filter(Enrollment.academic_year == academic_year)
    if semester:
        query = query.filter(Enrollment.semester == semester)
    return query.all()


def add_grade(db: Session, grade_data: dict) -> Grade:
    """Add a grade for an enrollment"""
    grade = Grade(**grade_data)
    db.add(grade)
    db.commit()
    db.refresh(grade)
    return grade


# =============================================================================
# ANALYTICS & REPORTING
# =============================================================================

def get_performance_statistics(db: Session, academic_year: str, semester: str) -> dict:
    """Get aggregated performance statistics"""
    from sqlalchemy import func
    
    stats = db.query(
        func.count(AcademicRecord.record_id).label('total_students'),
        func.avg(AcademicRecord.gpa).label('avg_gpa'),
        func.avg(AcademicRecord.attendance_rate).label('avg_attendance'),
        func.avg(AcademicRecord.study_hours_per_week).label('avg_study_hours')
    ).filter(
        and_(
            AcademicRecord.academic_year == academic_year,
            AcademicRecord.semester == semester
        )
    ).first()
    
    return {
        'total_students': stats.total_students or 0,
        'avg_gpa': round(stats.avg_gpa, 2) if stats.avg_gpa else 0,
        'avg_attendance': round(stats.avg_attendance, 2) if stats.avg_attendance else 0,
        'avg_study_hours': round(stats.avg_study_hours, 2) if stats.avg_study_hours else 0
    }
