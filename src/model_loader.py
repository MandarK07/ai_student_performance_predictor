"""Helpers for loading the trained prediction model from environment-aware paths."""
import os
from pathlib import Path
from typing import Any

from dotenv import load_dotenv
import joblib


load_dotenv()

PROJECT_ROOT = Path(__file__).resolve().parent.parent
MODEL_PATH = os.getenv("MODEL_PATH", "models/random_forest.joblib")


def get_model_path() -> str:
    model_path = Path(MODEL_PATH)
    if not model_path.is_absolute():
        model_path = PROJECT_ROOT / model_path
    return str(model_path)


def load_prediction_artifacts() -> tuple[Any | None, list[str]]:
    resolved_model_path = get_model_path()
    try:
        model_bundle = joblib.load(resolved_model_path)
        return model_bundle["model"], model_bundle["feature_columns"]
    except Exception as exc:
        print(f"Failed to load model bundle from {resolved_model_path}: {exc}")
        return None, []
