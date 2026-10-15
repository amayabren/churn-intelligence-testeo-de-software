"""Random Forest + SMOTE: modelo seleccionado en Ciencia de Datos."""
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score, roc_auc_score
)

from .pipeline import PreparedData


def train_model(data: PreparedData) -> RandomForestClassifier:
    """Entrena con datos de entrenamiento previamente balanceados con SMOTE."""
    model = RandomForestClassifier(
        n_estimators=100, random_state=42, n_jobs=-1
    )
    model.fit(data.X_train_smote, data.y_train_smote)
    return model


def predict_churn(model: RandomForestClassifier, X: pd.DataFrame) -> pd.DataFrame:
    """Devuelve una clase y una probabilidad de Churn por fila de X."""
    predictions = model.predict(X)
    probabilities = model.predict_proba(X)[:, list(model.classes_).index(1)]
    if not np.isfinite(probabilities).all():
        raise ValueError("El modelo devolvió probabilidades no finitas")
    return pd.DataFrame(
        {"prediction": predictions, "churn_probability": probabilities},
        index=X.index,
    )


def evaluate_model(model: RandomForestClassifier, data: PreparedData) -> dict:
    """Calcula métricas en test sin balancear, como en el Colab."""
    result = predict_churn(model, data.X_test)
    y_pred = result["prediction"]
    y_prob = result["churn_probability"]
    return {
        "accuracy": accuracy_score(data.y_test, y_pred),
        "precision": precision_score(data.y_test, y_pred, zero_division=0),
        "recall": recall_score(data.y_test, y_pred, zero_division=0),
        "f1": f1_score(data.y_test, y_pred, zero_division=0),
        "roc_auc": roc_auc_score(data.y_test, y_prob),
    }
