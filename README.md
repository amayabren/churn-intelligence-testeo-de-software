# Churn Intelligence — Testeo de Software

Repositorio de pruebas automatizadas del proyecto Churn Intelligence SaaS, desarrollado para la materia Testeo de Software.

El objetivo es validar el funcionamiento del prototipo predictivo de Churn, desde la carga y limpieza de datos hasta la generación de predicciones mediante Random Forest + SMOTE.

**Integrantes:**

- Amaya, Brenda
- Amaya, Paula
- Cortez, Valeria
- Manrique Aguad, Agustín
- Martinez, Cristian
- Sudañez, Isaias Emanuel

## Tecnologías utilizadas

- Python
- Pandas y NumPy
- Scikit-learn e imbalanced-learn
- Pytest

## Estructura del proyecto

```text
churn-intelligence-testing/
├── data/
│ └── telecom_dirty.csv
├── src/
│ ├── data_loader.py
│ ├── cleaning.py
│ ├── pipeline.py
│ └── model.py
├── tests/
│ ├── test_data_loader.py
│ ├── test_cleaning.py
│ ├── test_pipeline.py
│ ├── test_model.py
│ ├── test_integration.py
│ └── test_load.py
├── evidencias/
├── reportes/
├── requirements.txt
└── README.md
```

## Pruebas implementadas

Se desarrollaron pruebas funcionales para validar la carga de archivos CSV, el tratamiento de valores nulos, la eliminación de duplicados, la normalización de datos, la preparación del pipeline y la generación de predicciones.

También se incorporaron dos tipos de pruebas adicionales:

- Integración: ejecución del flujo completo con datos sintéticos y con el dataset original.

- Carga: evaluación del procesamiento con 1.000, 5.000 y 10.000 registros, midiendo tiempos y memoria.

## Instalación y ejecución

Instalar las dependencias:

​`bash
pip install -r requirements.txt
​`

Ejecutar todas las pruebas:

​`bash
python -m pytest -v
​`

Para visualizar los resultados detallados:

​`bash
python -m pytest -v -s
​`

## Resultados

26 pruebas automatizadas aprobadas, sin fallos, en una ejecución total de 11,65 segundos.

La prueba de integración con el dataset original obtuvo un Accuracy de 97,25 % y un ROC-AUC de 0,9918, coincidiendo con los resultados del prototipo de Ciencia de Datos.

Las funcionalidades de consulta individual y dashboard permanecen pendientes de implementación y no forman parte de las pruebas ejecutadas.

## Evidencias

Las capturas de ejecución se almacenan en evidencias/ y la documentación de testing en reportes/.
Instalar dependencias: `pip install -r requirements.txt`.
