import { useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  FileCheck2,
  FileUp,
  LoaderCircle,
  Users,
  BarChart3,
  ShieldCheck,
  RotateCcw,
} from "lucide-react";
import { api } from "../api";

const REQUIRED_COLUMNS = [
  { name: "AccountWeeks", type: "Numérico", description: "Antigüedad en semanas" },
  { name: "ContractRenewal", type: "0 o 1", description: "Renovó contrato" },
  { name: "DataPlan", type: "0 o 1", description: "Plan de datos" },
  { name: "DataUsage", type: "Numérico", description: "Consumo de datos" },
  { name: "CustServCalls", type: "Numérico", description: "Llamadas a soporte" },
  { name: "DayMins", type: "Numérico", description: "Minutos diurnos" },
  { name: "DayCalls", type: "Numérico", description: "Llamadas diurnas" },
  { name: "MonthlyCharge", type: "Numérico", description: "Cargo mensual" },
  { name: "OverageFee", type: "Numérico", description: "Cargo excedente" },
  { name: "RoamMins", type: "Numérico", description: "Minutos roaming" },
];

function ErrorMessage({ children }) {
  if (!children) return null;

  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-700"
    >
      <AlertCircle size={16} className="mt-0.5 shrink-0" />
      <span className="min-w-0 break-words">{children}</span>
    </div>
  );
}

