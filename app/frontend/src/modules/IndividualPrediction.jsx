import { useState } from "react";
import {
  AlertCircle,
  BrainCircuit,
  LoaderCircle,
  UserRoundSearch,
} from "lucide-react";
import { api } from "../api";

const initialCustomer = {
  account_weeks: "100",
  contract_renewal: "1",
  data_plan: "1",
  data_usage: "2.5",
  cust_serv_calls: "1",
  day_mins: "180",
  day_calls: "100",
  monthly_charge: "65",
  overage_fee: "10",
  roam_mins: "5",
};

const fields = [
  ["account_weeks", "Antigüedad (semanas)"],
  ["contract_renewal", "Renueva contrato (0/1)"],
  ["data_plan", "Tiene plan de datos (0/1)"],
  ["data_usage", "Consumo de datos"],
  ["cust_serv_calls", "Llamadas a atención"],
  ["day_mins", "Minutos de llamadas"],
  ["day_calls", "Cantidad de llamadas"],
  ["monthly_charge", "Cargo mensual"],
  ["overage_fee", "Cargo excedente"],
  ["roam_mins", "Minutos roaming"],
];

function ErrorMessage({ children }) {
  if (!children) return null;

  return (
    <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
      <AlertCircle size={17} className="mt-0.5 shrink-0" />
      <span className="min-w-0 break-words">{children}</span>
    </div>
  );
}

