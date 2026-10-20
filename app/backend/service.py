from io import BytesIO
from uuid import uuid4

import numpy as np
import pandas as pd

from fastapi import HTTPException, UploadFile

from src.cleaning import clean_telecom_data
from src.data_loader import REQUIRED_COLUMNS

from app.backend.ml.predictor import churn_predictor
from app.backend.ml.global_explainer import GlobalExplainer
from app.backend.ml.risk import risk_classifier
from app.backend.repository import dataset_repository


class ChurnService:
    def __init__(self):
        self.predictor = churn_predictor
        self.model = churn_predictor.model
        self.global_explainer = GlobalExplainer(self.model)

    @staticmethod
    def _validate_dataframe(df: pd.DataFrame) -> None:
        required = set(REQUIRED_COLUMNS) - {"Churn"}
        missing = sorted(required - set(df.columns))

        if missing:
            raise HTTPException(
                status_code=422,
                detail={
                    "message": (
                        "El CSV no contiene todas las columnas requeridas."
                    ),
                    "missing_columns": missing,
                },
            )

        if df.empty:
            raise HTTPException(
                status_code=422,
                detail="El CSV no contiene registros.",
            )

    @staticmethod
    def _json_value(value):
        if pd.isna(value):
            return None

        if isinstance(value, pd.Timestamp):
            return value.isoformat()

        if isinstance(value, np.generic):
            return value.item()

        return value

    async def predict_dataset(self, file: UploadFile) -> dict:
        if not file.filename or not file.filename.lower().endswith(".csv"):
            raise HTTPException(
                status_code=415,
                detail="Formato no admitido. Subí un archivo CSV.",
            )

        content = await file.read()

        if not content:
            raise HTTPException(
                status_code=422,
                detail="El archivo CSV está vacío.",
            )

        try:
            df = pd.read_csv(BytesIO(content))
        except (
            UnicodeDecodeError,
            pd.errors.ParserError,
            ValueError,
        ) as exc:
            raise HTTPException(
                status_code=422,
                detail=f"No se pudo interpretar el CSV: {exc}",
            ) from exc

        self._validate_dataframe(df)

        try:
            cleaned = clean_telecom_data(df)
        except (KeyError, ValueError, TypeError) as exc:
            raise HTTPException(
                status_code=422,
                detail=f"No se pudo limpiar el dataset: {exc}",
            ) from exc

        if cleaned.empty:
            raise HTTPException(
                status_code=422,
                detail="No quedaron registros después de la limpieza.",
            )

        customers = []

        try:
            for index, (_, row) in enumerate(cleaned.iterrows()):
                input_data = row.to_dict()

                result = self.predictor.predict(input_data)

                customer_features = {
                    str(key): self._json_value(value)
                    for key, value in row.items()
                    if key != "Churn"
                }

                customers.append({
                    "customer_id": f"customer_{index + 1:06d}",
                    **result,
                    "features": customer_features,
                })

        except (ValueError, KeyError, TypeError) as exc:
            raise HTTPException(
                status_code=422,
                detail=f"No se pudo procesar un registro del CSV: {exc}",
            ) from exc
        except Exception as exc:
            raise HTTPException(
                status_code=500,
                detail=f"Falló la predicción o la explicación SHAP: {exc}",
            ) from exc

        dataset_id = str(uuid4())
        dataset_repository.save(dataset_id, customers)

        return {
            "dataset_id": dataset_id,
            "total_customers": len(customers),
            "predicted_churn": sum(
                customer["prediction"] == 1
                for customer in customers
            ),
        }

    def get_customers(
        self,
        dataset_id: str,
        risk: str | None,
        search: str | None,
        page: int,
        page_size: int,
    ) -> dict:
        dataset = dataset_repository.get(dataset_id)

        if dataset is None:
            raise HTTPException(
                status_code=404,
                detail="No se encontró el dataset procesado.",
            )

        customers = dataset["customers"]

        if risk:
            normalized_risk = risk.strip().upper()

            if normalized_risk not in {"LOW", "MEDIUM", "HIGH"}:
                raise HTTPException(
                    status_code=422,
                    detail="El riesgo debe ser LOW, MEDIUM o HIGH.",
                )

            customers = [
                customer
                for customer in customers
                if customer["risk_level"] == normalized_risk
            ]

        if search:
            term = search.strip().lower()
            customers = [
                customer
                for customer in customers
                if term in customer["customer_id"].lower()
            ]

        total = len(customers)
        start = (page - 1) * page_size

        return {
            "dataset_id": dataset_id,
            "total": total,
            "page": page,
            "page_size": page_size,
            "items": customers[start:start + page_size],
        }

    def get_customer(
        self,
        dataset_id: str,
        customer_id: str,
    ) -> dict:
        customer = dataset_repository.get_customer(
            dataset_id,
            customer_id,
        )

        if customer is None:
            raise HTTPException(
                status_code=404,
                detail="No se encontró el cliente en el dataset.",
            )

        return customer

    def get_dashboard(self, dataset_id: str) -> dict:
        dataset = dataset_repository.get(dataset_id)

        if dataset is None:
            raise HTTPException(
                status_code=404,
                detail="No se encontró el dataset procesado.",
            )

        customers = dataset["customers"]
        total = len(customers)

        predicted_churn = sum(
            customer["prediction"] == 1
            for customer in customers
        )

        risk_distribution = {
            level: sum(
                customer["risk_level"] == level
                for customer in customers
            )
            for level in ("LOW", "MEDIUM", "HIGH")
        }

        average_probability = (
            sum(
                customer["churn_probability"]
                for customer in customers
            ) / total
            if total
            else 0.0
        )

        return {
            "dataset_id": dataset_id,
            "total_customers": total,
            "predicted_churn": predicted_churn,
            "predicted_retention": total - predicted_churn,
            "churn_rate": (
                predicted_churn / total if total else 0.0
            ),
            "average_churn_probability": average_probability,
            "risk_distribution": risk_distribution,
        }

    def get_interpretability(self) -> dict:
        try:
            features = self.global_explainer.explain()
        except (AttributeError, RuntimeError, TypeError, ValueError):
            return {
                "available": False,
                "features": [],
            }

        return {
            "available": bool(features),
            "features": features,
        }


churn_service = ChurnService()