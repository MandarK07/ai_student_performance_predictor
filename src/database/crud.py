"""
CRUD operations for database models
"""
from typing import List, Optional
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc, and_, func, or_
from datetime import datetime
import uuid

from src.database.models import (
    Student, Parent, AcademicRecord, Course,
    Enrollment, Grade, Prediction, MLModel, Intervention, User, AuthSession, AuditLog,
    EnrollmentInvite
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


def get_student_parents(db: Session, student_id: uuid.UUID) -> List[Parent]:
    """Get guardian contacts for a student, prioritizing the primary contact."""
    return db.query(Parent).filter(
        Parent.student_id == student_id
    ).order_by(
        desc(Parent.is_primary_contact),
        Parent.created_at.asc()
    ).all()


def create_parent(db: Session, parent_data: dict) -> Parent:
    """Create a guardian contact for a student."""
    if parent_data.get("is_primary_contact"):
        db.query(Parent).filter(
            Parent.student_id == parent_data["student_id"],
            Parent.is_primary_contact == True
        ).update({"is_primary_contact": False})

    parent = Parent(**parent_data)
    db.add(parent)
    db.commit()
    db.refresh(parent)
    return parent


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


def get_student_prediction_history(
    db: Session,
    student_id: uuid.UUID,
    limit: int = 100
) -> List[Prediction]:
    """Get prediction history for a student with model and interventions"""
    return db.query(Prediction).options(
        joinedload(Prediction.model),
        joinedload(Prediction.interventions)
    ).filter(
        Prediction.student_id == student_id
    ).order_by(
        desc(Prediction.prediction_date)
    ).limit(limit).all()


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
    """Get students whose latest prediction is high or critical risk."""
    latest_prediction_subquery = db.query(
        Prediction.student_id.label("student_id"),
        func.max(Prediction.prediction_date).label("latest_prediction_date")
    ).group_by(
        Prediction.student_id
    ).subquery()

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
        latest_prediction_subquery,
        Student.student_id == latest_prediction_subquery.c.student_id
    ).join(
        Prediction, Student.student_id == Prediction.student_id
    ).filter(
        and_(
            Student.status == 'active',
            Prediction.prediction_date == latest_prediction_subquery.c.latest_prediction_date,
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
# AUTH & USER OPERATIONS
# =============================================================================

def get_user_by_username(db: Session, username: str) -> Optional[User]:
    """Get user by username"""
    return db.query(User).filter(User.username == username).first()


def get_user_by_email(db: Session, email: str) -> Optional[User]:
    """Get user by email"""
    return db.query(User).filter(User.email == email).first()


def get_user_by_id(db: Session, user_id: uuid.UUID) -> Optional[User]:
    """Get user by UUID"""
    return db.query(User).filter(User.user_id == user_id).first()


def create_user(db: Session, user_data: dict) -> User:
    """Create a new user."""
    user = User(**user_data)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def update_user_last_login(db: Session, user_id: uuid.UUID) -> Optional[User]:
    """Update user's last successful login time and reset failed attempts."""
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        return None
    user.last_login = datetime.utcnow()
    user.failed_login_attempts = 0
    user.locked_until = None
    db.commit()
    db.refresh(user)
    return user


def increment_failed_login_attempts(
    db: Session,
    user_id: uuid.UUID,
    lock_until: Optional[datetime] = None
) -> Optional[User]:
    """Increment failed login counter and optionally lock account."""
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        return None
    user.failed_login_attempts = (user.failed_login_attempts or 0) + 1
    if lock_until:
        user.locked_until = lock_until
    db.commit()
    db.refresh(user)
    return user


def reset_failed_login_attempts(db: Session, user_id: uuid.UUID) -> Optional[User]:
    """Reset failed login counter and unlock account."""
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        return None
    user.failed_login_attempts = 0
    user.locked_until = None
    db.commit()
    db.refresh(user)
    return user


def update_user_password(
    db: Session,
    user_id: uuid.UUID,
    password_hash: str
) -> Optional[User]:
    """Update user password hash and password-changed timestamp."""
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        return None
    user.password_hash = password_hash
    user.password_changed_at = datetime.utcnow()
    db.commit()
    db.refresh(user)
    return user


def create_auth_session(db: Session, session_data: dict) -> AuthSession:
    """Create refresh-token backed auth session."""
    session = AuthSession(**session_data)
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


def get_auth_session_by_id(db: Session, session_id: uuid.UUID) -> Optional[AuthSession]:
    """Get auth session by session ID."""
    return db.query(AuthSession).filter(AuthSession.session_id == session_id).first()


def get_auth_session_by_refresh_hash(db: Session, refresh_token_hash: str) -> Optional[AuthSession]:
    """Get auth session by stored refresh token hash."""
    return db.query(AuthSession).filter(AuthSession.refresh_token_hash == refresh_token_hash).first()


def mark_auth_session_used(db: Session, session_id: uuid.UUID) -> Optional[AuthSession]:
    """Update last-used timestamp for session activity tracking."""
    session = get_auth_session_by_id(db, session_id)
    if not session:
        return None
    session.last_used_at = datetime.utcnow()
    db.commit()
    db.refresh(session)
    return session


def revoke_auth_session(
    db: Session,
    session_id: uuid.UUID,
    reason: Optional[str] = None
) -> Optional[AuthSession]:
    """Revoke a single auth session."""
    session = get_auth_session_by_id(db, session_id)
    if not session:
        return None
    session.revoked_at = datetime.utcnow()
    session.revoke_reason = reason
    db.commit()
    db.refresh(session)
    return session


def rotate_auth_session(
    db: Session,
    old_session_id: uuid.UUID,
    new_session_data: dict,
    revoke_reason: str = "rotated"
) -> Optional[AuthSession]:
    """Rotate refresh session by revoking old and creating a replacement."""
    old_session = get_auth_session_by_id(db, old_session_id)
    if not old_session:
        return None

    old_session.revoked_at = datetime.utcnow()
    old_session.revoke_reason = revoke_reason

    # Keep family lineage unless explicitly overridden.
    if "token_family" not in new_session_data:
        new_session_data["token_family"] = old_session.token_family

    new_session = AuthSession(**new_session_data)
    db.add(new_session)
    db.flush()
    old_session.replaced_by_session_id = new_session.session_id
    db.commit()
    db.refresh(new_session)
    return new_session


def revoke_all_auth_sessions_for_user(
    db: Session,
    user_id: uuid.UUID,
    reason: str = "logout_all"
) -> int:
    """Revoke all active sessions for a user."""
    active_sessions = db.query(AuthSession).filter(
        and_(
            AuthSession.user_id == user_id,
            AuthSession.revoked_at.is_(None)
        )
    ).all()

    now = datetime.utcnow()
    for session in active_sessions:
        session.revoked_at = now
        session.revoke_reason = reason
    db.commit()
    return len(active_sessions)


def revoke_auth_sessions_by_family(
    db: Session,
    token_family: uuid.UUID,
    reason: str = "family_revoked"
) -> int:
    """Revoke all active sessions in the same token family."""
    active_sessions = db.query(AuthSession).filter(
        and_(
            AuthSession.token_family == token_family,
            AuthSession.revoked_at.is_(None)
        )
    ).all()

    now = datetime.utcnow()
    for session in active_sessions:
        session.revoked_at = now
        session.revoke_reason = reason
    db.commit()
    return len(active_sessions)


def create_audit_log(db: Session, log_data: dict) -> AuditLog:
    """Write an audit event."""
    log_entry = AuditLog(**log_data)
    db.add(log_entry)
    db.commit()
    db.refresh(log_entry)
    return log_entry


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


# =============================================================================
# ENROLLMENT INVITES
# =============================================================================
def create_enrollment_invite(db: Session, invite_data: dict) -> EnrollmentInvite:
    invite = EnrollmentInvite(**invite_data)
    db.add(invite)
    db.commit()
    db.refresh(invite)
    return invite


def get_enrollment_invite_by_hash(db: Session, token_hash: str) -> Optional[EnrollmentInvite]:
    return db.query(EnrollmentInvite).filter(EnrollmentInvite.token_hash == token_hash).first()


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
