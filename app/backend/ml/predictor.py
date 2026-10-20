
from pathlib import Path

import joblib
import numpy as np
import shap


MODEL_PATH = Path(__file__).resolve().parent / "churn_model_rf.pkl"


BASE_FEATURES = [
    "AccountWeeks",
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

FEATURE_COLUMNS = BASE_FEATURES

INPUT_MAPPING = {
    "AccountWeeks": "account_weeks",
    "ContractRenewal": "contract_renewal",
    "DataPlan": "data_plan",
    "DataUsage": "data_usage",
    "CustServCalls": "cust_serv_calls",
    "DayMins": "day_mins",
    "DayCalls": "day_calls",
    "MonthlyCharge": "monthly_charge",
    "OverageFee": "overage_fee",
    "RoamMins": "roam_mins",
}


class ChurnPredictor:
    def __init__(self):
        if not MODEL_PATH.is_file():
            raise RuntimeError(
                f"No se encontró el modelo serializado: {MODEL_PATH}"
            )

        self.model = joblib.load(MODEL_PATH)

        feature_count = getattr(self.model, "n_features_in_", None)

        if feature_count is not None and feature_count != len(FEATURE_COLUMNS):
            raise RuntimeError(
                f"El modelo espera {feature_count} variables, "
                f"pero se configuraron {len(FEATURE_COLUMNS)}."
            )

        self.explainer = shap.TreeExplainer(self.model)

    def build_features(self, data: dict) -> np.ndarray:
        values = {}

        for feature, input_name in INPUT_MAPPING.items():
            if input_name in data:
                value = data[input_name]
            elif feature in data:
                value = data[feature]
            else:
                raise ValueError(
                    f"Falta la variable requerida: {input_name}"
                )

            values[feature] = float(value)

        features = np.asarray(
            [[values[name] for name in FEATURE_COLUMNS]],
            dtype=float,
        )

        if not np.isfinite(features).all():
            raise ValueError(
                "Las variables predictoras contienen valores no finitos."
            )

        return features

    def explain(self, features: np.ndarray) -> list[dict]:
        shap_values = self.explainer.shap_values(features)

        if hasattr(shap_values, "values"):
            shap_values = shap_values.values

        classes = list(getattr(self.model, "classes_", []))
        class_index = classes.index(1) if 1 in classes else -1

        if isinstance(shap_values, list):
            contributions = np.asarray(
                shap_values[class_index]
            )[0]
        else:
            shap_values = np.asarray(shap_values)

            if shap_values.ndim == 3:
                contributions = shap_values[0, :, class_index]
            elif shap_values.ndim == 2:
                contributions = shap_values[0]
            else:
                raise RuntimeError(
                    "El modelo devolvió un formato SHAP no reconocido."
                )

        if len(contributions) != len(FEATURE_COLUMNS):
            raise RuntimeError(
                "La cantidad de contribuciones SHAP no coincide "
                "con las variables del modelo."
            )

        explanations = []

        for feature, value, contribution in zip(
            FEATURE_COLUMNS,
            features[0],
            contributions,
        ):
            contribution = float(contribution)

            explanations.append({
                "feature": feature,
                "value": float(value),
                "contribution": contribution,
                "direction": (
                    "positive" if contribution > 0 else "negative"
                ),
            })

        explanations.sort(
            key=lambda item: abs(item["contribution"]),
            reverse=True,
        )

        return explanations[:5]

    def predict(self, data: dict) -> dict:
        from app.backend.ml.risk import risk_classifier

        features = self.build_features(data)

        prediction = int(self.model.predict(features)[0])

        classes = list(self.model.classes_)

        if 1 not in classes:
            raise RuntimeError(
                "El modelo no contiene la clase 1 para identificar churn."
            )

        probabilities = self.model.predict_proba(features)
        probability = float(probabilities[0, classes.index(1)])

        if not np.isfinite(probability) or not 0 <= probability <= 1:
            raise RuntimeError(
                "El modelo devolvió una probabilidad inválida."
            )

        return {
            "prediction": prediction,
            "churn_probability": probability,
            "risk_level": risk_classifier.classify(probability).value,
            "explanation": self.explain(features),
        }


churn_predictor = ChurnPredictor()
