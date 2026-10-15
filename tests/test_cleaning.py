"""Pruebas de calidad de datos: CF-02A, CF-02B y CF-02C."""
import pandas as pd
import pytest

from src.cleaning import clean_telecom_data


def test_cf02a_nulos_datausage_sin_plan(valid_df):
    datos = valid_df.copy()
    datos.loc[0, "DataUsage"] = float("nan")

    resultado = clean_telecom_data(datos)

    # Identificamos el registro por DayMins, pues la limpieza ordena por fecha.
    fila = resultado.loc[resultado["DayMins"] == 100.0].iloc[0]
    assert fila["DataPlan"] == 0
    assert fila["DataUsage"] == 0.0


def test_cf02a_nulos_datausage_con_plan(valid_df):
    datos = valid_df.copy()
    datos.loc[1, "DataUsage"] = float("nan")
    # La otra fila con plan activo conserva 4.0 como mediana válida.

    resultado = clean_telecom_data(datos)
    fila = resultado.loc[resultado["DayMins"] == 200.0].iloc[0]
    assert fila["DataPlan"] == 1
    assert fila["DataUsage"] == pytest.approx(4.0)


def test_cf02b_elimina_duplicados_exactos(valid_df):
    datos = pd.concat([valid_df, valid_df.iloc[[0]]], ignore_index=True)

    resultado = clean_telecom_data(datos)

    assert len(datos) == 4
    assert len(resultado) == 3
    assert resultado.duplicated().sum() == 0


@pytest.mark.parametrize("entrada,esperado", [
    ("Yes", 1), ("yes", 1), ("Si", 1), ("No", 0), ("n0", 0), ("False", 0),
])
def test_cf02c_normaliza_churn(valid_df, entrada, esperado):
    datos = valid_df.copy()
    datos.loc[0, "Churn"] = entrada

    resultado = clean_telecom_data(datos)
    fila = resultado.loc[resultado["DayMins"] == 100.0].iloc[0]
    assert fila["Churn"] == esperado


def test_no_modifica_dataframe_original(valid_df):
    original = valid_df.copy(deep=True)
    clean_telecom_data(valid_df)
    pd.testing.assert_frame_equal(valid_df, original)
