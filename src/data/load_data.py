import pandas as pd
from pathlib import Path

BASE_DIR = Path(__file__).parents[2]

RAW_DATA_PATH = BASE_DIR / "data" / "raw" / "students.csv"
PROCESSED_DATA_PATH = BASE_DIR / "data" / "processed" / "students_processed.csv"

def load_raw_data(path: Path = RAW_DATA_PATH) -> pd.DataFrame:
    """Load raw CSV into a DataFrame."""
    return pd.read_csv(path)

def save_processed_data(df: pd.DataFrame, path: Path = PROCESSED_DATA_PATH):
    """Save cleaned DataFrame to CSV."""
    path.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(path, index=False)

if __name__ == "__main__":
    df = load_raw_data()
    print("Raw data preview:")
    print(df.head())