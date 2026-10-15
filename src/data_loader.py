"""Lectura y validación estructural de archivos CSV de Telecom Churn.

La validación de cabeceras es nueva para la evidencia de Testeo de Software.
No modifica la función de limpieza heredada del Colab.
"""
from pathlib import Path

import pandas as pd

REQUIRED_COLUMNS = (
    "RegistrationDate", "AccountWeeks", "Churn", "ContractRenewal",
    "DataPlan", "DataUsage", "CustServCalls", "DayMins", "DayCalls",
    "MonthlyCharge", "OverageFee", "RoamMins",
)


def load_dataset(filepath: str | Path, *, validate_columns: bool = True) -> pd.DataFrame:
    """Carga un CSV y opcionalmente comprueba las columnas que requiere la limpieza.

    Lanza FileNotFoundError, ValueError o errores de lectura de pandas,
    para que el llamador pueda registrar el resultado del caso de prueba.
    """
    path = Path(filepath)
    if not path.is_file():
        raise FileNotFoundError(f"No se encontró el archivo CSV: {path}")
    if path.suffix.lower() != ".csv":
        raise ValueError(f"Formato no admitido: {path.suffix or '(sin extensión)'}. Se espera .csv")

    df = pd.read_csv(path)
    if validate_columns:
        missing = [column for column in REQUIRED_COLUMNS if column not in df.columns]
        if missing:
            raise ValueError("Faltan columnas obligatorias: " + ", ".join(missing))
    return df
