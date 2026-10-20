
from typing import Any

from pydantic import BaseModel, Field


class ChurnPredictionRequest(BaseModel):
    account_weeks: float
    contract_renewal: int
    data_plan: int
    data_usage: float
    cust_serv_calls: float
    day_mins: float
    day_calls: float
    monthly_charge: float
    overage_fee: float
    roam_mins: float


class CustomerExplanation(BaseModel):
    feature: str
    value: float
    contribution: float
    direction: str


class ChurnPredictionResponse(BaseModel):
    prediction: int
    churn_probability: float
    risk_level: str
    explanation: list[CustomerExplanation] = Field(
        default_factory=list
    )


class FeatureImportance(BaseModel):
    feature: str
    importance: float


class InterpretabilityResponse(BaseModel):
    available: bool
    features: list[FeatureImportance] = Field(
        default_factory=list
    )


class CustomerResult(BaseModel):
    customer_id: str
    prediction: int
    churn_probability: float
    risk_level: str
    features: dict[str, Any]
    explanation: list[CustomerExplanation] = Field(
        default_factory=list
    )


class DatasetPredictionResponse(BaseModel):
    dataset_id: str
    total_customers: int
    predicted_churn: int


class CustomerListResponse(BaseModel):
    dataset_id: str
    total: int
    page: int
    page_size: int
    items: list[CustomerResult]


class DashboardResponse(BaseModel):
    dataset_id: str
    total_customers: int
    predicted_churn: int
    predicted_retention: int
    churn_rate: float
    average_churn_probability: float
    risk_distribution: dict[str, int]
