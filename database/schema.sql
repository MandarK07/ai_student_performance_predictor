-- AI Student Performance Predictor - PostgreSQL Database Schema
-- Created: 2026-02-01

-- Enable UUID extension for generating unique identifiers
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- CORE TABLES
-- =============================================================================

-- Students table: Core student information
CREATE TABLE students (
    student_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_code VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    date_of_birth DATE NOT NULL,
    gender VARCHAR(20) CHECK (gender IN ('Male', 'Female', 'Other', 'Prefer not to say')),
    enrollment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'graduated', 'suspended')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Parent/Guardian information
CREATE TABLE parents (
    parent_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    relationship VARCHAR(50) CHECK (relationship IN ('Mother', 'Father', 'Guardian', 'Other')),
    education_level VARCHAR(100) CHECK (education_level IN 
        ('High School', 'Some College', 'Associate Degree', 'Bachelor Degree', 'Master Degree', 'Doctorate', 'Other')),
    occupation VARCHAR(200),
    phone VARCHAR(20),
    email VARCHAR(255),
    is_primary_contact BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Academic records
CREATE TABLE academic_records (
    record_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
    academic_year VARCHAR(20) NOT NULL,
    semester VARCHAR(20) NOT NULL,
    gpa DECIMAL(4, 2) CHECK (gpa >= 0 AND gpa <= 10.0),
    total_credits INTEGER DEFAULT 0,
    attendance_rate DECIMAL(5, 2) CHECK (attendance_rate >= 0 AND attendance_rate <= 100),
    study_hours_per_week DECIMAL(5, 2),
    class_participation_score DECIMAL(5, 2) CHECK (class_participation_score >= 0 AND class_participation_score <= 10),
    late_submissions INTEGER DEFAULT 0,
    absences INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, academic_year, semester)
);