function parseCsvHeader(text) {
  const firstLine = text.split(/\r\n|\n|\r/, 1)[0] ?? "";

  if (!firstLine.trim()) {
    throw new Error("El archivo CSV no contiene encabezados.");
  }

  const commaCount = (firstLine.match(/,/g) || []).length;
  const semicolonCount = (firstLine.match(/;/g) || []).length;
  const delimiter = semicolonCount > commaCount ? ";" : ",";

  const columns = [];
  let current = "";
  let quoted = false;

  for (let i = 0; i < firstLine.length; i++) {
    const char = firstLine[i];

    if (char === '"') {
      if (quoted && firstLine[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        quoted = !quoted;
      }
    } else if (char === delimiter && !quoted) {
      columns.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  columns.push(current.trim());

  return columns.map((column, index) =>
    index === 0 ? column.replace(/^\uFEFF/, "").trim() : column.trim()
  );
}

function validateCsvHeader(columns) {
  const normalizedColumns = columns.map((column) => column.toLowerCase());

  const missing = REQUIRED_COLUMNS.filter(
    ({ name }) => !normalizedColumns.includes(name.toLowerCase())
  ).map(({ name }) => name);

  const duplicates = columns.filter(
    (column, index) =>
      column &&
      columns.findIndex(
        (item) => item.toLowerCase() === column.toLowerCase()
      ) !== index
  );

  return { missing, duplicates };
}

function getApiError(err) {
  const detail = err?.response?.data?.detail ?? err?.detail;

  if (typeof detail === "string") return detail;

  if (detail && typeof detail === "object") {
    const missing = detail.missing_columns;

    if (Array.isArray(missing) && missing.length > 0) {
      return `Faltan columnas requeridas: ${missing.join(", ")}.`;
    }

    if (detail.message) return detail.message;
  }

  return err?.message || "No se pudo procesar el archivo.";
}

export default function Datasets({ onDatasetReady, onViewSummary }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [validation, setValidation] = useState(null);

  async function validateFile(selectedFile) {
    setFile(selectedFile);
    setError("");
    setResult(null);
    setValidation(null);

    if (!selectedFile) return;

    if (!selectedFile.name.toLowerCase().endsWith(".csv")) {
      setError("El archivo debe tener extensión .csv.");
      return;
    }

    if (selectedFile.size === 0) {
      setError("El archivo CSV está vacío.");
      return;
    }

    try {
      const text = await selectedFile.text();
      const columns = parseCsvHeader(text);

      if (columns.length === 0 || columns.every((column) => !column)) {
        setError("No se encontraron encabezados válidos en el CSV.");
        return;
      }

      const { missing, duplicates } = validateCsvHeader(columns);

      setValidation({
        columns,
        missing,
        duplicates,
        valid: missing.length === 0 && duplicates.length === 0,
      });

      if (missing.length > 0) {
        setError(
          `Faltan ${missing.length} columna(s) requerida(s). Revisá la lista abajo.`
        );
      } else if (duplicates.length > 0) {
        setError(
          `Hay columnas duplicadas: ${[...new Set(duplicates)].join(", ")}.`
        );
      }
    } catch {
      setError("No se pudo leer el archivo CSV.");
    }
  }

  async function handleUpload(event) {
    event.preventDefault();
    setError("");
    setResult(null);

    if (!file) {
      setError("Seleccioná un archivo CSV antes de continuar.");
      return;
    }

    if (!validation?.valid) {
      setError("Corregí las columnas faltantes o duplicadas antes de continuar.");
      return;
    }

    setUploading(true);

    try {
      const data = await api.predictDataset(file);
      setResult(data);
      onDatasetReady(data.dataset_id);
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setUploading(false);
    }
  }

  function handleReset() {
    setFile(null);
    setResult(null);
    setValidation(null);
    setError("");
  }

  return (
    <div className="mx-auto w-full max-w-5xl min-w-0 space-y-4 px-2 py-2">
      {/* Encabezado */}
      <header className="text-center sm:text-left">
        <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#477DA8]">
          Gestión de datos
        </p>
        <h1 className="text-xl font-bold tracking-tight text-[#263B52] sm:text-2xl">
          Datos y datasets
        </h1>
        <p className="mt-1 text-xs text-zinc-500 sm:text-sm">
          Cargá tu base de clientes para conocer su nivel de riesgo y anticiparte a posibles bajas.
        </p>
      </header>

      {/* 1. ¿CÓMO FUNCIONA? */}
      <section className="rounded-xl border border-[#DCE5EE] bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-2 mb-3">
          <h2 className="text-sm font-bold text-[#263B52]">¿Cómo funciona?</h2>
          <span className="text-xs text-zinc-400">Tres pasos simples</span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Step
            number="01"
            icon={<FileUp size={16} />}
            title="Cargá tus datos"
            description="Subí tu archivo CSV con las 10 columnas obligatorias."
          />
          <Step
            number="02"
            icon={<Users size={16} />}
            title="Analizamos cartera"
            description="El sistema procesa la información para detectar riesgo de bajas."
          />
          <Step
            number="03"
            icon={<BarChart3 size={16} />}
            title="Resultados"
            description="Revisá el resumen y las métricas clave de tus clientes."
          />
        </div>
      </section>

      {/* 2. CARGAR BASE DE CLIENTES */}
      <section className="rounded-xl border border-[#DCE5EE] bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#EAF1F8] text-[#315F89]">
              <FileUp size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#263B52]">
                Cargar base de clientes
              </h2>
              <p className="text-xs text-zinc-500">
                {result ? "Archivo analizado correctamente." : "Seleccioná un archivo CSV desde tu equipo."}
              </p>
            </div>
          </div>

          {/* Botón para cargar otro archivo si ya hay un resultado */}
          {result && (
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#DCE5EE] bg-white px-3 py-1.5 text-xs font-semibold text-[#315F89] transition hover:bg-[#F7F9FC]"
            >
              <RotateCcw size={14} />
              Cargar otro archivo
            </button>
          )}
        </div>

        {/* Si NO hay resultado, mostramos el formulario de carga */}
        {!result ? (
          <form onSubmit={handleUpload} className="mt-3 space-y-3">
            <label className="group flex min-h-24 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-[#B9CADB] bg-[#F7F9FC] px-4 py-3 text-center transition hover:border-[#477DA8] hover:bg-[#F0F5FA]">
              <span className="text-xs font-semibold text-[#34485E]">
                {file ? file.name : "Seleccionar archivo CSV"}
              </span>
              <span className="mt-0.5 text-[11px] text-zinc-500">
                {file
                  ? `${(file.size / 1024).toLocaleString("es-AR", {
                      maximumFractionDigits: 1,
                    })} KB`
                  : "Elegí un archivo .csv desde tu equipo"}
              </span>
              <input
                type="file"
                accept=".csv,text/csv"
                className="sr-only"
                disabled={uploading}
                onChange={(event) => {
                  validateFile(event.target.files?.[0] || null);
                  event.target.value = "";
                }}
              />
            </label>

            {validation && (
              <div className="rounded-lg border border-[#DCE5EE] bg-[#F7F9FC] p-2.5 text-xs">
                {validation.missing.length > 0 ? (
                  <div role="alert">
                    <p className="font-semibold text-red-700">
                      Faltan {validation.missing.length} columna(s) requerida(s)
                    </p>
                    <p className="mt-0.5 text-xs text-red-700">
                      {validation.missing.join(", ")}
                    </p>
                  </div>
                ) : validation.duplicates.length > 0 ? (
                  <p className="text-xs text-red-700">
                    Columnas duplicadas: {[...new Set(validation.duplicates)].join(", ")}
                  </p>
                ) : (
                  <p className="text-xs text-emerald-700 font-medium">
                    ¡Los 10 encabezados requeridos están presentes!
                  </p>
                )}
              </div>
            )}

            <ErrorMessage>{error}</ErrorMessage>

            <button
              type="submit"
              disabled={uploading || !file || !validation?.valid}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#315F89] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#244B70] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {uploading ? (
                <LoaderCircle size={16} className="animate-spin" />
              ) : (
                <FileCheck2 size={16} />
              )}
              {uploading ? "Analizando clientes..." : "Validar y analizar"}
            </button>
          </form>
        ) : (
          /* Si YA hay resultado, ocultamos el formulario y mostramos el resumen limpio */
          <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-800">
              <CheckCircle2 size={16} />
              Análisis completado (ID: {result.dataset_id})
            </div>

            <div className="mt-2 grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-white bg-white/80 p-2">
                <p className="text-[11px] text-zinc-500">Clientes analizados</p>
                <p className="text-lg font-bold text-[#263B52]">
                  {Number(result.total_customers || 0).toLocaleString("es-AR")}
                </p>
              </div>
              <div className="rounded-lg border border-white bg-white/80 p-2">
                <p className="text-[11px] text-zinc-500">Clientes con posible baja</p>
                <p className="text-lg font-bold text-[#263B52]">
                  {Number(result.predicted_churn || 0).toLocaleString("es-AR")}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onViewSummary}
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#315F89] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#244B70]"
            >
              Ver resumen del análisis →
            </button>
          </div>
        )}
      </section>

      {/* 3. COLUMNAS REQUERIDAS */}
      <section className="rounded-xl border border-[#DCE5EE] bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-2 border-b border-zinc-100 pb-2 mb-3">
          <div>
            <h2 className="text-sm font-bold text-[#263B52]">
              Columnas requeridas en el CSV
            </h2>
            <p className="text-xs text-zinc-500">
              Tu archivo debe contener exactamente estas 10 columnas:
            </p>
          </div>
          <span className="shrink-0 rounded-md bg-[#EAF1F8] px-2 py-0.5 text-[11px] font-semibold text-[#315F89]">
            10 columnas
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {REQUIRED_COLUMNS.map(({ name, type, description }) => {
            const isMissing = validation?.missing.includes(name) ?? false;

            return (
              <div
                key={name}
                className={`rounded-md border p-2 flex flex-col justify-between ${
                  isMissing
                    ? "border-red-200 bg-red-50"
                    : "border-[#E5EAF0] bg-[#FAFBFC]"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1">
                    <code
                      className={`truncate text-[11px] font-semibold ${
                        isMissing ? "text-red-700" : "text-[#34485E]"
                      }`}
                      title={name}
                    >
                      {name}
                    </code>
                    <span className="shrink-0 rounded bg-[#EAF1F8] px-1 py-0.5 text-[8px] font-medium text-[#315F89]">
                      {type}
                    </span>
                  </div>
                  <p className="mt-1 text-[10px] leading-3 text-zinc-500 truncate" title={description}>
                    {description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-3 flex items-start gap-1.5 rounded-lg bg-[#F1F6FA] p-2.5 text-xs text-[#526B82]">
          <ShieldCheck size={16} className="shrink-0 text-[#315F89] mt-0.5" />
          <span>Los valores deben ser numéricos; para las variables binarias, utilizá 0 o 1.</span>
        </div>
      </section>
    </div>
  );
}

function Step({ number, icon, title, description }) {
  return (
    <div className="flex items-start gap-2.5 rounded-lg border border-zinc-100 bg-[#FCFDFE] p-2.5">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#EAF1F8] text-[#315F89]">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-[10px] font-bold text-[#477DA8]">
            {number}
          </span>
          <h3 className="text-xs font-bold text-[#34485E]">{title}</h3>
        </div>
        <p className="mt-0.5 text-[11px] leading-4 text-zinc-500">{description}</p>
      </div>
    </div>
  );
}