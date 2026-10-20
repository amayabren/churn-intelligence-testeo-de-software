import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  Search,
  SlidersHorizontal,
  Users,
} from "lucide-react";
import { api } from "../api";

const PAGE_SIZE = 10;

export default function Customers({
  datasetId,
  initialRisk = "ALL",
  onOpenCustomer,
  onGoToData,
}) {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [risk, setRisk] = useState(initialRisk);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setRisk(initialRisk);
    setPage(1);
  }, [initialRisk, datasetId]);

  const loadCustomers = useCallback(async () => {
    if (!datasetId) {
      setItems([]);
      setTotal(0);
      setLoading(false);
      setError("");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await api.listCustomers(datasetId, {
        risk,
        search,
        page,
        pageSize: PAGE_SIZE,
      });

      setItems(result.items || []);
      setTotal(Number(result.total) || 0);
    } catch (err) {
      setItems([]);
      setTotal(0);
      setError(err.message || "No se pudo cargar la cartera.");
    } finally {
      setLoading(false);
    }
  }, [datasetId, risk, search, page]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  if (!datasetId) {
    return (
      <div className="flex min-h-[55vh] w-full items-center justify-center px-3 py-6">
        <section className="w-full max-w-xl rounded-2xl border border-[#DCE5EE] bg-white p-5 text-center shadow-sm sm:p-8">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#EAF1F8] text-[#315F89]">
            <Users size={24} />
          </div>

          <h1 className="mt-4 text-lg font-bold tracking-tight text-[#263B52] sm:text-xl">
            Todavía no hay una cartera para consultar
          </h1>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-500">
            Incorporá una base de clientes y procesala para consultar sus
            predicciones, buscar registros y filtrar por nivel de riesgo.
          </p>

          <button
            onClick={onGoToData}
            className="mt-4 inline-flex items-center justify-center gap-2 rounded-lg bg-[#315F89] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#244B70]"
          >
            Incorporar datos
          </button>
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1440px] min-w-0 space-y-4 px-1 sm:space-y-5 sm:px-2">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#477DA8]">
            Análisis de clientes
          </p>
          <h1 className="mt-0.5 text-xl font-bold tracking-tight text-[#263B52] sm:text-2xl">
            Clientes
          </h1>
          <p className="mt-1 text-xs text-zinc-500 sm:text-sm">
            Explorá la cartera y consultá el riesgo de cada cliente.
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2 rounded-lg border border-[#DCE5EE] bg-white px-3 py-2 text-xs text-zinc-600">
          <Users size={15} className="text-[#477DA8]" />
          <span className="font-semibold tabular-nums">
            {total.toLocaleString("es-AR")}
          </span>
          <span>clientes</span>
        </div>
      </header>

      <section className="rounded-xl border border-[#DCE5EE] bg-white p-3 shadow-sm sm:p-4">
        <div className="grid grid-cols-1 gap-2.5 md:grid-cols-[minmax(0,1fr)_210px]">
          <label className="relative block min-w-0">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
            />
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Buscar por ID de cliente..."
              className="w-full rounded-lg border border-zinc-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none transition placeholder:text-zinc-400 focus:border-[#477DA8] focus:ring-2 focus:ring-[#477DA8]/15"
            />
          </label>

          <label className="relative block min-w-0">
            <SlidersHorizontal
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
            />
            <select
              value={risk}
              onChange={(event) => {
                setRisk(event.target.value);
                setPage(1);
              }}
              className="w-full appearance-none rounded-lg border border-zinc-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-[#477DA8] focus:ring-2 focus:ring-[#477DA8]/15"
            >
              <option value="ALL">Todos los riesgos</option>
              <option value="HIGH">Riesgo alto</option>
              <option value="MEDIUM">Riesgo medio</option>
              <option value="LOW">Riesgo bajo</option>
            </select>
          </label>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-zinc-100 pt-2.5">
          <span className="text-xs text-zinc-500">
            {loading ? "Actualizando resultados..." : `${items.length} registros en esta página`}
          </span>
          <span
            title={datasetId}
            className="max-w-full truncate font-mono text-[10px] text-zinc-400 sm:max-w-[50%] sm:text-xs"
          >
            Dataset: {datasetId}
          </span>
        </div>
      </section>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle size={17} className="mt-0.5 shrink-0" />
          <span className="min-w-0 flex-1 break-words">{error}</span>
          <button
            onClick={loadCustomers}
            className="shrink-0 text-xs font-semibold underline"
          >
            Reintentar
          </button>
        </div>
      )}

      <section className="overflow-hidden rounded-xl border border-[#DCE5EE] bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[650px] text-left text-sm">
            <thead className="border-b border-[#DCE5EE] bg-[#F4F7FA] text-[10px] uppercase tracking-wider text-zinc-500 sm:text-xs">
              <tr>
                <th className="px-4 py-3 font-semibold">Cliente</th>
                <th className="px-4 py-3 font-semibold">Predicción</th>
                <th className="px-4 py-3 font-semibold">Probabilidad</th>
                <th className="px-4 py-3 font-semibold">Riesgo</th>
                <th className="px-4 py-3 text-right font-semibold">Perfil</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-zinc-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center">
                    <LoaderCircle
                      className="mx-auto animate-spin text-[#477DA8]"
                      size={22}
                    />
                    <p className="mt-2 text-xs text-zinc-500">
                      Consultando clientes...
                    </p>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center">
                    <Users size={23} className="mx-auto text-zinc-400" />
                    <p className="mt-2 text-sm font-semibold text-zinc-700">
                      No se encontraron clientes
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      Probá con otro filtro o término de búsqueda.
                    </p>
                  </td>
                </tr>
              ) : (
                items.map((customer) => (
                  <tr
                    key={customer.customer_id}
                    className="transition-colors hover:bg-[#F6F9FC]"
                  >
                    <td className="px-4 py-3">
                      <span className="font-medium text-[#263B52]">
                        {customer.customer_id}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-xs text-zinc-600 sm:text-sm">
                      {Number(customer.prediction) === 1
                        ? "Abandono"
                        : "Permanencia"}
                    </td>

                    <td className="px-4 py-3">
                      <Probability value={customer.churn_probability} />
                    </td>

                    <td className="px-4 py-3">
                      <RiskBadge value={customer.risk_level} />
                    </td>

                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => onOpenCustomer(customer.customer_id)}
                        className="whitespace-nowrap rounded-md px-2.5 py-1.5 text-xs font-semibold text-[#315F89] transition hover:bg-[#EAF1F8] sm:text-sm"
                      >
                        Ver perfil →
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-[#DCE5EE] bg-[#FCFDFE] px-3 py-2.5 sm:px-4">
          <span className="text-xs tabular-nums text-zinc-500">
            Página {page} de {totalPages}
          </span>

          <div className="flex items-center gap-2">
            <button
              disabled={loading || page <= 1}
              onClick={() => setPage((current) => current - 1)}
              className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-2 text-xs font-medium text-zinc-700 transition hover:bg-[#F1F5F9] disabled:cursor-not-allowed disabled:opacity-40 sm:px-3 sm:text-sm"
            >
              <ChevronLeft size={15} />
              Anterior
            </button>

            <button
              disabled={loading || page >= totalPages}
              onClick={() => setPage((current) => current + 1)}
              className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-2 text-xs font-medium text-zinc-700 transition hover:bg-[#F1F5F9] disabled:cursor-not-allowed disabled:opacity-40 sm:px-3 sm:text-sm"
            >
              Siguiente
              <ChevronRight size={15} />
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}

export function RiskBadge({ value }) {
  const styles = {
    HIGH: "bg-red-50 text-red-700 ring-red-200",
    MEDIUM: "bg-amber-50 text-amber-800 ring-amber-200",
    LOW: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  };

  const labels = {
    HIGH: "Alto",
    MEDIUM: "Medio",
    LOW: "Bajo",
  };

  const normalized = String(value || "").toUpperCase();

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
        styles[normalized] || "bg-zinc-100 text-zinc-700 ring-zinc-200"
      }`}
    >
      {labels[normalized] || value || "Sin clasificar"}
    </span>
  );
}

function Probability({ value }) {
  const number = Number(value);

  return (
    <span className="font-semibold tabular-nums text-[#34485E]">
      {Number.isFinite(number)
        ? `${(number * 100).toLocaleString("es-AR", {
            maximumFractionDigits: 1,
          })}%`
        : "—"}
    </span>
  );
}