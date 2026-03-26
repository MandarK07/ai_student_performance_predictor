import sys
from pathlib import Path

# Ensure project root is on sys.path so `src` package is importable when running directly
PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from src.data.load_data import load_raw_data, save_processed_data
from src.features.preprocess import preprocess_data

def main():
    # Load raw data
    df_raw = load_raw_data()
    
    # Preprocess
    df_clean = preprocess_data(df_raw)
    
    # Save processed dataset
    save_processed_data(df_clean)
    print("Processed data saved to data/processed/students_processed.csv")

if __name__ == "__main__":
    main()
