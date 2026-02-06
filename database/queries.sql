-- Common SQL Queries for AI Student Performance Predictor
-- Use these queries for typical operations in the application

-- =============================================================================
-- STUDENT QUERIES
-- =============================================================================

-- 1. Get all active students with their latest academic records
SELECT 
    s.student_id,
    s.student_code,
    s.first_name,
    s.last_name,
    s.email,
    s.gender,
    ar.academic_year,
    ar.semester,
    ar.gpa,
    ar.attendance_rate,
    ar.study_hours_per_week
FROM students s
LEFT JOIN academic_records ar ON s.student_id = ar.student_id
WHERE s.status = 'active'
ORDER BY ar.academic_year DESC, ar.semester DESC;

-- 2. Get student profile with parent information
SELECT 
    s.student_id,
    s.student_code,
    s.first_name || ' ' || s.last_name AS full_name,
    s.email,
    s.date_of_birth,
    s.gender,
    s.enrollment_date,
    p.name AS parent_name,
    p.relationship,
    p.education_level AS parent_education,
    p.phone AS parent_phone
FROM students s
LEFT JOIN parents p ON s.student_id = p.student_id AND p.is_primary_contact = TRUE
WHERE s.student_code = 'S2024001'; -- Replace with actual student code

-- 3. Search students by name or email
SELECT 
    student_id,
    student_code,
    first_name,
    last_name,
    email,
    status
FROM students
WHERE 
    LOWER(first_name || ' ' || last_name) LIKE LOWER('%john%')
    OR LOWER(email) LIKE LOWER('%john%')
ORDER BY last_name, first_name;

-- =============================================================================
-- ACADEMIC PERFORMANCE QUERIES
-- =============================================================================

-- 4. Get student's complete academic history
SELECT 
    ar.academic_year,
    ar.semester,
    ar.gpa,
    ar.attendance_rate,
    ar.study_hours_per_week,
    ar.class_participation_score,
    ar.late_submissions,
    ar.absences,
    COUNT(e.enrollment_id) AS total_courses
FROM academic_records ar
LEFT JOIN enrollments e ON ar.student_id = e.student_id 
    AND ar.academic_year = e.academic_year 
    AND ar.semester = e.semester
WHERE ar.student_id = 'uuid-here' -- Replace with actual UUID
GROUP BY ar.academic_year, ar.semester, ar.gpa, ar.attendance_rate, 
         ar.study_hours_per_week, ar.class_participation_score, 
         ar.late_submissions, ar.absences
ORDER BY ar.academic_year DESC, ar.semester DESC;

-- 5. Get top performing students in current semester
SELECT 
    s.student_code,
    s.first_name || ' ' || s.last_name AS full_name,
    ar.gpa,
    ar.attendance_rate,
    ar.class_participation_score
FROM students s
JOIN academic_records ar ON s.student_id = ar.student_id
WHERE ar.academic_year = '2023-2024'
    AND ar.semester = 'Fall'
    AND s.status = 'active'
ORDER BY ar.gpa DESC, ar.attendance_rate DESC
LIMIT 10;

-- 6. Calculate average scores per assessment type for a student
SELECT 
    g.assessment_type,
    COUNT(*) AS total_assessments,
    ROUND(AVG(g.score / g.max_score * 100), 2) AS avg_percentage,
    SUM(CASE WHEN g.is_late THEN 1 ELSE 0 END) AS late_submissions
FROM grades g
JOIN enrollments e ON g.enrollment_id = e.enrollment_id
WHERE e.student_id = 'uuid-here' -- Replace with actual UUID
    AND e.academic_year = '2023-2024'
    AND e.semester = 'Fall'
GROUP BY g.assessment_type
ORDER BY g.assessment_type;

-- =============================================================================
-- PREDICTION QUERIES
-- =============================================================================

-- 7. Get latest prediction for a student
SELECT 
    p.prediction_id,
    p.predicted_gpa,
    p.predicted_performance_category,
    p.confidence_score,
    p.risk_level,
    p.recommendation,
    p.prediction_date,
    m.model_name,
    m.model_version
FROM predictions p
JOIN ml_models m ON p.model_id = m.model_id
WHERE p.student_id = 'uuid-here' -- Replace with actual UUID
ORDER BY p.prediction_date DESC
LIMIT 1;

-- 8. Get all predictions for analysis (with actual vs predicted comparison)
SELECT 
    s.student_code,
    s.first_name || ' ' || s.last_name AS full_name,
    p.academic_year,
    p.semester,
    p.predicted_gpa,
    p.actual_gpa,
    p.predicted_gpa - p.actual_gpa AS prediction_error,
    p.confidence_score,
    p.risk_level,
    p.is_accurate
