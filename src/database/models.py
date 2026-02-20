"""
SQLAlchemy ORM models for database tables
"""
from datetime import datetime, date
from enum import Enum
from sqlalchemy import (
    Column, String, Integer, Float, Date, DateTime, Boolean,
    Text, ForeignKey, JSON
)
from sqlalchemy.dialects.postgresql import UUID, INET
from sqlalchemy.orm import relationship
import uuid
from src.database.connection import Base



# =============================================================================
# CORE MODELS
# =============================================================================
class StatusEnum(str, Enum):
    active = "active"
    inactive = "inactive"



class Student(Base):
    __tablename__ = "students"
    
    student_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_code = Column(String(50), unique=True, nullable=False, index=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    date_of_birth = Column(Date, nullable=False)
    gender = Column(String(20))
    enrollment_date = Column(Date, nullable=False, default=date.today)
    status = Column(String(20), default='active')
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    parents = relationship("Parent", back_populates="student", cascade="all, delete-orphan")
    academic_records = relationship("AcademicRecord", back_populates="student", cascade="all, delete-orphan")
    enrollments = relationship("Enrollment", back_populates="student", cascade="all, delete-orphan")
    predictions = relationship("Prediction", back_populates="student", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Student {self.student_code}: {self.first_name} {self.last_name}>"


class Parent(Base):
    __tablename__ = "parents"
    
    parent_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = Column(UUID(as_uuid=True), ForeignKey('students.student_id', ondelete='CASCADE'), nullable=False)
    name = Column(String(200), nullable=False)
    relation = Column(String(50))
    education_level = Column(String(100))
    occupation = Column(String(200))
    phone = Column(String(20))
    email = Column(String(255))
    is_primary_contact = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    student = relationship("Student", back_populates="parents")

    def __repr__(self):
        return f"<Parent {self.name} for Student {self.student_id}>"


class AcademicRecord(Base):
    __tablename__ = "academic_records"
    
    record_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = Column(UUID(as_uuid=True), ForeignKey('students.student_id', ondelete='CASCADE'), nullable=False)
    academic_year = Column(String(20), nullable=False)
    semester = Column(String(20), nullable=False)
    gpa = Column(Float)
    total_credits = Column(Integer, default=0)
    attendance_rate = Column(Float)
    study_hours_per_week = Column(Float)
    class_participation_score = Column(Float)
    late_submissions = Column(Integer, default=0)
    absences = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    student = relationship("Student", back_populates="academic_records")

    def __repr__(self):
        return f"<AcademicRecord {self.academic_year} {self.semester} - GPA: {self.gpa}>"


class Course(Base):
    __tablename__ = "courses"
    
    course_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    course_code = Column(String(20), unique=True, nullable=False)
    course_name = Column(String(200), nullable=False)
    description = Column(Text)
    credits = Column(Integer, nullable=False)
    department = Column(String(100))
    difficulty_level = Column(String(20))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    enrollments = relationship("Enrollment", back_populates="course", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Course {self.course_code}: {self.course_name}>"


class Enrollment(Base):
    __tablename__ = "enrollments"
    
    enrollment_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = Column(UUID(as_uuid=True), ForeignKey('students.student_id', ondelete='CASCADE'), nullable=False)
    course_id = Column(UUID(as_uuid=True), ForeignKey('courses.course_id', ondelete='CASCADE'), nullable=False)
    academic_year = Column(String(20), nullable=False)
    semester = Column(String(20), nullable=False)
    enrollment_date = Column(Date, default=date.today)
    status = Column(String(20), default='enrolled')
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    student = relationship("Student", back_populates="enrollments")
    course = relationship("Course", back_populates="enrollments")
    grades = relationship("Grade", back_populates="enrollment", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Enrollment {self.student_id} in {self.course_id}>"


class Grade(Base):
    __tablename__ = "grades"
    
    grade_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    enrollment_id = Column(UUID(as_uuid=True), ForeignKey('enrollments.enrollment_id', ondelete='CASCADE'), nullable=False)
    assessment_type = Column(String(50))
    assessment_name = Column(String(200), nullable=False)
    score = Column(Float, nullable=False)
    max_score = Column(Float, nullable=False)
    weight = Column(Float, default=1.0)
    submission_date = Column(DateTime)
    due_date = Column(DateTime)
    is_late = Column(Boolean, default=False)
    feedback = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    enrollment = relationship("Enrollment", back_populates="grades")

    def __repr__(self):
        return f"<Grade {self.assessment_name}: {self.score}/{self.max_score}>"


# =============================================================================
# PREDICTION MODELS
# =============================================================================

class MLModel(Base):
    __tablename__ = "ml_models"
    
    model_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    model_name = Column(String(200), nullable=False)
    model_version = Column(String(50), nullable=False)
    algorithm = Column(String(100), nullable=False)
    file_path = Column(String(500), nullable=False)
    accuracy = Column(Float)
    precision_score = Column(Float)
    recall_score = Column(Float)
    f1_score = Column(Float)
    training_date = Column(DateTime, nullable=False)
    is_active = Column(Boolean, default=True)
    hyperparameters = Column(JSON)
    feature_importance = Column(JSON)
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    predictions = relationship("Prediction", back_populates="model")

    def __repr__(self):
        return f"<MLModel {self.model_name} v{self.model_version}>"


class Prediction(Base):
    __tablename__ = "predictions"
    
    prediction_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = Column(UUID(as_uuid=True), ForeignKey('students.student_id', ondelete='CASCADE'), nullable=False)
    model_id = Column(UUID(as_uuid=True), ForeignKey('ml_models.model_id'), nullable=False)
    academic_year = Column(String(20), nullable=False)
    semester = Column(String(20), nullable=False)
    predicted_gpa = Column(Float)
    predicted_performance_category = Column(String(50))
    confidence_score = Column(Float)
    risk_level = Column(String(20))
    input_features = Column(JSON, nullable=False)
    recommendation = Column(Text)
    prediction_date = Column(DateTime, default=datetime.utcnow)
    actual_gpa = Column(Float)
    is_accurate = Column(Boolean)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    student = relationship("Student", back_populates="predictions")
    model = relationship("MLModel", back_populates="predictions")
    interventions = relationship("Intervention", back_populates="prediction", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Prediction for {self.student_id}: {self.predicted_gpa} (confidence: {self.confidence_score})>"


class Intervention(Base):
    __tablename__ = "interventions"
    
    intervention_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    prediction_id = Column(UUID(as_uuid=True), ForeignKey('predictions.prediction_id', ondelete='CASCADE'), nullable=False)
    intervention_type = Column(String(100))
    priority = Column(String(20))
    description = Column(Text, nullable=False)
    assigned_to = Column(String(200))
    status = Column(String(50), default='pending')
    due_date = Column(Date)
    completed_date = Column(Date)
    outcome = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    prediction = relationship("Prediction", back_populates="interventions")

    def __repr__(self):
        return f"<Intervention {self.intervention_type} - {self.status}>"


# =============================================================================
# SYSTEM MODELS
# =============================================================================

class User(Base):
    __tablename__ = "users"
    
    user_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username = Column(String(100), unique=True, nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50))
    full_name = Column(String(200), nullable=False)
    is_active = Column(Boolean, default=True)
    last_login = Column(DateTime)
    failed_login_attempts = Column(Integer, default=0, nullable=False)
    locked_until = Column(DateTime)
    password_changed_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    auth_sessions = relationship("AuthSession", back_populates="user", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="user")
    uploads = relationship("UploadHistory", back_populates="user")

    def __repr__(self):
        return f"<User {self.username} ({self.role})>"


class AuthSession(Base):
    __tablename__ = "auth_sessions"

    session_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.user_id', ondelete='CASCADE'), nullable=False, index=True)
    refresh_token_hash = Column(String(255), unique=True, nullable=False)
    token_family = Column(UUID(as_uuid=True), default=uuid.uuid4, nullable=False, index=True)
    replaced_by_session_id = Column(UUID(as_uuid=True), ForeignKey('auth_sessions.session_id'))
    expires_at = Column(DateTime, nullable=False)
    revoked_at = Column(DateTime)
    revoke_reason = Column(String(255))
    user_agent = Column(String(500))
    ip_address = Column(INET)
    last_used_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="auth_sessions", foreign_keys=[user_id])
    replaced_by = relationship("AuthSession", remote_side=[session_id], uselist=False)

    def __repr__(self):
        return f"<AuthSession {self.session_id} user={self.user_id}>"


class AuditLog(Base):
    __tablename__ = "audit_log"

    log_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.user_id'))
    action = Column(String(100), nullable=False)
    table_name = Column(String(100))
    record_id = Column(UUID(as_uuid=True))
    old_values = Column(JSON)
    new_values = Column(JSON)
    ip_address = Column(INET)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="audit_logs")

    def __repr__(self):
        return f"<AuditLog {self.action} at {self.created_at}>"


class UploadHistory(Base):
    __tablename__ = "upload_history"
    
    upload_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.user_id'))
    file_name = Column(String(500), nullable=False)
    file_size = Column(Integer)
    records_processed = Column(Integer, default=0)
    records_success = Column(Integer, default=0)
    records_failed = Column(Integer, default=0)
    error_log = Column(JSON)
    status = Column(String(50), default='processing')
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    processed_at = Column(DateTime)

    # Relationships
    user = relationship("User", back_populates="uploads")

    def __repr__(self):
        return f"<UploadHistory {self.file_name} - {self.status}>"
