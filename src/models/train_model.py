import pandas as pd
from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    roc_auc_score,
    classification_report,
)
import joblib
from sklearn.impute import SimpleImputer

# ─── Paths ──────────────────────────────────────────────────────────────────────
BASE_DIR           = Path(__file__).parents[2]
PROCESSED_DATA_PATH = BASE_DIR / "data" / "processed" / "students_processed.csv"
MODEL_DIR          = BASE_DIR / "models"
MODEL_DIR.mkdir(exist_ok=True)

# ─── Load Data ─────────────────────────────────────────────────────────────────
df = pd.read_csv(PROCESSED_DATA_PATH)
df.columns = df.columns.str.strip()  # <-- Add this line to strip whitespace

# Debug: print column names to verify
print(df.columns.tolist())

# Drop identifier and keep raw final_grade
# ids = df.pop("student_code")
drop_cols = ["student_code", "first_name", "last_name", "email", "enrollment_date"]
df = df.drop(columns=[c for c in drop_cols if c in df.columns])

if "final_grade" in df.columns:
    y_raw = df.pop("final_grade")
else:
    print("Column 'final_grade' not found.")
    exit(1)  # Stop execution if target column is missing

# ─── Binary Target ──────────────────────────────────────────────────────────────
# Students scoring >= median are labeled 1, others 0
threshold = y_raw.median()
y = (y_raw >= threshold).astype(int)



# One-hot encode gender
if "gender" in df.columns:
    df["gender"] = df["gender"].fillna("Unknown").astype(str).str.capitalize()
    df = pd.get_dummies(df, columns=["gender"], prefix="gender")

# One-hot encode parent_education
if "parent_education" in df.columns:
    df = pd.get_dummies(df, columns=["parent_education"], prefix="edu")
    
    # Features
X = df  # all remaining columns

# ─── Train/Test Split ──────────────────────────────────────────────────────────
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, stratify=y, random_state=42
)

# Drop columns with all missing values in training set
X_train = X_train.dropna(axis=1, how='all')
X_test = X_test[X_train.columns]  # Ensure same columns in test set

# Impute remaining missing values
imputer = SimpleImputer(strategy="most_frequent")
X_train = pd.DataFrame(imputer.fit_transform(X_train), columns=X_train.columns)
X_test  = pd.DataFrame(imputer.transform(X_test), columns=X_train.columns)

# ─── Model Definitions ──────────────────────────────────────────────────────────
models = {
    "logistic_regression": LogisticRegression(solver="liblinear", random_state=42),
    "random_forest": RandomForestClassifier(
        n_estimators=100, max_depth=5, random_state=42
    ),
}

# ─── Training & Evaluation ──────────────────────────────────────────────────────
results = {}
for name, model in models.items():
    model.fit(X_train, y_train)
    preds = model.predict(X_test)
    probs = model.predict_proba(X_test)[:, 1]

    acc  = accuracy_score(y_test, preds)
    prec = precision_score(y_test, preds)
    rec  = recall_score(y_test, preds)
    auc  = roc_auc_score(y_test, probs)

    results[name] = {"accuracy": acc, "precision": prec, "recall": rec, "roc_auc": auc}

    print(f"\nModel: {name}")
    print(f"  Accuracy : {acc:.3f}")
    print(f"  Precision: {prec:.3f}")
    print(f"  Recall   : {rec:.3f}")
    print(f"  ROC-AUC  : {auc:.3f}")
    print("\n" + classification_report(y_test, preds))

# ─── Select Best Model ──────────────────────────────────────────────────────────
best_model_name = max(results, key=lambda n: results[n]["roc_auc"])
best_model      = models[best_model_name]

# ─── Save Artifacts ─────────────────────────────────────────────────────────────
model_path = MODEL_DIR / f"{best_model_name}.joblib"
joblib.dump({
    "model": best_model,
    "threshold": threshold,
    "feature_columns": X.columns.to_list()
}, model_path)

print(f"\n✔ Saved best model ({best_model_name}) to {model_path}")