FROM predictions p
JOIN students s ON p.student_id = s.student_id
WHERE p.actual_gpa IS NOT NULL
ORDER BY p.prediction_date DESC;

-- 9. Get prediction accuracy metrics for a model
SELECT 
    m.model_name,
    m.model_version,
    COUNT(*) AS total_predictions,
    COUNT(CASE WHEN p.is_accurate THEN 1 END) AS accurate_predictions,
    ROUND(COUNT(CASE WHEN p.is_accurate THEN 1 END)::DECIMAL / COUNT(*) * 100, 2) AS accuracy_percentage,
    AVG(ABS(p.predicted_gpa - p.actual_gpa)) AS avg_absolute_error
FROM predictions p
JOIN ml_models m ON p.model_id = m.model_id
WHERE p.actual_gpa IS NOT NULL
GROUP BY m.model_name, m.model_version;

-- =============================================================================
-- AT-RISK STUDENT QUERIES
-- =============================================================================

-- 10. Get all at-risk students with interventions
SELECT 
    s.student_code,
    s.first_name || ' ' || s.last_name AS full_name,
    s.email,
    p.predicted_gpa,
    p.risk_level,
    p.confidence_score,
    COUNT(i.intervention_id) AS active_interventions,
    STRING_AGG(DISTINCT i.intervention_type, ', ') AS intervention_types
FROM students s
JOIN predictions p ON s.student_id = p.student_id
LEFT JOIN interventions i ON p.prediction_id = i.prediction_id 
    AND i.status IN ('pending', 'in_progress')
WHERE p.risk_level IN ('High', 'Critical')
    AND s.status = 'active'
GROUP BY s.student_code, s.first_name, s.last_name, s.email, 
         p.predicted_gpa, p.risk_level, p.confidence_score
ORDER BY p.risk_level DESC, p.predicted_gpa ASC;

-- 11. Get students with low attendance (below 75%)
SELECT 
    s.student_code,
    s.first_name || ' ' || s.last_name AS full_name,
    s.email,
    ar.attendance_rate,
    ar.absences,
    ar.gpa
FROM students s
JOIN academic_records ar ON s.student_id = ar.student_id
WHERE ar.attendance_rate < 75
    AND s.status = 'active'
    AND ar.academic_year = '2023-2024'
    AND ar.semester = 'Fall'
ORDER BY ar.attendance_rate ASC;

-- =============================================================================
-- COURSE & ENROLLMENT QUERIES
-- =============================================================================

-- 12. Get student's current enrollments with grades
SELECT 
    c.course_code,
    c.course_name,
    c.credits,
    e.status AS enrollment_status,
    ROUND(AVG(g.score / g.max_score * 100), 2) AS current_average
FROM enrollments e
JOIN courses c ON e.course_id = c.course_id
LEFT JOIN grades g ON e.enrollment_id = g.enrollment_id
WHERE e.student_id = 'uuid-here' -- Replace with actual UUID
    AND e.academic_year = '2023-2024'
    AND e.semester = 'Fall'
GROUP BY c.course_code, c.course_name, c.credits, e.status
ORDER BY c.course_code;

-- 13. Get course enrollment statistics
SELECT 
    c.course_code,
    c.course_name,
    c.department,
    COUNT(DISTINCT e.student_id) AS enrolled_students,
    COUNT(CASE WHEN e.status = 'completed' THEN 1 END) AS completed,
    COUNT(CASE WHEN e.status = 'failed' THEN 1 END) AS failed,
    COUNT(CASE WHEN e.status = 'dropped' THEN 1 END) AS dropped
FROM courses c
LEFT JOIN enrollments e ON c.course_id = e.course_id
WHERE e.academic_year = '2023-2024' AND e.semester = 'Fall'
GROUP BY c.course_code, c.course_name, c.department
ORDER BY enrolled_students DESC;

-- =============================================================================
-- INTERVENTION QUERIES
-- =============================================================================

-- 14. Get pending interventions for review
SELECT 
    i.intervention_id,
    s.student_code,
    s.first_name || ' ' || s.last_name AS student_name,
    i.intervention_type,
    i.priority,
    i.description,
    i.assigned_to,
    i.due_date,
    p.risk_level
FROM interventions i
JOIN predictions p ON i.prediction_id = p.prediction_id
JOIN students s ON p.student_id = s.student_id
WHERE i.status = 'pending'
ORDER BY 
    CASE i.priority 
        WHEN 'Urgent' THEN 1
        WHEN 'High' THEN 2
        WHEN 'Medium' THEN 3
        ELSE 4
    END,
    i.due_date ASC;

