import sys
import os

# Add the project root to sys.path
sys.path.append(os.getcwd())

from src.core.config import settings
from src.database.connection import test_connection, DATABASE_URL

print("--- Environment Verification ---")
print(f"Project Name: {settings.PROJECT_NAME}")
print(f"App Environment: {settings.APP_ENV}")
print(f"Database URL (masked): {DATABASE_URL.split('@')[-1]}")

if test_connection():
    print("\nSUCCESS: Connected to the database defined in your current environment.")
    if "neon.tech" in DATABASE_URL:
        print("WARNING: You are STILL CONNECTED to Neon (Cloud). Check your .env file.")
    else:
        print("PROPERLY CONFIGURED: Using local PostgreSQL.")
else:
    print("\nFAILED: Could not connect to the database. Check your local Postgres service.")
