"""Limpieza de Telecom Churn extraída del Colab del 12 de octubre.

Se conservan las reglas originales; no incluye lectura ni validación de CSV.
"""
import numpy as np
import pandas as pd

def clean_telecom_data(df: pd.DataFrame) -> pd.DataFrame:
    """Limpia y prepara el dataset de Telecom Churn.

    """
    # Copia para evitar SettingWithCopyWarning
    df = df.copy()

    # -------------------------------------------------------------
    # 1. Eliminación de Duplicados Exactos
    # -------------------------------------------------------------
    initial_rows = len(df)
    df = df.drop_duplicates()
    duplicate_rows = initial_rows - len(df)
    print(
        f"[-] Eliminados {duplicate_rows} registros duplicados exactos."
        f" Nuevas dimensiones: {df.shape}"
    )

    # -------------------------------------------------------------
    # 2. Estandarización de Variables de Texto (Churn, ContractRenewal, DataPlan)
    # -------------------------------------------------------------
    binary_map = {
        "Yes": 1,
        "1": 1,
        "yes": 1,
        "True": 1,
        "Si": 1,
        "SI": 1,
        "YES": 1,
        "true": 1,
        "si": 1,
        "yess": 1,
        "No": 0,
        "0": 0,
        "False": 0,
        "NO": 0,
        "false": 0,
        "no": 0,
        "n0": 0,
    }

    for col in ["Churn", "ContractRenewal", "DataPlan"]:
        if col in df.columns:
            df[col] = df[col].astype(str).str.strip().map(binary_map)
    print(
        "[✓] Estandarizadas columnas 'Churn', 'ContractRenewal' y 'DataPlan' a"
        " formato binario (0 y 1)."
    )

    # -------------------------------------------------------------
    # 3. Limpieza de Fechas e Imputación de Semanas (AccountWeeks)
    # -------------------------------------------------------------
    ref_date = pd.to_datetime("2026-08-28")

    def parse_date(x):
        if pd.isna(x):
            return pd.NaT
        x_str = str(x).strip()
        for fmt in (
            "%Y-%m-%d",
            "%d/%m/%Y",
            "%Y.%m.%d",
            "%m-%d-%Y",
            "%b %d, %Y",
            "%Y/%m/%d",
        ):
            try:
                return pd.to_datetime(x_str, format=fmt)
            except (ValueError, TypeError):
                continue
        try:
            return pd.to_datetime(x_str, errors="coerce")
        except (ValueError, TypeError):
            return pd.NaT

    df["RegistrationDate_clean"] = df["RegistrationDate"].apply(parse_date)

    # Inconsistencias lógicas
    df.loc[df["RegistrationDate_clean"] > ref_date, "RegistrationDate_clean"] = (
        pd.NaT
    )
    df.loc[df["AccountWeeks"] < 0, "AccountWeeks"] = np.nan

    # Imputaciones cruzadas
    mask_missing_date = (
        df["RegistrationDate_clean"].isna() & df["AccountWeeks"].notna()
    )
    df.loc[mask_missing_date, "RegistrationDate_clean"] = (
        ref_date
        - pd.to_timedelta(df.loc[mask_missing_date, "AccountWeeks"] * 7, unit="D")
    )

    mask_missing_weeks = (
        df["AccountWeeks"].isna() & df["RegistrationDate_clean"].notna()
    )
    df.loc[mask_missing_weeks, "AccountWeeks"] = (
        ref_date - df.loc[mask_missing_weeks, "RegistrationDate_clean"]
    ).dt.days // 7

    median_weeks = df["AccountWeeks"].median()
    df["AccountWeeks"] = df["AccountWeeks"].fillna(median_weeks)

    mask_still_no_date = df["RegistrationDate_clean"].isna()
    df.loc[mask_still_no_date, "RegistrationDate_clean"] = (
        ref_date
        - pd.to_timedelta(
            df.loc[mask_still_no_date, "AccountWeeks"] * 7, unit="D"
        )
    )

    df["AccountWeeks"] = df["AccountWeeks"].round().astype(int)
    print(
        "[✓] Corregidas inconsistencias de fechas e imputadas 'AccountWeeks' y"
        " 'RegistrationDate' cruzadas."
    )

    # -------------------------------------------------------------
    # 4. Limpieza de Variables de Consumo y Negocio
    # -------------------------------------------------------------
    # CustServCalls
    median_calls = df.loc[df["CustServCalls"] <= 10, "CustServCalls"].median()
    df.loc[df["CustServCalls"] > 10, "CustServCalls"] = np.nan
    df["CustServCalls"] = df["CustServCalls"].fillna(median_calls).astype(int)

    # DataUsage
    df.loc[(df["DataPlan"] == 0) & (df["DataUsage"].isna()), "DataUsage"] = 0.0
    median_data_usage_active = df.loc[
        (df["DataPlan"] == 1) & (df["DataUsage"] > 0), "DataUsage"
    ].median()
    df["DataUsage"] = df["DataUsage"].fillna(median_data_usage_active)

    # MonthlyCharge
    median_charge = df.loc[
        (df["MonthlyCharge"] >= 5.0) & (df["MonthlyCharge"] <= 500.0),
        "MonthlyCharge",
    ].median()
    df.loc[
        (df["MonthlyCharge"] < 5.0) | (df["MonthlyCharge"] > 500.0),
        "MonthlyCharge",
    ] = np.nan
    df["MonthlyCharge"] = df["MonthlyCharge"].fillna(median_charge)

    print("[✓] Tratadas anomalías en consumo, cobros y llamadas de servicio.")

    # -------------------------------------------------------------
    # 5. Estructuración y Ordenamiento Cronológico
    # -------------------------------------------------------------
    df["RegistrationMonth"] = (
        df["RegistrationDate_clean"].dt.to_period("M").astype(str)
    )
    df_sorted = df.sort_values(by="RegistrationDate_clean").reset_index(
        drop=True
    )
    df_final = df_sorted.drop(columns=["RegistrationDate"]).rename(
        columns={"RegistrationDate_clean": "RegistrationDate"}
    )

    cols_ordered = [
        "RegistrationDate",
        "RegistrationMonth",
        "AccountWeeks",
        "Churn",
        "ContractRenewal",
        "DataPlan",
        "DataUsage",
        "CustServCalls",
        "DayMins",
        "DayCalls",
        "MonthlyCharge",
        "OverageFee",
        "RoamMins",
    ]

    # Filtrar solo columnas existentes para evitar KeyError si falta alguna en el dataset
    cols_to_use = [col for col in cols_ordered if col in df_final.columns]
    df_final = df_final[cols_to_use]

    print("=== LIMPIEZA COMPLETADA CON ÉXITO ===")
    print(f"[✓] Dimensiones finales listas: {df_final.shape}")
    print("==============================================")

    return df_final
