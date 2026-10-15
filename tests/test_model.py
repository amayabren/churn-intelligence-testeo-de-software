"""CF-03: cantidad, clase y rango de las predicciones."""
import numpy as np
import pandas as pd
import pytest
from src.pipeline import FEATURES, prepare_data
from src.model import train_model, predict_churn, evaluate_model


@pytest.fixture(scope="module")
def trained():
    rng = np.random.default_rng(42)
    n = 100
    df = pd.DataFrame({name: rng.uniform(1, 20, n) for name in FEATURES})
    df["Churn"] = [0] * 80 + [1] * 20
    prepared = prepare_data(df)
    model = train_model(prepared)
    return model, prepared


def test_cf03_una_prediccion_por_registro(trained):
    model, data = trained
    result = predict_churn(model, data.X_test)
    assert len(result) == len(data.X_test)
    assert result.index.equals(data.X_test.index)


def test_cf03_probabilidades_validas(trained):
    model, data = trained
    result = predict_churn(model, data.X_test)
    assert result["churn_probability"].between(0, 1).all()
    assert result["prediction"].isin([0, 1]).all()


def test_metricas_validas(trained):
    model, data = trained
    metrics = evaluate_model(model, data)
    assert set(metrics) == {"accuracy", "precision", "recall", "f1", "roc_auc"}
    assert all(0 <= value <= 1 for value in metrics.values())
