import { useState, useEffect } from "react";
import {
  AlertTriangle,
  Search,
  Trash2,
  Loader2,
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  Info,
  Filter,
} from "lucide-react";
import { adminApi } from "../../lib/api";
import { cn } from "../../lib/utils";

interface AlertRow {
  id: number;
  title: string;
  message: string;
  severity: string;
  user: string;
  userId: number;
  time: string;
  read: boolean;
}

export default function AdminAlerts() {
  const [alerts, setAlerts] = useState<AlertRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState("");
  const [search, setSearch] = useState("");
  const [pageError, setPageError] = useState("");

  const fetchAlerts = () => {
    setLoading(true);
    setPageError("");
    adminApi
      .getAlerts({ severity: severityFilter })
      .then((res) => setAlerts(res.data))
      .catch((error) => {
        console.error("Failed to load alerts:", error);
        setPageError("Unable to load alerts. Please try again.");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAlerts();
  }, [severityFilter]);

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this alert?")) return;
    setPageError("");
    try {
      await adminApi.deleteAlert(id);
      setAlerts((prev) => prev.filter((a) => a.id !== id));
    } catch {
      setPageError("Unable to delete this alert. Please try again.");
    }
  };

  const filteredAlerts = alerts.filter((alert) => {
    const query = search.trim().toLowerCase();
    return (
      !query ||
      [alert.title, alert.message, alert.user, alert.severity]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  });

  const severityConfig: Record<string, { icon: typeof AlertTriangle; cls: string; bg: string }> = {
    warning: { icon: AlertTriangle, cls: "text-amber-600", bg: "bg-amber-100" },
    critical: { icon: XCircle, cls: "text-red-600", bg: "bg-red-100" },
    success: { icon: CheckCircle2, cls: "text-emerald-600", bg: "bg-emerald-100" },
    info: { icon: Info, cls: "text-blue-600", bg: "bg-blue-100" },
  };

  return (
    <div className="min-w-0 space-y-5 pb-6 sm:space-y-6">
      {/* Header */}
      <div className="flex min-w-0 flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight text-slate-900 sm:gap-3 sm:text-3xl">
            <AlertTriangle
              className="shrink-0 text-emerald-600"
              size={25}
            />
            Alert Management
          </h1>
          <p className="mt-1 text-xs text-slate-500 sm:text-sm">
            View and manage system-wide alerts
          </p>
        </div>
        <div className="inline-flex items-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 sm:self-auto">
          <AlertTriangle size={18} />
          {alerts.length} Alerts
        </div>
      </div>

      <div className="relative w-full max-w-md">
        <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search alerts..."
          aria-label="Search alerts"
          className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-800 shadow-sm placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
        />
      </div>

      {pageError && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700">
          <span>{pageError}</span>
          <button type="button" onClick={fetchAlerts} className="font-semibold underline">
            Retry
          </button>
        </div>
      )}

      {/* Severity filter */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: "", label: "All", icon: <Filter size={14} /> },
          { key: "critical", label: "Critical", icon: <XCircle size={14} /> },
          { key: "warning", label: "Warning", icon: <AlertTriangle size={14} /> },
          { key: "success", label: "Success", icon: <CheckCircle2 size={14} /> },
          { key: "info", label: "Info", icon: <Info size={14} /> },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setSeverityFilter(f.key)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition sm:px-4 sm:text-sm",
              severityFilter === f.key
                ? "border-emerald-700 bg-emerald-700 text-white"
                : "bg-white text-slate-600 border-slate-200 hover:border-emerald-300 hover:text-emerald-700"
            )}
          >
            {f.icon}
            {f.label}
          </button>
        ))}
      </div>

      {/* Alert List */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAlerts.map((alert) => {
            const cfg = severityConfig[alert.severity] || severityConfig.info;
            const Icon = cfg.icon;
            return (
              <div
                key={alert.id}
                className="group flex min-w-0 gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-emerald-200 hover:shadow-md sm:gap-4 sm:p-5"
              >
                <div
                  className={cn(
                    "mt-1 p-2.5 rounded-xl h-fit shrink-0",
                    cfg.bg,
                    cfg.cls
                  )}
                >
                  <Icon size={20} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="break-words font-semibold text-slate-900">
                      {alert.title}
                    </h3>
                    <span
                      className={cn(
                        "px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase border",
                        alert.severity === "critical"
                          ? "bg-red-50 text-red-600 border-red-100"
                          : alert.severity === "warning"
                          ? "bg-amber-50 text-amber-600 border-amber-100"
                          : alert.severity === "success"
                          ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                          : "bg-blue-50 text-blue-600 border-blue-100"
                      )}
                    >
                      {alert.severity}
                    </span>
                  </div>
                  <p className="mb-2 break-words text-sm leading-relaxed text-slate-600">
                    {alert.message}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-slate-400 font-medium">
                    <span className="flex items-center gap-1">
                      <Users size={12} /> {alert.user}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} /> {alert.time}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleDelete(alert.id)}
                  className="self-center rounded-xl p-2.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600 sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100"
                  title="Delete alert"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            );
          })}
          {filteredAlerts.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="h-20 w-20 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                <CheckCircle2 size={36} className="text-emerald-400" />
              </div>
              <h3 className="mb-1 text-lg font-semibold text-slate-700">
                No alerts found
              </h3>
              <p className="text-slate-500 text-sm">
                {search || severityFilter
                  ? "No alerts match the current search or filter."
                  : "Everything is running smoothly!"}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
