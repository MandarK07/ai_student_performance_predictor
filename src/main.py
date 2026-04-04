
"""Main FastAPI application with database integration"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
import os
from contextlib import asynccontextmanager

from src.api.predict import router as predict_router
from src.api.upload import router as upload_router
from src.api.students import router as students_router
from src.api.auth import router as auth_router
from src.api.admin import router as admin_router
from src.api.dashboard import router as dashboard_router
from src.api.enrollments import router as enrollments_router
from src.auth.bootstrap import ensure_admin_user
from src.database.connection import test_connection


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown events"""
    # Startup
    print("Starting AI Student Performance Predictor...")
    
    # Test database connection
    if test_connection():
        print("Database connection successful")
        ensure_admin_user()
    else:
        print("Database connection failed - some features may not work")
    
    # Create upload directory if it doesn't exist
    os.makedirs("data/uploads", exist_ok=True)
    
    yield
    
    # Shutdown
    print("Shutting down...")


app = FastAPI(
    title="AI Student Performance Predictor",
    description="Machine learning-powered student performance prediction system",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(predict_router, prefix="/api", tags=["Predictions"])
app.include_router(upload_router, prefix="/api", tags=["Data Upload"])
app.include_router(students_router, prefix="/api", tags=["Students"])
app.include_router(auth_router, prefix="/api", tags=["Authentication"])
app.include_router(admin_router, prefix="/api", tags=["Admin"])
app.include_router(dashboard_router, prefix="/api", tags=["Dashboard"])
app.include_router(enrollments_router, prefix="/api", tags=["Enrollments"])


@app.get("/", response_class=HTMLResponse)
def home():
    """Home page with API information"""
    return """
    <!DOCTYPE html>
    <html>
        <head>
            <title>Student Performance Predictor API</title>
            <style>
                body {
                    font-family: 'Segoe UI', Arial, sans-serif;
                    text-align: center;
                    margin: 50px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                }
                .container {
                    background: rgba(255,255,255,0.1);
                    padding: 40px;
                    border-radius: 20px;
                    backdrop-filter: blur(10px);
                    max-width: 800px;
                    margin: 0 auto;
                }
                h1 { font-size: 3rem; margin-bottom: 20px; }
                p { font-size: 1.2rem; margin: 20px 0; }
                a {
                    display: inline-block;
                    margin: 10px;
                    padding: 15px 30px;
                    background: white;
                    color: #667eea;
                    text-decoration: none;
                    border-radius: 10px;
                    font-weight: bold;
                    transition: transform 0.2s;
                }
                a:hover { transform: translateY(-3px); }
                .features {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 20px;
                    margin-top: 40px;
                }
                .feature {
                    background: rgba(255,255,255,0.15);
                    padding: 20px;
                    border-radius: 10px;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Student Performance Predictor</h1>
                <p>AI-powered analytics for academic success forecasting</p>
                
                <div>
                    <a href="/docs">📚 API Documentation</a>
                    <a href="http://localhost:5173" target="_blank">🎯 Open Dashboard</a>
                </div>
                
                <div class="features">
                    <div class="feature">
                        <h3>🤖 ML Predictions</h3>
                        <p>Advanced Random Forest models</p>
                    </div>
                    <div class="feature">
                        <h3>💾 Database</h3>
                        <p>PostgreSQL with full tracking</p>
                    </div>
                    <div class="feature">
                        <h3>📊 Batch Upload</h3>
                        <p>CSV bulk processing</p>
                    </div>
                    <div class="feature">
                        <h3>⚠️ Risk Detection</h3>
                        <p>Early intervention alerts</p>
                    </div>
                </div>
            </div>
        </body>
    </html>
    """


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    db_status = "connected" if test_connection() else "disconnected"
    return {
        "status": "healthy",
        "database": db_status,
        "version": "1.0.0"
    }


@app.get("/api/stats")
async def get_statistics():
    """Get system statistics"""
    # This would connect to database and return real stats
    return {
        "message": "Statistics endpoint",
        "note": "Connect to database to see real-time stats"
    }


if __name__ == "__main__":
    import uvicorn
    from src.main import app   # explicit import of the FastAPI app
    uvicorn.run(app, host="localhost", port=8000, reload=True)


# python -m uvicorn src.main:app --reload --host 0.0.0.0 --port 8000

