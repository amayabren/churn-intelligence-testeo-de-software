"""PE-01: prueba de carga del pipeline completo con datos sintéticos.

Desde la raíz del repositorio:
    python -m pytest tests/test_load.py -v -s

No es un benchmark de concurrencia ni establece un SLA universal. Los tiempos
varían según la computadora. El pico de tracemalloc mide asignaciones Python,
no toda la memoria residente de bibliotecas nativas.
"""

from contextlib import redirect_stdout
from io import StringIO
from time import perf_counter
import tracemalloc

import numpy as np
import pandas as pd
import pytest

from src.cleaning import clean_telecom_data
from src.pipeline import prepare_data
from src.model import train_model, predict_churn


VOLUMENES = (1_000, 5_000, 10_000)


def generar_dataset_sintetico(n: int, semilla: int = 42) -> pd.DataFrame:
    """Genera registros válidos, reproducibles y sin datos personales."""
    rng = np.random.default_rng(semilla)
    churn = np.array(["Yes"] * (n // 5) + ["No"] * (n - n // 5))
    rng.shuffle(churn)
    plan = rng.integers(0, 2, size=n)
    renovacion = rng.integers(0, 2, size=n)

    return pd.DataFrame({
        "RegistrationDate": ["2024-01-01"] * n,
        "AccountWeeks": rng.integers(20, 160, size=n),
        "Churn": churn,
        "ContractRenewal": np.where(renovacion == 1, "Yes", "No"),
        "DataPlan": np.where(plan == 1, "Yes", "No"),
        "DataUsage": np.where(plan == 1, rng.uniform(1, 8, size=n), 0.0),
        "CustServCalls": rng.integers(0, 8, size=n),
        "DayMins": rng.uniform(50, 300, size=n),
        "DayCalls": rng.integers(40, 140, size=n),
        "MonthlyCharge": rng.uniform(20, 100, size=n),
        "OverageFee": rng.uniform(0, 20, size=n),
        "RoamMins": rng.uniform(0, 20, size=n),
    })


@pytest.mark.parametrize("volumen", VOLUMENES, ids=lambda n: f"{n}_registros")
def test_pe01_carga_pipeline_completo(volumen: int):
    """Mide las etapas y valida la integridad de los resultados por volumen."""
    datos = generar_dataset_sintetico(volumen)
    tiempos = {}

    tracemalloc.start()
    inicio_total = perf_counter()
    try:
        inicio = perf_counter()
        # Evita que el detalle de limpieza distorsione el reporte de carga.
        with redirect_stdout(StringIO()):
            limpio = clean_telecom_data(datos)
        tiempos["limpieza"] = perf_counter() - inicio

        inicio = perf_counter()
        preparado = prepare_data(limpio)
        tiempos["preparacion_smote"] = perf_counter() - inicio

        inicio = perf_counter()
        modelo = train_model(preparado)
        tiempos["entrenamiento"] = perf_counter() - inicio

        inicio = perf_counter()
        predicciones = predict_churn(modelo, preparado.X_test)
        tiempos["prediccion"] = perf_counter() - inicio
    finally:
        tiempo_total = perf_counter() - inicio_total
        _, pico_bytes = tracemalloc.get_traced_memory()
        tracemalloc.stop()

    # Verificaciones funcionales: no dependen de la velocidad del equipo.
    assert len(limpio) == volumen, "Se perdieron registros durante la limpieza"
    assert len(preparado.X_train) + len(preparado.X_test) == volumen
    assert len(preparado.X_test) == volumen // 5
    assert len(predicciones) == len(preparado.X_test)
    assert predicciones.index.equals(preparado.X_test.index)
    assert predicciones["prediction"].isin([0, 1]).all()
    probabilidades = predicciones["churn_probability"].to_numpy()
    assert np.isfinite(probabilidades).all()
    assert ((probabilidades >= 0) & (probabilidades <= 1)).all()

    print(f"\nPE-01 | {volumen:,} registros | {len(predicciones):,} predicciones")
    for etapa, segundos in tiempos.items():
        print(f"  {etapa:20s}: {segundos:.3f} s")
    print(f"  {'TOTAL':20s}: {tiempo_total:.3f} s")
    print(f"  Pico tracemalloc       : {pico_bytes / (1024 ** 2):.2f} MiB")
    print("  Integridad             : APROBADA")