export default function IndividualPrediction() {
  const [customer, setCustomer] = useState(initialCustomer);
  const [predicting, setPredicting] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [error, setError] = useState("");

  function updateCustomer(event) {
    const { name, value } = event.target;

    setCustomer((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setPrediction(null);

    const payload = {};

    for (const [name, label] of fields) {
      const rawValue = customer[name];
      const value = Number(rawValue);

      if (
        rawValue.trim() === "" ||
        !Number.isFinite(value) ||
        value < 0
      ) {
        setError(
          `Revisá el campo "${label}". Ingresá un número válido no negativo.`,
        );
        return;
      }

      payload[name] = value;
    }

    for (const name of ["contract_renewal", "data_plan"]) {
      if (![0, 1].includes(payload[name])) {
        setError(
          "Los campos de contrato y plan de datos deben tener valor 0 o 1.",
        );
        return;
      }
    }

    setPredicting(true);

    try {
      const result = await api.predictCustomer(payload);
      setPrediction(result);
    } catch (err) {
      setError(err.message || "No se pudo realizar la predicción.");
    } finally {
      setPredicting(false);
    }
  }

  return (
    <div className="flex min-h-[60vh] w-full min-w-0 flex-col justify-center py-2">
      <div className="mx-auto w-full max-w-[1100px] min-w-0 space-y-4 px-1 sm:px-2">
        <header>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#477DA8]">
            Evaluación de clientes
          </p>

          <h1 className="mt-1 text-xl font-bold tracking-tight text-[#24364B] sm:text-2xl">
            Evaluación individual
          </h1>

          <p className="mt-1 max-w-2xl text-xs leading-5 text-zinc-500 sm:text-sm">
            Estimá el riesgo de abandono de un cliente sin necesidad de cargar
            una cartera completa.
          </p>
        </header>

        <section className="rounded-xl border border-[#DCE5EE] bg-white p-4 shadow-sm sm:p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#EAF1F8] text-[#315F89]">
              <UserRoundSearch size={19} />
            </div>

            <div className="min-w-0">
              <h2 className="text-sm font-bold text-[#263B52]">
                Características del cliente
              </h2>

              <p className="mt-1 text-xs leading-5 text-zinc-500">
                Los valores iniciales son ejemplos editables, no datos de un
                cliente real.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-4">
            <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {fields.map(([name, label]) => (
                <label key={name} className="block min-w-0">
                  <span className="mb-1 block text-xs font-medium text-zinc-600">
                    {label}
                  </span>

                  <input
                    type="number"
                    step="any"
                    min="0"
                    required
                    name={name}
                    value={customer[name]}
                    onChange={updateCustomer}
                    className="w-full min-w-0 rounded-lg border border-[#D5DFE9] bg-white px-3 py-2 text-sm text-[#263B52] outline-none transition placeholder:text-zinc-400 focus:border-[#477DA8] focus:ring-2 focus:ring-[#477DA8]/15"
                  />
                </label>
              ))}
            </div>

            {error && (
              <div className="mt-3">
                <ErrorMessage>{error}</ErrorMessage>
              </div>
            )}

            <div className="mt-4 flex flex-col gap-2 border-t border-zinc-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[11px] text-zinc-400">
                Completá los campos para ejecutar la evaluación.
              </p>

              <button
                type="submit"
                disabled={predicting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#315F89] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#274C6D] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                {predicting ? (
                  <LoaderCircle size={17} className="animate-spin" />
                ) : (
                  <BrainCircuit size={17} />
                )}

                {predicting
                  ? "Evaluando cliente..."
                  : "Evaluar riesgo de churn"}
              </button>
            </div>
          </form>
        </section>

        {prediction && (
          <section
            aria-live="polite"
            className="rounded-xl border border-[#DCE5EE] bg-white p-4 shadow-sm sm:p-5"
          >
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#477DA8]">
                Resultado del modelo
              </p>

              <h2 className="mt-1 text-lg font-bold text-[#263B52]">
                Evaluación completada
              </h2>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <ResultCard
                label="Probabilidad de churn"
                value={formatPercent(prediction.churn_probability)}
              />

              <ResultCard
                label="Nivel de riesgo"
                value={formatRisk(prediction.risk_level)}
              />

              <ResultCard
                label="Predicción"
                value={
                  Number(prediction.prediction) === 1
                    ? "Abandono"
                    : "Permanencia"
                }
              />
            </div>

            {prediction.explanation?.length > 0 ? (
              <div className="mt-4">
                <h3 className="text-sm font-bold text-[#263B52]">
                  Factores explicativos
                </h3>

                <p className="mt-1 text-xs text-zinc-500">
                  Variables y contribuciones devueltas por el modelo.
                </p>

                <div className="mt-3 grid grid-cols-1 gap-2 lg:grid-cols-2">
                  {prediction.explanation.map((item, index) => (
                    <div
                      key={`${item.feature}-${index}`}
                      className="flex min-w-0 items-center justify-between gap-3 rounded-lg border border-zinc-100 bg-[#F8FAFC] p-3"
                    >
                      <div className="min-w-0">
                        <p className="break-words text-sm font-medium text-zinc-800">
                          {item.feature}
                        </p>

                        {item.direction && (
                          <p className="mt-1 text-xs text-zinc-500">
                            Dirección: {item.direction}
                          </p>
                        )}
                      </div>

                      <div className="shrink-0 text-right">
                        <p className="text-[10px] text-zinc-500">
                          Contribución
                        </p>
                        <p className="mt-1 text-sm font-semibold tabular-nums text-[#315F89]">
                          {formatNumber(item.contribution)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="mt-3 rounded-lg bg-zinc-50 p-3 text-xs leading-5 text-zinc-600">
                El modelo no devolvió factores explicativos para esta
                evaluación.
              </p>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

function ResultCard({ label, value }) {
  return (
    <div className="min-w-0 rounded-lg border border-[#DCE5EE] bg-[#F5F8FB] p-3">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-1.5 break-words text-lg font-bold text-[#263B52] sm:text-xl">
        {value}
      </p>
    </div>
  );
}

function formatPercent(value) {
  const number = Number(value);

  return Number.isFinite(number)
    ? `${(number * 100).toLocaleString("es-AR", {
        maximumFractionDigits: 1,
      })}%`
    : "No disponible";
}

function formatNumber(value) {
  const number = Number(value);

  return Number.isFinite(number)
    ? number.toLocaleString("es-AR", {
        maximumFractionDigits: 4,
      })
    : "No disponible";
}

function formatRisk(value) {
  const labels = {
    HIGH: "Alto",
    MEDIUM: "Medio",
    LOW: "Bajo",
  };

  return labels[String(value || "").toUpperCase()] || value || "No disponible";
}