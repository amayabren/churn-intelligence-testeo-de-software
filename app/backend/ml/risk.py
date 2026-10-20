from enum import Enum


class RiskLevel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


LOW_THRESHOLD = 0.30
HIGH_THRESHOLD = 0.60


class RiskClassifier:
    def classify(self, probability: float) -> RiskLevel:
        if probability < LOW_THRESHOLD:
            return RiskLevel.LOW

        if probability < HIGH_THRESHOLD:
            return RiskLevel.MEDIUM

        return RiskLevel.HIGH


risk_classifier = RiskClassifier()