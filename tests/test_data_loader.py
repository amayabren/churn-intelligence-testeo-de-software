"""Pruebas funcionales CF-01 y CF-02D: lectura y estructura del CSV."""
import pandas as pd
import pytest

from src.data_loader import load_dataset


def test_cf01_carga_csv_valido(tmp_path, valid_df):
    csv_path = tmp_path / "clientes_validos.csv"
    valid_df.to_csv(csv_path, index=False)

    resultado = load_dataset(csv_path)

    assert isinstance(resultado, pd.DataFrame)
    assert resultado.shape == valid_df.shape
    assert list(resultado.columns) == list(valid_df.columns)


def test_cf02d_falta_columna_obligatoria(tmp_path, valid_df):
    csv_path = tmp_path / "sin_fecha.csv"
    valid_df.drop(columns="RegistrationDate").to_csv(csv_path, index=False)

    with pytest.raises(ValueError, match="RegistrationDate"):
        load_dataset(csv_path)


def test_archivo_inexistente(tmp_path):
    with pytest.raises(FileNotFoundError, match="No se encontró"):
        load_dataset(tmp_path / "no_existe.csv")


def test_formato_no_csv(tmp_path):
    archivo = tmp_path / "clientes.txt"
    archivo.write_text("contenido", encoding="utf-8")

    with pytest.raises(ValueError, match="Formato no admitido"):
        load_dataset(archivo)
