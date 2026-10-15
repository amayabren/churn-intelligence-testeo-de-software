"""Pruebas de preparación de datos y SMOTE (sin tocar el dataset original)."""
import numpy as np
import pandas as pd
import pytest
from src.pipeline import FEATURES, prepare_data


@pytest.fixture
def clean_sample():
    rng = np.random.default_rng(42)
    n = 100
    data = pd.DataFrame({key: rng.uniform(1, 20, n) for key in FEATURES})
    data["Churn"] = [0] * 80 + [1] * 20
    return data


def test_split_80_20(clean_sample):
    result = prepare_data(clean_sample)
    assert len(result.X_train) == 80
    assert len(result.X_test) == 20
    assert len(result.y_train) == 80
    assert len(result.y_test) == 20


def test_smote_solo_entrenamiento(clean_sample):
    result = prepare_data(clean_sample)
    assert result.y_train_smote.value_counts().nunique() == 1
    assert len(result.X_test) == 20
    assert set(result.X_train.index).isdisjoint(set(result.X_test.index))


def test_falta_variable_requerida(clean_sample):
    with pytest.raises(ValueError, match="Faltan columnas"):
        prepare_data(clean_sample.drop(columns=["DayMins"]))


def test_rechaza_nulos(clean_sample):
    clean_sample.loc[0, "DataUsage"] = np.nan
    with pytest.raises(ValueError, match="valores nulos"):
        prepare_data(clean_sample)
