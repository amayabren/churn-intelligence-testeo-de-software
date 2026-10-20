import os

from fastapi import FastAPI, File, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from app.backend.schemas import (
    ChurnPredictionRequest,
    ChurnPredictionResponse,
    CustomerListResponse,
    CustomerResult,
    DashboardResponse,
    DatasetPredictionResponse,
    InterpretabilityResponse,
)
from app.backend.service import churn_service
from app.backend.ml.predictor import churn_predictor


app = FastAPI(
    title="Churn Intelligence API",
    description=(
        "Predicción de churn, clasificación de riesgo, "
        "explicabilidad e indicadores de clientes."
    ),
    version="1.0.0",
)

# Permite localhost y el dominio desplegado en Vercel por defecto
DEFAULT_ORIGINS = (
    "http://localhost:3000,"
    "http://127.0.0.1:3000,"
    "http://localhost:5173,"
    "http://127.0.0.1:5173,"
    "https://frontend-inky-two-17.vercel.app"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        origin.strip()
        for origin in os.getenv(
            "CORS_ORIGINS",
            DEFAULT_ORIGINS,
        ).split(",")
        if origin.strip()
    ]
    or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "ok"}


@app.post(
    "/api/v1/churn/predict",
    response_model=ChurnPredictionResponse,
    tags=["Churn"],
)
def predict_churn(request: ChurnPredictionRequest):
    return churn_predictor.predict(request.model_dump())


@app.post(
    "/api/v1/churn/datasets/predict",
    response_model=DatasetPredictionResponse,
    tags=["Churn"],
)
async def predict_dataset(file: UploadFile = File(...)):
    return await churn_service.predict_dataset(file)


@app.get(
    "/api/v1/churn/datasets/{dataset_id}/customers",
    response_model=CustomerListResponse,
    tags=["Churn"],
)
def list_customers(
    dataset_id: str,
    risk: str | None = Query(default=None),
    search: str | None = Query(default=None, max_length=100),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
):
    return churn_service.get_customers(
        dataset_id=dataset_id,
        risk=risk,
        search=search,
        page=page,
        page_size=page_size,
    )


@app.get(
    "/api/v1/churn/datasets/{dataset_id}/customers/{customer_id}",
    response_model=CustomerResult,
    tags=["Churn"],
)
def get_customer(dataset_id: str, customer_id: str):
    return churn_service.get_customer(dataset_id, customer_id)


@app.get(
    "/api/v1/churn/datasets/{dataset_id}/dashboard",
    response_model=DashboardResponse,
    tags=["Churn"],
)
def get_dashboard(dataset_id: str):
    return churn_service.get_dashboard(dataset_id)


@app.get(
    "/api/v1/churn/interpretability",
    response_model=InterpretabilityResponse,
    tags=["Churn"],
)
def get_interpretability():
    return churn_service.get_interpretability()