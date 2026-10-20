from app.backend.ml.predictor import FEATURE_COLUMNS


class GlobalExplainer:
    def __init__(self, model):
        self.model = model

    def explain(self) -> list[dict]:
        importances = getattr(
            self.model,
            "feature_importances_",
            None,
        )

        if importances is None:
            return []

        if len(importances) != len(FEATURE_COLUMNS):
            raise RuntimeError(
                "Las importancias del modelo no coinciden "
                "con las variables configuradas."
            )

        results = [
            {
                "feature": feature,
                "importance": float(importance),
            }
            for feature, importance in zip(
                FEATURE_COLUMNS,
                importances,
            )
        ]

        results.sort(
            key=lambda item: item["importance"],
            reverse=True,
        )

        return results