-- Course catalog
CREATE TABLE courses (
    course_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_code VARCHAR(20) UNIQUE NOT NULL,
    course_name VARCHAR(200) NOT NULL,
    description TEXT,
    credits INTEGER NOT NULL,
    department VARCHAR(100),
    difficulty_level VARCHAR(20) CHECK (difficulty_level IN ('Beginner', 'Intermediate', 'Advanced')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Student enrollments in courses
CREATE TABLE enrollments (
    enrollment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(course_id) ON DELETE CASCADE,
    academic_year VARCHAR(20) NOT NULL,
    semester VARCHAR(20) NOT NULL,
    enrollment_date DATE DEFAULT CURRENT_DATE,
    status VARCHAR(20) DEFAULT 'enrolled' CHECK (status IN ('enrolled', 'dropped', 'completed', 'failed')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, course_id, academic_year, semester)
);

-- Course grades and assignments
CREATE TABLE grades (
    grade_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    enrollment_id UUID NOT NULL REFERENCES enrollments(enrollment_id) ON DELETE CASCADE,
    assessment_type VARCHAR(50) CHECK (assessment_type IN ('Assignment', 'Quiz', 'Midterm', 'Final', 'Project', 'Lab', 'Other')),
    assessment_name VARCHAR(200) NOT NULL,
    score DECIMAL(5, 2) NOT NULL,
    max_score DECIMAL(5, 2) NOT NULL,
    weight DECIMAL(5, 2) DEFAULT 1.0,
    submission_date TIMESTAMP,
    due_date TIMESTAMP,
    is_late BOOLEAN DEFAULT FALSE,
    feedback TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- PREDICTION TABLES
-- =============================================================================

-- ML model metadata
CREATE TABLE ml_models (
    model_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model_name VARCHAR(200) NOT NULL,
    model_version VARCHAR(50) NOT NULL,
    algorithm VARCHAR(100) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    accuracy DECIMAL(5, 4),
    precision_score DECIMAL(5, 4),
    recall_score DECIMAL(5, 4),
    f1_score DECIMAL(5, 4),
    training_date TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    hyperparameters JSONB,
    feature_importance JSONB,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(model_name, model_version)
);

-- Student performance predictions
CREATE TABLE predictions (
    prediction_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
    model_id UUID NOT NULL REFERENCES ml_models(model_id),
    academic_year VARCHAR(20) NOT NULL,
    semester VARCHAR(20) NOT NULL,
    predicted_gpa DECIMAL(4, 2) CHECK (predicted_gpa >= 0 AND predicted_gpa <= 10.0),
    predicted_performance_category VARCHAR(50) CHECK (predicted_performance_category IN 
        ('Excellent', 'Good', 'Average', 'Below Average', 'At Risk')),
    confidence_score DECIMAL(5, 4),
    risk_level VARCHAR(20) CHECK (risk_level IN ('Low', 'Medium', 'High', 'Critical')),
    input_features JSONB NOT NULL,
    recommendation TEXT,
    prediction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actual_gpa DECIMAL(4, 2) CHECK (actual_gpa >= 0 AND actual_gpa <= 10.0),
    is_accurate BOOLEAN,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Intervention recommendations
CREATE TABLE interventions (
    intervention_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prediction_id UUID NOT NULL REFERENCES predictions(prediction_id) ON DELETE CASCADE,
    intervention_type VARCHAR(100) CHECK (intervention_type IN 
        ('Tutoring', 'Counseling', 'Study Group', 'Time Management', 'Mentorship', 'Resource Allocation', 'Other')),
    priority VARCHAR(20) CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent')),
    description TEXT NOT NULL,
    assigned_to VARCHAR(200),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    due_date DATE,
    completed_date DATE,
    outcome TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- SYSTEM TABLES
-- =============================================================================

-- User accounts for the application
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) CHECK (role IN ('admin', 'teacher', 'counselor', 'student', 'parent')),
    full_name VARCHAR(200) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP,
    failed_login_attempts INTEGER NOT NULL DEFAULT 0,
    locked_until TIMESTAMP,
    password_changed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Authentication sessions (refresh token persistence and rotation)
CREATE TABLE auth_sessions (
    session_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    refresh_token_hash VARCHAR(255) UNIQUE NOT NULL,
    token_family UUID NOT NULL DEFAULT uuid_generate_v4(),
    replaced_by_session_id UUID REFERENCES auth_sessions(session_id),
    expires_at TIMESTAMP NOT NULL,
    revoked_at TIMESTAMP,
    revoke_reason VARCHAR(255),
    user_agent VARCHAR(500),
    ip_address INET,
    last_used_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Audit log for tracking changes
CREATE TABLE audit_log (
    log_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(user_id),
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(100),
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bulk upload history
CREATE TABLE upload_history (
    upload_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(user_id),
    file_name VARCHAR(500) NOT NULL,
    file_size INTEGER,
    records_processed INTEGER DEFAULT 0,
    records_success INTEGER DEFAULT 0,
    records_failed INTEGER DEFAULT 0,
    error_log JSONB,
    status VARCHAR(50) DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed', 'cancelled')),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP
);

-- =============================================================================
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- =============================================================================

CREATE INDEX idx_students_code ON students(student_code);
CREATE INDEX idx_students_email ON students(email);
CREATE INDEX idx_students_status ON students(status);

CREATE INDEX idx_parents_student ON parents(student_id);

CREATE INDEX idx_academic_records_student ON academic_records(student_id);
CREATE INDEX idx_academic_records_year_sem ON academic_records(academic_year, semester);

CREATE INDEX idx_enrollments_student ON enrollments(student_id);
CREATE INDEX idx_enrollments_course ON enrollments(course_id);
CREATE INDEX idx_enrollments_year_sem ON enrollments(academic_year, semester);

CREATE INDEX idx_grades_enrollment ON grades(enrollment_id);
CREATE INDEX idx_grades_type ON grades(assessment_type);

CREATE INDEX idx_predictions_student ON predictions(student_id);
CREATE INDEX idx_predictions_model ON predictions(model_id);
CREATE INDEX idx_predictions_date ON predictions(prediction_date);

CREATE INDEX idx_interventions_prediction ON interventions(prediction_id);
CREATE INDEX idx_interventions_status ON interventions(status);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_locked_until ON users(locked_until);
CREATE INDEX idx_auth_sessions_user_id ON auth_sessions(user_id);
CREATE INDEX idx_auth_sessions_token_family ON auth_sessions(token_family);
CREATE INDEX idx_auth_sessions_expires_at ON auth_sessions(expires_at);
CREATE INDEX idx_auth_sessions_revoked_at ON auth_sessions(revoked_at);

CREATE INDEX idx_audit_user ON audit_log(user_id);
CREATE INDEX idx_audit_created ON audit_log(created_at);

-- =============================================================================
-- TRIGGERS FOR AUTOMATIC TIMESTAMP UPDATES
-- =============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_academic_records_updated_at BEFORE UPDATE ON academic_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_interventions_updated_at BEFORE UPDATE ON interventions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_auth_sessions_updated_at BEFORE UPDATE ON auth_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- VIEWS FOR COMMON QUERIES
-- =============================================================================

-- Comprehensive student performance view
CREATE OR REPLACE VIEW student_performance_summary AS
SELECT 
    s.student_id,
    s.student_code,
    s.first_name || ' ' || s.last_name AS full_name,
    s.email,
    s.gender,
    ar.academic_year,
    ar.semester,
    ar.gpa,
    ar.attendance_rate,
    ar.study_hours_per_week,
    ar.class_participation_score,
    ar.late_submissions,
    ar.absences,
    p.education_level AS parent_education,
    COALESCE(AVG(g.score / g.max_score * 100), 0) AS avg_assignment_score,
    COUNT(DISTINCT e.enrollment_id) AS total_courses,
    p_pred.predicted_gpa,
    p_pred.predicted_performance_category,
    p_pred.confidence_score,
    p_pred.risk_level
FROM students s
LEFT JOIN academic_records ar ON s.student_id = ar.student_id
LEFT JOIN parents p ON s.student_id = p.student_id AND p.is_primary_contact = TRUE
LEFT JOIN enrollments e ON s.student_id = e.student_id 
    AND e.academic_year = ar.academic_year 
    AND e.semester = ar.semester
LEFT JOIN grades g ON e.enrollment_id = g.enrollment_id
LEFT JOIN LATERAL (
    SELECT * FROM predictions 
    WHERE student_id = s.student_id 
    ORDER BY prediction_date DESC 
    LIMIT 1
) p_pred ON TRUE
GROUP BY 
    s.student_id, s.student_code, s.first_name, s.last_name, s.email, s.gender,
    ar.academic_year, ar.semester, ar.gpa, ar.attendance_rate, 
    ar.study_hours_per_week, ar.class_participation_score, 
    ar.late_submissions, ar.absences, p.education_level,
    p_pred.predicted_gpa, p_pred.predicted_performance_category, 
    p_pred.confidence_score, p_pred.risk_level;

-- At-risk students view
CREATE OR REPLACE VIEW at_risk_students AS
SELECT 
    s.student_id,
    s.student_code,
    s.first_name || ' ' || s.last_name AS full_name,
    s.email,
    p.predicted_gpa,
    p.predicted_performance_category,
    p.risk_level,
    p.confidence_score,
    p.recommendation,
    ar.gpa AS current_gpa,
    ar.attendance_rate,
    COUNT(i.intervention_id) AS active_interventions
FROM students s
JOIN predictions p ON s.student_id = p.student_id
LEFT JOIN academic_records ar ON s.student_id = ar.student_id
LEFT JOIN interventions i ON p.prediction_id = i.prediction_id 
    AND i.status IN ('pending', 'in_progress')
WHERE p.risk_level IN ('High', 'Critical')
    AND s.status = 'active'
GROUP BY 
    s.student_id, s.student_code, s.first_name, s.last_name, s.email,
    p.predicted_gpa, p.predicted_performance_category, p.risk_level,
    p.confidence_score, p.recommendation, ar.gpa, ar.attendance_rate;

-- Course performance analytics
CREATE OR REPLACE VIEW course_performance_analytics AS
SELECT 
    c.course_id,
    c.course_code,
    c.course_name,
    c.department,
    c.difficulty_level,
    COUNT(DISTINCT e.student_id) AS total_students,
    AVG(ar.gpa) AS avg_gpa,
    AVG(ar.attendance_rate) AS avg_attendance,
    ROUND(AVG(g.score / g.max_score * 100), 2) AS avg_score_percentage,
    COUNT(CASE WHEN e.status = 'failed' THEN 1 END) AS failed_count,
    COUNT(CASE WHEN e.status = 'dropped' THEN 1 END) AS dropped_count
FROM courses c
LEFT JOIN enrollments e ON c.course_id = e.course_id
LEFT JOIN academic_records ar ON e.student_id = ar.student_id 
    AND e.academic_year = ar.academic_year 
    AND e.semester = ar.semester
LEFT JOIN grades g ON e.enrollment_id = g.enrollment_id
GROUP BY 
    c.course_id, c.course_code, c.course_name, 
    c.department, c.difficulty_level;

-- =============================================================================
-- SAMPLE DATA INSERTION (Optional - for testing)
-- =============================================================================

-- Insert sample ML model
INSERT INTO ml_models (model_name, model_version, algorithm, file_path, accuracy, precision_score, recall_score, f1_score, training_date, is_active)
VALUES ('Random Forest Classifier', 'v1.0', 'Random Forest', 'models/random_forest.joblib', 0.8750, 0.8650, 0.8820, 0.8730, CURRENT_TIMESTAMP, TRUE);

-- Insert sample admin user (password: admin123 - hashed with bcrypt)
INSERT INTO users (username, email, password_hash, role, full_name)
VALUES ('admin', 'admin@studentai.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5cOWOwN1Q8wOy', 'admin', 'System Administrator');

COMMENT ON TABLE students IS 'Core student demographic and enrollment information';
COMMENT ON TABLE academic_records IS 'Semester-wise academic performance metrics';
COMMENT ON TABLE predictions IS 'ML model predictions for student performance';
COMMENT ON TABLE interventions IS 'Recommended actions for at-risk students';
COMMENT ON TABLE ml_models IS 'Metadata for trained machine learning models';
