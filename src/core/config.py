from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List, Optional
import os


class Settings(BaseSettings):
    # App Settings
    PROJECT_NAME: str = "AI Student Performance Predictor"
    APP_ENV: str = "development"
    DEBUG: bool = True
    SECRET_KEY: str = "your-secret-key-here"
    
    # Auth
    JWT_SECRET: str = "super-secret-jwt-key"
    JWT_ALGORITHM: str = "HS256"
    JWT_ISSUER: str = "ai-student-performance-predictor"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Database
    DATABASE_URL: Optional[str] = None
    
    # Fallback DB settings (if DATABASE_URL is not provided)
    DB_HOST: str = "localhost"
    DB_PORT: int = 5432
    DB_NAME: str = "student_performance_db"
    DB_USER: str = "postgres"
    DB_PASSWORD: str = "password"
    
    # CORS
    FRONTEND_URL: str = "http://localhost:5173"
    
    # Paths & Uploads
    MODEL_PATH: str = "models/random_forest.joblib"
    UPLOAD_DIR: str = "data/uploads/"
    MAX_UPLOAD_SIZE: int = 10485760
    
    # Admin Bootstrap
    ADMIN_USERNAME: str = "admin"
    ADMIN_EMAIL: str = "admin@studentai.com"
    ADMIN_PASSWORD: str = "admin123"
    ADMIN_FULL_NAME: str = "System Administrator"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @property
    def get_database_url(self) -> str:
        if self.DATABASE_URL:
            # Fix for Render/Neon if they provide 'postgres://' instead of 'postgresql://'
            if self.DATABASE_URL.startswith("postgres://"):
                return self.DATABASE_URL.replace("postgres://", "postgresql://", 1)
            return self.DATABASE_URL
        
        return f"postgresql://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"

    @property
    def cors_origins(self) -> List[str]:
        return [origin.strip() for origin in self.FRONTEND_URL.split(",") if origin.strip()]


settings = Settings()
