import joblib
import pandas as pd
from pathlib import Path


MODEL_PATH = Path(__file__).parent / "nexvo_xgboost.pkl"

model = joblib.load(MODEL_PATH)


def predict_candidate_score(candidate_data: dict) -> float:
    """
    Predict candidate quality score using the trained XGBoost model.

    The preprocessing here matches the original predict.py:
    - Convert input to DataFrame
    - Remove candidate_id
    - One-hot encode categorical columns
    - Align columns with the trained model
    """

    df = pd.DataFrame([candidate_data])

    # candidate_id was not used during model training
    df = df.drop(columns=["candidate_id"], errors="ignore")

    # Same preprocessing used during training/prediction
    df = pd.get_dummies(df)

    # Ensure the input columns exactly match the trained model
    df = df.reindex(
        columns=model.feature_names_in_,
        fill_value=0
    )

    prediction = model.predict(df)[0]

    return round(float(prediction), 2)