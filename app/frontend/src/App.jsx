import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  ArrowUpRight,
  Database,
  LayoutDashboard,
  Menu,
  RefreshCw,
  UserRoundSearch,
  Users,
  X,
} from "lucide-react";

import { api } from "./api";
import Dashboard from "./modules/Dashboard";
import Datasets from "./modules/Datasets";
import Customers from "./modules/Customers";
import CustomerDetail from "./modules/CustomerDetail";
import IndividualPrediction from "./modules/IndividualPrediction";

const navigation = [
  { id: "datasets", label: "Datos y datasets", icon: Database },
  { id: "dashboard", label: "Dashboard de churn", icon: LayoutDashboard },
  { id: "customers", label: "Cartera de clientes", icon: Users },
  {
    id: "individual",
    label: "Evaluación individual",
    icon: UserRoundSearch,
  },
];

export default function App() {
  const [activeModule, setActiveModule] = useState("datasets");
  const [datasetId, setDatasetId] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [initialRisk, setInitialRisk] = useState("ALL");

  const [health, setHealth] = useState("checking");
  const [healthError, setHealthError] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const checkHealth = useCallback(async () => {
    setHealth("checking");
    setHealthError("");

    try {
      await api.health();
      setHealth("online");
    } catch (error) {
      setHealth("offline");
      setHealthError(error.message || "No se pudo conectar con la API.");
    }
  }, []);

  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  function navigate(module) {
    setActiveModule(module);
    setSelectedCustomerId("");
    setInitialRisk("ALL");
    setMobileMenuOpen(false);
  }

  function handleDatasetReady(id) {
    setDatasetId(id);
    setSelectedCustomerId("");
    setInitialRisk("ALL");
  }

  function openCustomers(risk = "ALL") {
    setInitialRisk(risk);
    setSelectedCustomerId("");
    setActiveModule("customers");
    setMobileMenuOpen(false);
  }

  function openCustomer(customerId) {
    setSelectedCustomerId(customerId);
    setActiveModule("customer-detail");
    setMobileMenuOpen(false);
  }

  const activeNavigation = navigation.find(
    (item) => item.id === activeModule
  );

  const pageTitle =
    activeModule === "customer-detail"
      ? "Perfil del cliente"
      : activeNavigation?.label || "Churn Intelligence";

  const statusLabel =
    health === "online"
      ? "Conectado"
      : health === "offline"
        ? "Sin conexión"
        : "Verificando";

  const statusColors =
    health === "online"
      ? "bg-emerald-500"
      : health === "offline"
        ? "bg-red-500"
        : "bg-amber-400";

  return (
    <div className="min-h-screen bg-[#F3F6FA] text-[#24364B]">
      {/* Fondo del menú móvil */}
      {mobileMenuOpen && (
        <button
          type="button"
          aria-label="Cerrar menú"
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-[2px] lg:hidden"
        />
      )}

      {/* Navegación lateral */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[min(17rem,85vw)] flex-col border-r border-[#DCE5EE] bg-white transition-transform duration-200 ease-out lg:translate-x-0 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-[68px] shrink-0 items-center justify-between border-b border-[#E8EDF3] px-4 sm:px-5">
          <button
            type="button"
            onClick={() => navigate("datasets")}
            className="flex min-w-0 items-center gap-3 rounded-lg text-left outline-none focus-visible:ring-2 focus-visible:ring-[#477DA8]"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#315F89] text-white shadow-sm">
              <Activity size={21} strokeWidth={2.2} />
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-bold tracking-tight text-[#24364B]">
                Churn Intelligence
              </p>
              <p className="mt-0.5 text-[11px] text-slate-500">
                Customer analytics
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Cerrar menú"
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 lg:hidden"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-3 pt-5 sm:px-4 sm:pt-6">
          <p className="px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
            Análisis de churn
          </p>

          <nav aria-label="Navegación principal" className="mt-2 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active =
                activeModule === item.id ||
                (activeModule === "customer-detail" &&
                  item.id === "customers");

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigate(item.id)}
                  aria-current={active ? "page" : undefined}
                  className={`group flex min-h-10 w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[13px] font-medium transition-colors ${
                    active
                      ? "bg-[#EAF1F8] text-[#315F89]"
                      : "text-slate-600 hover:bg-slate-50 hover:text-[#24364B]"
                  }`}
                >
                  <Icon
                    size={18}
                    strokeWidth={active ? 2.2 : 1.8}
                    className="shrink-0"
                  />

                  <span className="min-w-0 flex-1">{item.label}</span>

                  {active && (
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#477DA8]" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Estado del servicio */}
        <div className="mt-auto border-t border-[#E8EDF3] p-3 sm:p-4">
          <div className="rounded-xl border border-[#E5EBF2] bg-[#F7F9FC] p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-slate-600">
                Estado del backend
              </span>

              <span
                className={`h-2 w-2 shrink-0 rounded-full ${statusColors} ${
                  health === "checking" ? "animate-pulse" : ""
                }`}
              />
            </div>

            <p className="mt-1.5 text-sm font-semibold text-[#24364B]">
              {statusLabel}
            </p>

            {health === "offline" && (
              <p className="mt-1 break-words text-xs leading-4 text-red-700">
                {healthError}
              </p>
            )}

            <button
              type="button"
              onClick={checkHealth}
              disabled={health === "checking"}
              className="mt-2.5 inline-flex min-h-8 items-center gap-2 rounded-md text-xs font-semibold text-[#315F89] transition hover:text-[#24364B] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                size={13}
                className={health === "checking" ? "animate-spin" : ""}
              />
              Comprobar conexión
            </button>
          </div>

          <p className="px-2 pt-3 text-[10px] text-slate-400">
            Churn Intelligence SaaS · 2026
          </p>
        </div>
      </aside>

      {/* Contenido principal */}
      <div className="min-h-screen min-w-0 lg:pl-68">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-[#DCE5EE] bg-white/95 px-3 backdrop-blur-md sm:px-5 lg:h-[60px] lg:px-7">
          <div className="flex min-w-0 items-center gap-2.5">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Abrir menú"
              aria-expanded={mobileMenuOpen}
              className="shrink-0 rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 lg:hidden"
            >
              <Menu size={20} />
            </button>

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[#24364B] sm:text-[15px]">
                {pageTitle}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <span
              className={`hidden items-center gap-2 rounded-full px-2.5 py-1.5 text-[11px] font-semibold sm:inline-flex ${
                health === "online"
                  ? "bg-emerald-50 text-emerald-700"
                  : health === "offline"
                    ? "bg-red-50 text-red-700"
                    : "bg-amber-50 text-amber-700"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${statusColors}`}
              />
              API {health === "online" ? "online" : health === "offline" ? "offline" : "verificando"}
            </span>

            <button
              type="button"
              onClick={checkHealth}
              disabled={health === "checking"}
              aria-label="Actualizar estado de la API"
              title="Comprobar estado de la API"
              className="rounded-lg border border-[#DCE5EE] p-2 text-slate-500 transition hover:bg-[#F3F6FA] hover:text-[#315F89] disabled:opacity-60"
            >
              <RefreshCw
                size={15}
                className={health === "checking" ? "animate-spin" : ""}
              />
            </button>
          </div>
        </header>

        <main className="mx-auto flex min-h-[calc(100dvh-3.5rem)] w-full max-w-[1600px] flex-col px-3 py-4 sm:px-5 sm:py-5 lg:min-h-[calc(100dvh-3.75rem)] lg:px-7 lg:py-6">
          <div className="min-w-0 flex-1">
            {activeModule === "dashboard" && (
              <Dashboard
                datasetId={datasetId}
                onOpenCustomers={openCustomers}
                onGoToData={() => navigate("datasets")}
              />
            )}

            {activeModule === "datasets" && (
              <Datasets
                onDatasetReady={handleDatasetReady}
                onViewSummary={() => navigate("dashboard")}
              />
            )}

            {activeModule === "customers" && (
              <Customers
                datasetId={datasetId}
                initialRisk={initialRisk}
                onOpenCustomer={openCustomer}
                onGoToData={() => navigate("datasets")}
              />
            )}

            {activeModule === "customer-detail" && (
              <CustomerDetail
                datasetId={datasetId}
                customerId={selectedCustomerId}
                onBack={() => {
                  setActiveModule("customers");
                  setSelectedCustomerId("");
                }}
              />
            )}

            {activeModule === "individual" && <IndividualPrediction />}
          </div>

          <footer className="mt-6 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-[#DCE5EE] pt-3 text-[11px] text-slate-400 sm:mt-8">
            <span>Churn Intelligence SaaS</span>

            <span className="inline-flex items-center gap-1">
              Análisis predictivo
              <ArrowUpRight size={12} />
            </span>
          </footer>
        </main>
      </div>
    </div>
  );
}