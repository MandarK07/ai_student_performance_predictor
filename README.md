# AI Student Performance Predictor

AI Student Performance Predictor is a full-stack academic analytics platform that helps educators identify students who may be at risk of poor academic performance. The project combines a React dashboard, a FastAPI backend, a PostgreSQL database, and a scikit-learn machine learning pipeline for single-student and batch prediction workflows.

## What the project does

- Predicts student performance from academic and behavioral signals such as attendance, study hours, GPA history, assignment scores, exam scores, participation, and late submissions
- Supports single prediction and CSV-based batch prediction
- Stores students, predictions, interventions, sessions, and audit logs in PostgreSQL
- Provides role-based authentication for admins, teachers, counselors, students, and parents
- Shows at-risk students, student profiles, and prediction history in the frontend dashboard

## Current implementation status

This README reflects the current codebase.

- Backend: FastAPI, SQLAlchemy, PostgreSQL, pandas, scikit-learn, joblib
- Frontend: React, TypeScript, Vite, Tailwind CSS, React Router, React Hook Form
- ML model currently used for inference: `RandomForestClassifier`
- Training script compares `LogisticRegression` and `RandomForestClassifier`, then saves the best model artifact

Notes:

- The current inference pipeline uses `models/random_forest.joblib`
- The current training script uses `data/processed/students_processed.csv`
- `GET /api/upload-history` and `GET /api/stats` are placeholder endpoints
- The backend exposes student CRUD APIs, but the frontend edit/delete actions are not fully wired yet

## Tech stack

### Backend

- Python
- FastAPI
- SQLAlchemy
- Pydantic
- Uvicorn
- Passlib + bcrypt
- python-jose

### Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- React Router
- React Hook Form
- Radix UI primitives

### Database

- PostgreSQL

### Machine learning and data

- pandas
- scikit-learn
- joblib

## High-level architecture

```text
React frontend
    ->
API wrapper with JWT access token / refresh token handling
    ->
FastAPI routers
    ->
Pydantic validation + role-based authorization
    ->
SQLAlchemy database session
    ->
preprocess_data()
    ->
saved ML model (Random Forest)
    ->
prediction + intervention persistence in PostgreSQL
    ->
JSON response back to frontend
```

## Core modules

### Backend API modules

- `src/api/auth.py`
  - login, signup, register, refresh, logout, logout-all, current-user profile
- `src/api/students.py`
  - student create/read/update/delete, search, performance view, profile view
- `src/api/predict.py`
  - single-student prediction, prediction history, at-risk student list
- `src/api/upload.py`
  - CSV batch upload and prediction

### Auth and security

- `src/auth/security.py`
  - password hashing, JWT creation, JWT decoding, refresh token hashing
- `src/auth/dependencies.py`
  - current-user resolution and role-based access control
- `src/auth/bootstrap.py`
  - default admin bootstrap on app startup

### Database layer

- `src/database/connection.py`
  - SQLAlchemy engine and session setup
- `src/database/models.py`
  - ORM models
- `src/database/crud.py`
  - database operations used by API routes
- `database/schema.sql`
  - PostgreSQL schema, indexes, triggers, and views

### Data and ML pipeline

- `src/scripts/generate_dataset.py`
  - synthetic dataset generation
- `src/scripts/ingest_data.py`
  - raw-to-processed data pipeline
- `src/features/preprocess.py`
  - cleaning, encoding, and feature engineering
- `src/models/train_model.py`
  - train/evaluate candidate models and save the best artifact

### Frontend

- `frontend/my-react-app/src/App.tsx`
  - app routes
- `frontend/my-react-app/src/context/AuthContext.tsx`
  - auth state management
- `frontend/my-react-app/src/api/*.ts`
  - frontend API integration
- `frontend/my-react-app/src/pages/*`
  - dashboard, predictor, results, upload, student profile, login, register
- `frontend/my-react-app/src/components/*`
  - layout, tables, forms, upload UI, and reusable components

## Database design

The project uses a normalized relational schema with the following main tables:

- `students`
- `parents`
- `academic_records`
- `courses`
- `enrollments`
- `grades`
- `ml_models`
- `predictions`
- `interventions`
- `users`
- `auth_sessions`
- `audit_log`
- `upload_history`

Key relationships:

- One student can have many academic records
- One student can have many predictions
- One prediction can have many interventions
- One user can have many auth sessions and audit log entries
- Enrollments connect students and courses
- Grades belong to enrollments

The SQL schema also includes:

- indexes for common lookup and reporting queries
- triggers for automatic `updated_at` maintenance
- reporting views such as `student_performance_summary` and `at_risk_students`

## ML workflow

### Input features

The current prediction flow uses features such as:

- gender
- age
- parent education
- attendance rate
- study hours
- previous GPA
- final grade
- assignment score average
- exam score average
- class participation
- late submissions
- semester GPA history

### Preprocessing

`src/features/preprocess.py` performs:

