"""Preparación de variables y balanceo del modelo final del Colab."""
from dataclasses import dataclass

import pandas as pd
from imblearn.over_sampling import SMOTE
from sklearn.model_selection import train_test_split

FEATURES = [
    "AccountWeeks", "ContractRenewal", "DataPlan", "DataUsage",
    "CustServCalls", "DayMins", "DayCalls", "MonthlyCharge",
    "OverageFee", "RoamMins",
]
TARGET = "Churn"


@dataclass
class PreparedData:
    X_train: pd.DataFrame
    X_test: pd.DataFrame
    y_train: pd.Series
    y_test: pd.Series
    X_train_smote: pd.DataFrame
    y_train_smote: pd.Series


def prepare_data(df_clean: pd.DataFrame) -> PreparedData:
    """Selecciona variables, divide 80/20 y aplica SMOTE solo a train.

    Conserva test_size=0.20, random_state=42 y stratify=y del Colab.
    Se espera un dataset ya limpio; no se realiza imputación aquí.
    """
    required = FEATURES + [TARGET]
    missing = [column for column in required if column not in df_clean.columns]
    if missing:
        raise ValueError(f"Faltan columnas requeridas: {', '.join(missing)}")

    X = df_clean[FEATURES].copy()
    y = df_clean[TARGET].copy()
    if X.isna().any().any() or y.isna().any():
        raise ValueError("Existen valores nulos en las variables del modelo")
    if not y.isin([0, 1]).all():
        raise ValueError("Churn debe contener únicamente 0 y 1")

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )
    smote = SMOTE(random_state=42)
    X_train_smote, y_train_smote = smote.fit_resample(X_train, y_train)
    return PreparedData(
        X_train=X_train, X_test=X_test, y_train=y_train, y_test=y_test,
        X_train_smote=X_train_smote, y_train_smote=y_train_smote,
    )
