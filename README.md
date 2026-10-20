# Churn Intelligence SaaS

Prototipo de análisis y predicción de abandono de clientes (*churn*), desarrollado para las materias **Testeo de Software** y **Práctica Profesionalizante I**, durante el año 2026.

El proyecto integra el procesamiento de datos, un modelo predictivo basado en Random Forest con SMOTE y una interfaz web para consumir las funcionalidades de predicción. Además, incluye pruebas automatizadas para validar los componentes del procesamiento de datos y del modelo.

## Integrantes

- Amaya, Brenda
- Amaya, Paula
- Cortez, Valeria
- Manrique Aguad, Agustín
- Martinez, Cristian
- Sudañez, Isaias Emanuel

## Tecnologías utilizadas

### Datos y Machine Learning

- Python
- Pandas y NumPy
- Scikit-learn
- imbalanced-learn
- Random Forest
- SMOTE

### Backend

- FastAPI
- Python
- Pytest

### Frontend

- React
- JavaScript
- Vite

### Testing

- Pytest
- Pruebas funcionales y de integración
- Pruebas de carga sobre el procesamiento de datos

## Estructura del proyecto

```text
churn-intelligence-testing/
├── app/                    # Aplicación integrada del prototipo
├── frontend/               # Interfaz web
├── backend/                # API y lógica de predicción
├── data/
│   └── telecom_dirty.csv
├── src/
│   ├── data_loader.py
│   ├── cleaning.py
│   ├── pipeline.py
│   └── model.py
├── tests/
│   ├── test_data_loader.py
│   ├── test_cleaning.py
│   ├── test_pipeline.py
│   ├── test_model.py
│   ├── test_integration.py
│   └── test_load.py
├── evidencias/
├── reportes/
├── requirements.txt
└── README.md
```

> La estructura representa las carpetas principales del repositorio. Los archivos internos de `app/`, `frontend/` y `backend/` se organizan según la implementación actual.

## Funcionalidades del prototipo

- Procesamiento y preparación de datos para el análisis de churn.
- Predicción individual de abandono a partir de las características de un cliente.
- Predicción sobre conjuntos de clientes mediante archivos CSV.
- Visualización de resultados de predicción a través de la interfaz web.
- Exposición de funcionalidades predictivas mediante una API.
- Pruebas automatizadas para componentes del procesamiento de datos y del modelo.

## Instalación y ejecución

### 1. Requisitos previos

- Python instalado.
- Node.js y npm instalados.
- Git para clonar el repositorio.

### 2. Configurar el entorno virtual de Python

Desde la raíz del repositorio, crear el entorno virtual:

```bash
python -m venv .venv
```

Activarlo según el sistema operativo.

**Windows — Git Bash:**

```bash
source .venv/Scripts/activate
```

**Windows — CMD:**

```cmd
.venv\Scripts\activate
```

**Linux o macOS:**

```bash
source .venv/bin/activate
```

Con el entorno virtual activado, instalar las dependencias:

```bash
python -m pip install -r requirements.txt
```

### 3. Ejecutar las pruebas automatizadas

Desde la raíz del repositorio y con el entorno virtual activado:

```bash
python -m pytest -v
```

Para visualizar también las salidas generadas durante la ejecución:

```bash
python -m pytest -v -s
```

### 4. Ejecutar el backend

Ingresar a la carpeta del backend:

```bash
cd backend
```

Activar el entorno virtual desde la raíz antes de ingresar a esta carpeta, si todavía no está activo. Luego ejecutar el comando de inicio correspondiente a la configuración actual del proyecto.

**Nota:** el comando exacto de inicio depende de cómo esté definido el punto de entrada de FastAPI en el repositorio.

### 5. Ejecutar el frontend

Ingresar a la carpeta del frontend:

```bash
cd frontend
```

Instalar las dependencias de Node.js:

```bash
npm install
```

Iniciar el servidor de desarrollo:

```bash
npm run dev
```

La dirección local para acceder a la interfaz será la que indique Vite en la terminal.

> Para consumir la API correctamente, el backend debe estar iniciado y la configuración de conexión del frontend debe apuntar a la dirección correspondiente.

## Testing

Se desarrollaron pruebas automatizadas para validar:

- La carga de archivos CSV.
- El tratamiento de valores nulos.
- La eliminación de registros duplicados.
- La preparación y ejecución del pipeline de datos.
- La generación de predicciones.
- La integración del flujo de procesamiento y modelado.
- El procesamiento de distintos volúmenes de registros.

También se incorporaron pruebas adicionales:

- **Integración:** ejecución del flujo con datos sintéticos y con el dataset original.
- **Carga:** evaluación del procesamiento con 1.000, 5.000 y 10.000 registros, midiendo tiempos y memoria.

## Resultados de testing

En la ejecución documentada se obtuvieron los siguientes resultados:

- **26 pruebas automatizadas aprobadas**, sin fallos.
- Tiempo total de ejecución: **11,65 segundos**.
- En la prueba de integración con el dataset original se obtuvo un *Accuracy* de **97,25 %** y un **ROC-AUC de 0,9918**.

Estos resultados corresponden a la ejecución de las pruebas registradas y no representan una garantía de rendimiento para todos los conjuntos de datos o entornos.

## Integración del prototipo — Práctica Profesionalizante I

El prototipo integra el modelo predictivo con una aplicación compuesta por un backend y un frontend.

El flujo general es:

1. El usuario ingresa las características de un cliente o carga un archivo CSV.
2. El backend recibe la solicitud y ejecuta la lógica de predicción.
3. El modelo procesa los datos y genera las predicciones.
4. La interfaz presenta los resultados obtenidos.

La integración permite consumir las funcionalidades predictivas desde una interfaz web, en lugar de limitar el uso del modelo a la ejecución aislada de código.

## Limitaciones y alcance

Las pruebas documentadas corresponden a los componentes del procesamiento de datos, el pipeline, el modelo y los escenarios de integración y carga indicados anteriormente.

La cobertura de testing de la interfaz web y de todos los flujos completos entre frontend y backend debe considerarse por separado de los resultados de las pruebas automatizadas ya registradas.

## Evidencias y reportes

- `evidencias/`: capturas y materiales de respaldo de las ejecuciones.
- `reportes/`: documentación de las pruebas y sus resultados.

## Materias integradas

**Testeo de Software:** diseño y ejecución de pruebas automatizadas, validación del procesamiento de datos, pruebas de integración y evaluación de carga.

**Práctica Profesionalizante I:** integración del modelo predictivo con una API y una interfaz web, conformando una versión beta del prototipo Churn Intelligence SaaS.