- duplicate removal
- numeric missing value filling using mean or median
- default filling for participation and late submissions
- one-hot encoding for categorical columns
- feature engineering such as `hours_per_gpa` and `grade_trend`

### Training

`src/models/train_model.py` currently:

- loads `data/processed/students_processed.csv`
- drops identifier columns
- creates a binary target using the median of `final_grade`
- splits the dataset into train and test sets
- imputes missing values
- trains Logistic Regression and Random Forest
- compares metrics such as accuracy, precision, recall, and ROC-AUC
- saves the best model to `models/`

### Inference

The API loads the saved model artifact, preprocesses incoming input, aligns feature columns with the training artifact, runs prediction, calculates confidence from `predict_proba()`, assigns a performance category and risk level, and stores the result in PostgreSQL.

## API overview

### System

- `GET /`
- `GET /health`
- `GET /api/stats`

### Authentication

- `POST /api/auth/register`
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `POST /api/auth/logout-all`
- `GET /api/auth/me`

### Students

- `POST /api/students`
- `GET /api/students`
- `GET /api/students/search`
- `GET /api/students/{student_code}`
- `GET /api/students/{student_code}/performance`
- `GET /api/students/{student_code}/profile`
- `PUT /api/students/{student_code}`
- `DELETE /api/students/{student_code}`

### Predictions

- `POST /api/predict`
- `GET /api/predictions/{student_code}`
- `GET /api/at-risk-students`

### Uploads

- `POST /api/upload-csv`
- `GET /api/upload-history`

## Project structure

```text
ai_student_performance_predictor/
|-- data/
|   |-- raw/
|   `-- processed/
|-- database/
|   |-- schema.sql
|   `-- queries.sql
|-- frontend/
|   `-- my-react-app/
|-- models/
|   |-- logistic_regression.joblib
|   `-- random_forest.joblib
|-- src/
|   |-- api/
|   |-- auth/
|   |-- data/
|   |-- database/
|   |-- features/
|   |-- models/
|   `-- scripts/
|-- .env.example
|-- requirements.txt
`-- README.md
```

## Local setup

### 1. Clone the repository

```powershell
git clone <your-repo-url>
cd ai_student_performance_predictor
```

### 2. Create and activate a Python virtual environment

```powershell
python -m venv venv
.\venv\Scripts\activate
```

### 3. Install backend dependencies

```powershell
pip install -r requirements.txt
```

### 4. Configure environment variables

Create a `.env` file based on `.env.example`.

Minimum values to configure:

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/student_performance_db
FRONTEND_URL=http://localhost:5173
MODEL_PATH=models/random_forest.joblib
JWT_SECRET=change-me-in-production
ADMIN_USERNAME=admin
ADMIN_EMAIL=admin@studentai.com
ADMIN_PASSWORD=admin123
```

Useful auth-related environment variables supported by the code:

```env
JWT_ALGORITHM=HS256
JWT_ISSUER=ai-student-performance-predictor
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7
MAX_FAILED_LOGIN_ATTEMPTS=5
ACCOUNT_LOCK_MINUTES=15
```

### 5. Create PostgreSQL database and apply schema

Create a PostgreSQL database named `student_performance_db`, then run:

```powershell
psql -U postgres -d student_performance_db -f database/schema.sql
```

### 6. Start the backend

```powershell
python -m uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

Backend URLs:

- API root: `http://localhost:8000`
- Swagger docs: `http://localhost:8000/docs`
- Redoc docs: `http://localhost:8000/redoc`

### 7. Start the frontend

```powershell
cd frontend/my-react-app
npm install
npm run dev
```

Frontend URL:

- `http://localhost:5173`

## Data and model generation workflow

If you want to regenerate the dataset and retrain the model:

### 1. Generate synthetic data

```powershell
python src/scripts/generate_dataset.py
```

### 2. Create processed dataset

```powershell
python src/scripts/ingest_data.py
```

### 3. Train and save the best model

```powershell
python src/models/train_model.py
```

## Authentication and authorization

The project includes:

- password hashing with bcrypt
- JWT access tokens
- JWT refresh tokens
- refresh token rotation
- persistent auth sessions in PostgreSQL
- account lockout after repeated failed login attempts
- audit logging for auth and role-based access events

Default admin creation happens during startup if the configured admin user does not already exist.

## Frontend features

- landing page
- login and signup
- protected dashboard layout
- student management table
- single-student prediction form
- prediction result page
- CSV upload with result/error summary
- student profile page with academic metrics and recommendation feed
- at-risk students page

## Known gaps / next improvements

- align training metrics automatically with `ml_models` table instead of hardcoded metadata fallback
- implement frontend create/edit/delete flows for students and interventions
- complete upload history persistence and `/api/upload-history`
- replace the current classification-to-GPA mapping with a cleaner production ML objective
- add automated tests for backend and frontend
- add deployment assets such as Docker and CI/CD workflows if needed

