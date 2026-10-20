import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  AlertCircle,
  ArrowUpRight,
  CheckCircle2,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
  Users,
} from "lucide-react";
import { api } from "../api";

export default function Dashboard({ datasetId, onOpenCustomers }) {
  const [data, setData] = useState(null);
  const [interpretability, setInterpretability] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    if (!datasetId) {
      setData(null);
      setLoading(false);
      setError("");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const [dashboardResult, interpretationResult] = await Promise.all([
        api.getDashboard(datasetId),
        api.getInterpretability(),
      ]);

      setData(dashboardResult);
      setInterpretability(interpretationResult);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [datasetId]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  if (!datasetId) {
    return (
      <div className="flex min-h-[60vh] w-full items-center justify-center px-3 py-5">
        <div className="w-full max-w-xl">
          <EmptyState
            title="Todavía no hay un dataset"
            description="Cargá y procesá un CSV desde Datos y datasets para consultar los indicadores."
          />
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] w-full items-center justify-center">
        <LoadingState label="Cargando indicadores..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] w-full items-center justify-center px-3 py-5">
        <div className="w-full max-w-xl">
          <ErrorState message={error} onRetry={loadDashboard} />
        </div>
      </div>
    );
  }

  const risk = data.risk_distribution || {};
  const total = Number(data.total_customers) || 0;
  const high = Number(risk.HIGH) || 0;
  const medium = Number(risk.MEDIUM) || 0;
  const low = Number(risk.LOW) || 0;

  const cards = [
    {
      label: "Clientes analizados",
      value: formatNumber(total),
      description: "Registros procesados",
      icon: Users,
      iconStyle: "bg-[#EAF1F8] text-[#315F89]",
      accent: "border-l-[#477DA8]",
    },
    {
      label: "Churn estimado",
      value: formatNumber(data.predicted_churn),
      description: `${formatPercent(data.churn_rate)} de la cartera`,
      icon: Activity,
      iconStyle: "bg-red-50 text-red-600",
      accent: "border-l-red-400",
    },
    {
      label: "Clientes que permanecen",
      value: formatNumber(data.predicted_retention),
      description: "Predicción de permanencia",
      icon: ShieldCheck,
      iconStyle: "bg-emerald-50 text-emerald-700",
      accent: "border-l-emerald-500",
    },
    {
      label: "Probabilidad promedio",
      value: formatPercent(data.average_churn_probability),
      description: "Score medio de abandono",
      icon: Activity,
      iconStyle: "bg-indigo-50 text-indigo-700",
      accent: "border-l-indigo-400",
    },
  ];

  const features = interpretability?.features || [];
  const maxImportance = Math.max(
    ...features.map((feature) => Number(feature.importance) || 0),
    0.000001,
  );

  return (
    <div className="flex min-h-[60vh] w-full min-w-0 flex-col justify-center py-2">
      <div className="mx-auto w-full max-w-[1440px] min-w-0 space-y-4 px-1 text-zinc-800 sm:space-y-5 sm:px-2">
        {/* Encabezado */}
        <header className="flex min-w-0 flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#477DA8]">
              Módulo 02
            </p>
            <h1 className="mt-0.5 text-xl font-bold tracking-tight text-[#24364B] sm:text-2xl">
              Dashboard de churn
            </h1>
            <p className="mt-1 text-xs text-zinc-500 sm:text-sm">
              Indicadores de cartera y distribución del riesgo.
            </p>
          </div>

          <button
            onClick={loadDashboard}
            disabled={loading}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-[#D7E1EB] bg-white px-3 py-2 text-xs font-semibold text-[#315F89] shadow-sm transition hover:border-[#A8C1D9] hover:bg-[#F3F7FB] disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm"
          >
            <RefreshCw size={15} />
            Actualizar
          </button>
        </header>

        {/* Dataset activo */}
        <div className="flex min-w-0 items-center gap-3 rounded-xl border border-[#DCE5EE] bg-gradient-to-r from-[#F3F7FB] to-white px-3 py-2.5 sm:px-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#E0EAF4] text-[#315F89]">
            <Activity size={16} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              Dataset activo
            </p>
            <p className="mt-0.5 truncate font-mono text-xs text-[#34485E] sm:text-sm">
              {datasetId}
            </p>
          </div>
          <span className="hidden shrink-0 items-center gap-1.5 text-xs font-medium text-emerald-700 sm:inline-flex">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Disponible
          </span>
        </div>

        {/* Indicadores */}
        <section
          aria-label="Indicadores principales"
          className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-4"
        >
          {cards.map((card) => {
            const Icon = card.icon;

            return (
              <article
                key={card.label}
                className={`min-w-0 rounded-xl border border-zinc-200 border-l-[3px] ${card.accent} bg-white p-3.5 shadow-sm transition-shadow hover:shadow-md sm:p-4`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-medium leading-5 text-zinc-500 sm:text-[13px]">
                    {card.label}
                  </p>
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${card.iconStyle}`}
                  >
                    <Icon size={17} />
                  </span>
                </div>

                <p className="mt-2 break-words text-2xl font-bold leading-tight tracking-tight text-[#263B52] sm:text-[28px]">
                  {card.value}
                </p>

                <p className="mt-1.5 text-[11px] leading-4 text-zinc-500 sm:text-xs">
                  {card.description}
                </p>
              </article>
            );
          })}
        </section>

        {/* Análisis */}
        <div className="grid min-w-0 grid-cols-1 gap-3 lg:grid-cols-2">
          <section className="min-w-0 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-sm font-bold text-[#263B52] sm:text-base">
                  Distribución del riesgo
                </h2>
                <p className="mt-1 text-xs text-zinc-500">
                  Clasificación de clientes según el modelo.
                </p>
              </div>
              <span className="shrink-0 rounded-lg bg-[#EDF3F9] px-2 py-1 text-[10px] font-semibold text-[#315F89]">
                {formatNumber(total)} clientes
              </span>
            </div>

            <div className="mt-5 space-y-4">
              <RiskBar
                label="Alto"
                count={high}
                total={total}
                color="bg-red-500"
                textColor="text-red-600"
              />
              <RiskBar
                label="Medio"
                count={medium}
                total={total}
                color="bg-amber-400"
                textColor="text-amber-600"
              />
              <RiskBar
                label="Bajo"
                count={low}
                total={total}
                color="bg-[#477DA8]"
                textColor="text-[#315F89]"
              />
            </div>

            <button
              onClick={() => onOpenCustomers("HIGH")}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2.5 text-xs font-semibold text-red-700 transition hover:border-red-200 hover:bg-red-100 sm:w-auto sm:text-sm"
            >
              Ver clientes de riesgo alto
              <ArrowUpRight size={15} />
            </button>
          </section>

          <section className="min-w-0 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#EAF1F8] text-[#315F89]">
                <Activity size={19} />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm font-bold text-[#263B52] sm:text-base">
                  Interpretabilidad global
                </h2>
                <p className="mt-1 text-xs leading-5 text-zinc-500">
                  Variables con mayor importancia para el modelo.
                </p>
              </div>
            </div>

            {interpretability?.available && features.length > 0 ? (
              <div className="mt-4 space-y-3">
                {features.slice(0, 8).map((item) => {
                  const value = Number(item.importance) || 0;
                  const width = Math.max(
                    0,
                    Math.min(100, (value / maxImportance) * 100),
                  );

                  return (
                    <div key={item.feature} className="min-w-0">
                      <div className="mb-1 flex min-w-0 items-center justify-between gap-3 text-xs">
                        <span className="min-w-0 truncate font-medium text-zinc-700">
                          {item.feature}
                        </span>
                        <span className="shrink-0 font-mono text-[11px] text-zinc-500">
                          {value.toFixed(4)}
                        </span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-[#EDF1F5]">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#315F89] to-[#739BBC] transition-all duration-500"
                          style={{ width: `${width}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="mt-4 rounded-lg border border-dashed border-zinc-200 bg-zinc-50 px-3 py-4 text-xs leading-5 text-zinc-500">
                La interpretabilidad global no está disponible para el modelo
                actual.
              </div>
            )}

            <p className="mt-4 border-t border-zinc-100 pt-3 text-[10px] leading-4 text-zinc-400 sm:text-[11px]">
              La importancia global describe el modelo; no equivale a la
              explicación individual de un cliente.
            </p>
          </section>
        </div>

        {/* Estado del análisis */}
        <section className="flex min-w-0 items-start gap-3 rounded-xl border border-[#D8E5F0] bg-[#F1F6FA] px-3.5 py-3 sm:px-4">
          <CheckCircle2
            className="mt-0.5 shrink-0 text-[#477DA8]"
            size={18}
          />
          <div className="min-w-0">
            <h2 className="text-xs font-bold text-[#294C6D] sm:text-sm">
              Dataset listo para análisis
            </h2>
            <p className="mt-1 text-xs leading-5 text-[#526B82]">
              Buscá clientes, filtrá por nivel de riesgo y consultá el perfil
              de cada predicción.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

function RiskBar({ label, count, total, color, textColor }) {
  const percent = total > 0 ? (count / total) * 100 : 0;

  return (
    <div className="min-w-0">
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <span className={`text-xs font-semibold ${textColor}`}>{label}</span>
        <span className="text-xs tabular-nums text-zinc-600">
          {formatNumber(count)}{" "}
          <span className="text-zinc-400">· {percent.toFixed(1)}%</span>
        </span>
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-zinc-100"
        role="progressbar"
        aria-label={`Riesgo ${label.toLowerCase()}`}
        aria-valuenow={Number(percent.toFixed(1))}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

function EmptyState({ title, description }) {
  return (
    <div className="rounded-xl border border-dashed border-[#C8D7E5] bg-white px-5 py-7 text-center shadow-sm">
      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-[#EAF1F8] text-[#477DA8]">
        <Activity size={22} />
      </div>
      <h2 className="mt-3 text-sm font-bold text-[#263B52]">{title}</h2>
      <p className="mx-auto mt-1.5 max-w-md text-xs leading-5 text-zinc-500 sm:text-sm">
        {description}
      </p>
    </div>
  );
}

function LoadingState({ label }) {
  return (
    <div className="flex items-center justify-center gap-2 rounded-xl border border-[#DCE5EE] bg-white px-6 py-8 text-xs text-zinc-500 shadow-sm sm:text-sm">
      <LoaderCircle className="animate-spin text-[#477DA8]" size={19} />
      {label}
    </div>
  );
}

function ErrorState({ message, onRetry }) {
  return (
    <div className="rounded-xl border border-red-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-start gap-3 text-red-700">
        <AlertCircle size={19} className="mt-0.5 shrink-0" />
        <div className="min-w-0">
          <h2 className="text-sm font-semibold">
            No se pudo cargar el dashboard
          </h2>
          <p className="mt-1 break-words text-xs leading-5 sm:text-sm">
            {message}
          </p>
        </div>
      </div>
      <button
        onClick={onRetry}
        className="mt-3 inline-flex items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50"
      >
        <RefreshCw size={14} />
        Reintentar
      </button>
    </div>
  );
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString("es-AR");
}

function formatPercent(value) {
  const number = Number(value);

  return Number.isFinite(number)
    ? `${(number * 100).toLocaleString("es-AR", {
        maximumFractionDigits: 1,
      })}%`
    : "—";
}