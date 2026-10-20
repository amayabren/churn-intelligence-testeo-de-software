
"""

Este repositorio guarda los resultados procesados para que el frontend 
pueda consultar la lista de clientes, su detalle y los indicadores 
del dashboard sin volver a ejecutar el modelo en cada consulta.

"""
from threading import RLock


class DatasetRepository:
    def __init__(self):
        self._datasets: dict[str, dict] = {}
        self._lock = RLock()

    def save(self, dataset_id: str, customers: list[dict]) -> None:
        with self._lock:
            self._datasets[dataset_id] = {
                "dataset_id": dataset_id,
                "customers": customers,
            }

    def get(self, dataset_id: str) -> dict | None:
        with self._lock:
            return self._datasets.get(dataset_id)

    def get_customer(
        self,
        dataset_id: str,
        customer_id: str,
    ) -> dict | None:
        with self._lock:
            dataset = self._datasets.get(dataset_id)

            if dataset is None:
                return None

            return next(
                (
                    customer
                    for customer in dataset["customers"]
                    if customer["customer_id"] == customer_id
                ),
                None,
            )


dataset_repository = DatasetRepository()