-- 15. Get intervention effectiveness report
SELECT 
    i.intervention_type,
    COUNT(*) AS total_interventions,
    COUNT(CASE WHEN i.status = 'completed' THEN 1 END) AS completed,
    AVG(CASE 
        WHEN i.status = 'completed' 
        THEN EXTRACT(EPOCH FROM (i.completed_date - i.created_at)) / 86400 
    END) AS avg_days_to_complete
FROM interventions i
GROUP BY i.intervention_type
ORDER BY total_interventions DESC;

-- =============================================================================
-- ANALYTICS & REPORTING QUERIES
-- =============================================================================

-- 16. Get semester performance trends
SELECT 
    ar.academic_year,
    ar.semester,
    COUNT(DISTINCT ar.student_id) AS total_students,
    ROUND(AVG(ar.gpa), 2) AS avg_gpa,
    ROUND(AVG(ar.attendance_rate), 2) AS avg_attendance,
    ROUND(AVG(ar.study_hours_per_week), 2) AS avg_study_hours,
    COUNT(CASE WHEN ar.gpa >= 3.5 THEN 1 END) AS high_performers,
    COUNT(CASE WHEN ar.gpa < 2.0 THEN 1 END) AS low_performers
FROM academic_records ar
GROUP BY ar.academic_year, ar.semester
ORDER BY ar.academic_year DESC, ar.semester DESC;

-- 17. Parent education impact on student performance
SELECT 
    p.education_level AS parent_education,
    COUNT(DISTINCT s.student_id) AS student_count,
    ROUND(AVG(ar.gpa), 2) AS avg_gpa,
    ROUND(AVG(ar.attendance_rate), 2) AS avg_attendance,
    ROUND(AVG(ar.study_hours_per_week), 2) AS avg_study_hours
FROM students s
JOIN parents p ON s.student_id = p.student_id AND p.is_primary_contact = TRUE
LEFT JOIN academic_records ar ON s.student_id = ar.student_id
WHERE ar.academic_year = '2023-2024'
GROUP BY p.education_level
ORDER BY avg_gpa DESC;

-- 18. Department performance overview
SELECT 
    c.department,
    COUNT(DISTINCT c.course_id) AS total_courses,
    COUNT(DISTINCT e.student_id) AS total_students,
    ROUND(AVG(g.score / g.max_score * 100), 2) AS avg_score_percentage,
    COUNT(CASE WHEN e.status = 'failed' THEN 1 END) AS total_failures
FROM courses c
LEFT JOIN enrollments e ON c.course_id = e.course_id
LEFT JOIN grades g ON e.enrollment_id = g.enrollment_id
WHERE e.academic_year = '2023-2024'
GROUP BY c.department
ORDER BY c.department;

-- =============================================================================
-- DATA MANAGEMENT QUERIES
-- =============================================================================

-- 19. Bulk insert students (template for CSV upload)
INSERT INTO students (student_code, first_name, last_name, email, date_of_birth, gender, enrollment_date)
VALUES 
    ('S2024001', 'John', 'Doe', 'john.doe@student.edu', '2005-03-15', 'Male', '2024-09-01'),
    ('S2024002', 'Jane', 'Smith', 'jane.smith@student.edu', '2005-07-22', 'Female', '2024-09-01')
ON CONFLICT (student_code) DO NOTHING;

-- 20. Update academic records for a semester
INSERT INTO academic_records (
    student_id, academic_year, semester, gpa, attendance_rate, 
    study_hours_per_week, class_participation_score, late_submissions, absences
)
VALUES (
    'uuid-here', '2023-2024', 'Fall', 3.45, 88.5, 
    15.0, 7.5, 2, 4
)
ON CONFLICT (student_id, academic_year, semester) 
DO UPDATE SET
    gpa = EXCLUDED.gpa,
    attendance_rate = EXCLUDED.attendance_rate,
    study_hours_per_week = EXCLUDED.study_hours_per_week,
    class_participation_score = EXCLUDED.class_participation_score,
    late_submissions = EXCLUDED.late_submissions,
    absences = EXCLUDED.absences,
    updated_at = CURRENT_TIMESTAMP;

-- 21. Delete old audit logs (data retention policy)
DELETE FROM audit_log 
WHERE created_at < CURRENT_DATE - INTERVAL '2 years';

-- =============================================================================
-- PERFORMANCE MONITORING QUERIES
-- =============================================================================

-- 22. Check database table sizes
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- 23. Find slow queries (requires pg_stat_statements extension)
-- CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    max_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
