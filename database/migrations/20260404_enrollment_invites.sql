-- Migration: link users to students and add enrollment_invites
-- Safe to run multiple times (IF NOT EXISTS used where applicable)

-- 1) Ensure student link on users
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS student_id UUID REFERENCES students(student_id);

-- 2) Enrollment invites table
CREATE TABLE IF NOT EXISTS enrollment_invites (
    invite_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token_hash VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) NOT NULL,
    student_code VARCHAR(50),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role VARCHAR(50) DEFAULT 'student' CHECK (role = 'student'),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','accepted','cancelled','expired')),
    expires_at TIMESTAMP NOT NULL,
    created_by UUID REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    accepted_at TIMESTAMP,
    cancelled_at TIMESTAMP
);

-- 3) Backfill user -> student links by matching email (idempotent)
UPDATE users u
SET student_id = s.student_id
FROM students s
WHERE u.student_id IS NULL
  AND lower(u.email) = lower(s.email);
