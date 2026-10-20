import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  LoaderCircle,
  UserRound,
} from "lucide-react";
import { api } from "../api";
import { RiskBadge } from "./Customers";

export default function CustomerDetail({
  datasetId,
  customerId,
  onBack,
}) {
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadCustomer = useCallback(async () => {
    if (!datasetId || !customerId) {
      setCustomer(null);
      setLoading(false);
      setError("Falta el dataset o el identificador del cliente.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await api.getCustomer(datasetId, customerId);
      setCustomer(result);
    } catch (err) {
      setCustomer(null);
      setError(err.message || "No se pudo cargar el perfil.");
    } finally {
      setLoading(false);
    }
  }, [datasetId, customerId]);

  useEffect(() => {
    loadCustomer();
  }, [loadCustomer]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] w-full items-center justify-center">
        <div className="flex items-center gap-2 rounded-xl border border-[#DCE5EE] bg-white px-5 py-4 text-sm text-zinc-500 shadow-sm">
          <LoaderCircle
            size={19}
            className="animate-spin text-[#477DA8]"
          />
          Cargando perfil del cliente...
        </div>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="flex min-h-[60vh] w-full items-center justify-center px-2 py-4">
        <div className="w-full max-w-xl space-y-3">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-zinc-600 transition hover:bg-[#EDF3F9] hover:text-[#315F89]"
          >
            <ArrowLeft size={16} />
            Volver a la cartera
          </button>

          <div className="rounded-xl border border-red-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex items-start gap-3 text-red-700">
              <AlertCircle size={19} className="mt-0.5 shrink-0" />
              <div className="min-w-0">
                <h2 className="text-sm font-semibold">
                  No se pudo cargar el perfil
                </h2>
                <p className="mt-1 break-words text-sm">
                  {error || "Cliente no encontrado."}
                </p>
              </div>
            </div>

            <button
              onClick={loadCustomer}
              className="mt-3 inline-flex items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50"
            >
              <LoaderCircle size={14} />
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  const probability = Number(customer.churn_probability);
  const features = Object.entries(customer.features || {});
  const explanation = customer.explanation || [];
  const probabilityPercent = Math.max(
    0,
    Math.min(100, Number.isFinite(probability) ? probability * 100 : 0),
  );

  return (
    <div className="flex min-h-[60vh] w-full min-w-0 flex-col justify-center py-2">
      <div className="mx-auto w-full max-w-[1200px] min-w-0 space-y-4 px-1 sm:px-2">
        {/* Navegación */}
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-semibold text-zinc-600 transition hover:bg-[#EDF3F9] hover:text-[#315F89] sm:text-sm"
        >
          <ArrowLeft size={16} />
          Volver a la cartera
        </button>

        {/* Encabezado */}
        <header>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#477DA8]">
            Módulo 04
          </p>

          <h1 className="mt-1 text-xl font-bold tracking-tight text-[#24364B] sm:text-2xl">
            Perfil del cliente
          </h1>

          <p className="mt-1 break-all text-xs text-zinc-500">
            Dataset: {datasetId}
          </p>
        </header>

        {/* Identidad y resultados */}
        <section className="rounded-xl border border-[#DCE5EE] bg-white p-4 shadow-sm sm:p-5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EAF1F8] text-[#315F89]">
              <UserRound size={23} />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                Identificador
              </p>

              <h2 className="mt-0.5 break-all text-base font-bold text-[#263B52] sm:text-lg">
                {customer.customer_id}
              </h2>

              <div className="mt-1.5">
                <RiskBadge value={customer.risk_level} />
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="min-w-0 rounded-lg border border-[#DCE5EE] bg-[#F5F8FB] p-3.5">
              <p className="text-xs text-zinc-500">
                Probabilidad de abandono
              </p>

              <p className="mt-1.5 text-2xl font-bold tabular-nums text-[#263B52]">
                {Number.isFinite(probability)
                  ? `${(probability * 100).toLocaleString("es-AR", {
                      maximumFractionDigits: 2,
                    })}%`
                  : "No disponible"}
              </p>

              <div
                className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-[#E3EAF1]"
                role="progressbar"
                aria-label="Probabilidad de abandono"
                aria-valuenow={Number(probabilityPercent.toFixed(2))}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#315F89] to-[#739BBC] transition-all duration-500"
                  style={{ width: `${probabilityPercent}%` }}
                />
              </div>
            </div>

            <div className="min-w-0 rounded-lg border border-[#DCE5EE] bg-[#F5F8FB] p-3.5">
              <p className="text-xs text-zinc-500">Resultado del modelo</p>

              <p className="mt-1.5 break-words text-xl font-bold text-[#263B52]">
                {Number(customer.prediction) === 1
                  ? "Abandono"
                  : "Permanencia"}
              </p>

              <p className="mt-1 text-xs leading-5 text-zinc-500">
                Predicción generada por el modelo de churn.
              </p>
            </div>
          </div>
        </section>

        {/* Explicabilidad individual */}
        <section className="rounded-xl border border-[#DCE5EE] bg-white p-4 shadow-sm sm:p-5">
          <div>
            <h2 className="text-sm font-bold text-[#263B52] sm:text-base">
              Factores asociados a la predicción
            </h2>

            <p className="mt-1 text-xs leading-5 text-zinc-500">
              Contribuciones individuales proporcionadas por el modelo, cuando
              están disponibles.
            </p>
          </div>

          {explanation.length > 0 ? (
            <div className="mt-3 grid grid-cols-1 gap-2 lg:grid-cols-2">
              {explanation.map((item, index) => {
                const contribution = Number(item.contribution);
                const positive =
                  item.direction === "positive" ||
                  (Number.isFinite(contribution) && contribution > 0);

                return (
                  <div
                    key={`${item.feature}-${index}`}
                    className="flex min-w-0 items-center justify-between gap-3 rounded-lg border border-zinc-100 bg-[#F8FAFC] p-3"
                  >
                    <div className="min-w-0">
                      <p className="break-words text-sm font-medium text-zinc-800">
                        {item.feature}
                      </p>

                      <p className="mt-1 break-words text-xs text-zinc-500">
                        Valor del cliente: {formatValue(item.value)}
                      </p>
                    </div>

                    <div className="shrink-0 text-right">
                      <p
                        className={`text-xs font-semibold ${
                          positive ? "text-red-700" : "text-emerald-700"
                        }`}
                      >
                        {positive
                          ? "Contribución positiva"
                          : "Contribución negativa"}
                      </p>

                      <p className="mt-1 text-xs tabular-nums text-zinc-500">
                        {formatValue(item.contribution)}
                      </p>
                    </div>
                  </div>
                );
              })}

              <p className="text-[11px] leading-5 text-zinc-400 lg:col-span-2">
                La dirección y magnitud de las contribuciones deben
                interpretarse según el método explicativo utilizado por el
                modelo.
              </p>
            </div>
          ) : (
            <div className="mt-3 rounded-lg border border-dashed border-[#DCE5EE] bg-[#F8FAFC] p-3 text-xs leading-5 text-zinc-500">
              No hay información de interpretabilidad individual disponible
              para este cliente.
            </div>
          )}
        </section>

        {/* Variables del cliente */}
        <section className="rounded-xl border border-[#DCE5EE] bg-white p-4 shadow-sm sm:p-5">
          <div>
            <h2 className="text-sm font-bold text-[#263B52] sm:text-base">
              Datos del cliente
            </h2>

            <p className="mt-1 text-xs text-zinc-500">
              Variables disponibles en el resultado procesado.
            </p>
          </div>

          {features.length > 0 ? (
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {features.map(([name, value]) => (
                <div
                  key={name}
                  className="min-w-0 rounded-lg border border-zinc-100 bg-[#F8FAFC] px-3 py-2.5"
                >
                  <p className="break-words text-[11px] text-zinc-500">
                    {name}
                  </p>

                  <p className="mt-1 break-words text-sm font-semibold text-[#34485E]">
                    {formatValue(value)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 rounded-lg bg-zinc-50 p-3 text-xs text-zinc-500">
              El backend no devolvió variables adicionales para este cliente.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}

function formatValue(value) {
  if (value === null || value === undefined || value === "") {
    return "No disponible";
  }

  if (typeof value === "number") {
    return Number.isFinite(value)
      ? value.toLocaleString("es-AR", { maximumFractionDigits: 4 })
      : "No disponible";
  }

  return String(value);
}