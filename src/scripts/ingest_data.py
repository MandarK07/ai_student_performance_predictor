import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

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