"""Fixtures sintéticas: no requieren el CSV completo ni acceso a Internet."""
import pandas as pd
import pytest


@pytest.fixture
def valid_df():
    return pd.DataFrame({
        "RegistrationDate": ["2024-01-01", "2024-02-01", "2024-03-01"],
        "AccountWeeks": [100, 90, 80],
        "Churn": ["No", "Yes", "No"],
        "ContractRenewal": ["Yes", "No", "Yes"],
        "DataPlan": ["No", "Yes", "Yes"],
        "DataUsage": [0.0, 2.0, 4.0],
        "CustServCalls": [1, 2, 3],
        "DayMins": [100.0, 200.0, 150.0],
        "DayCalls": [80, 90, 100],
        "MonthlyCharge": [30.0, 60.0, 45.0],
        "OverageFee": [5.0, 8.0, 6.0],
        "RoamMins": [4.0, 7.0, 6.0],
    })
