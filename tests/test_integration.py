"""Pruebas de integración: CSV -> limpieza -> split -> SMOTE -> RF -> scoring.

Ejecutar desde la raíz: python -m pytest tests/test_integration.py -v
La prueba con telecom_dirty.csv se omite si el archivo no está disponible.
"""
from pathlib import Path

import numpy as np
import pandas as pd
import pytest

from src.data_loader import load_dataset
from src.cleaning import clean_telecom_data
from src.pipeline import FEATURES, prepare_data
from src.model import train_model, predict_churn, evaluate_model

ROOT = Path(__file__).resolve().parents[1]
DATASET = ROOT / "data" / "telecom_dirty.csv"


def _run_flow(csv_path: Path):
    original = load_dataset(csv_path)
    cleaned = clean_telecom_data(original)
    prepared = prepare_data(cleaned)
    model = train_model(prepared)
    predictions = predict_churn(model, prepared.X_test)
    metrics = evaluate_model(model, prepared)
    return original, cleaned, prepared, predictions, metrics


def _check_results(cleaned, prepared, predictions, metrics):
    assert cleaned.duplicated().sum() == 0
    assert cleaned[FEATURES + ["Churn"]].notna().all().all()
    assert set(cleaned["Churn"].unique()) <= {0, 1}

    # El test nunca debe haber sido balanceado mediante SMOTE.
    assert len(prepared.X_train) + len(prepared.X_test) == len(cleaned)
    assert len(prepared.X_train_smote) >= len(prepared.X_train)
    assert len(prepared.X_train_smote) == len(prepared.y_train_smote)
    assert prepared.y_train_smote.value_counts().nunique() == 1
    assert prepared.X_train.index.intersection(prepared.X_test.index).empty

    assert len(predictions) == len(prepared.X_test)
    assert predictions.index.equals(prepared.X_test.index)
    assert predictions["prediction"].isin([0, 1]).all()
    probabilities = predictions["churn_probability"]
    assert np.isfinite(probabilities.to_numpy()).all()
    assert probabilities.between(0, 1).all()
    assert set(metrics) == {"accuracy", "precision", "recall", "f1", "roc_auc"}
    assert all(np.isfinite(value) and 0 <= value <= 1 for value in metrics.values())


def test_pi01_integracion_dataset_sintetico(tmp_path):
    """Prueba reproducible sin el dataset completo del usuario."""
    rng = np.random.default_rng(42)
    n = 160
    churn = np.array([0] * 120 + [1] * 40)
    rng.shuffle(churn)
    synthetic = pd.DataFrame({
        "RegistrationDate": ["2024-01-01"] * n,
        "AccountWeeks": rng.integers(20, 150, size=n),
        "Churn": np.where(churn == 1, "Yes", "No"),
        "ContractRenewal": np.where(rng.integers(0, 2, n), "Yes", "No"),
        "DataPlan": np.where(rng.integers(0, 2, n), "Yes", "No"),
        "DataUsage": rng.uniform(1, 8, size=n),
        "CustServCalls": rng.integers(0, 7, size=n),
        "DayMins": rng.uniform(50, 300, size=n),
        "DayCalls": rng.integers(40, 140, size=n),
        "MonthlyCharge": rng.uniform(20, 100, size=n),
        "OverageFee": rng.uniform(0, 20, size=n),
        "RoamMins": rng.uniform(0, 20, size=n),
    })
    # Caso controlado: dos duplicados exactos.
    synthetic = pd.concat([synthetic, synthetic.iloc[[0, 1]]], ignore_index=True)
    csv_path = tmp_path / "telecom_test.csv"
    synthetic.to_csv(csv_path, index=False)

    original, cleaned, prepared, predictions, metrics = _run_flow(csv_path)
    assert len(original) == 162
    assert len(cleaned) == 160
    assert len(prepared.X_train) == 128
    assert len(prepared.X_test) == 32
    _check_results(cleaned, prepared, predictions, metrics)


def test_pi02_integracion_dataset_original():
    """Verifica el dataset original usado en el Colab (si está disponible)."""
    if not DATASET.is_file():
        pytest.skip(f"Colocá telecom_dirty.csv en {DATASET} para ejecutar PI-02")

    original, cleaned, prepared, predictions, metrics = _run_flow(DATASET)
    assert original.shape == (12150, 12)
    assert cleaned.shape == (12000, 13)
    assert len(prepared.X_train) == 9600
    assert len(prepared.X_test) == 2400
    _check_results(cleaned, prepared, predictions, metrics)
    print("\nPI-02 - Métricas del modelo:", {k: round(v, 4) for k, v in metrics.items()})
