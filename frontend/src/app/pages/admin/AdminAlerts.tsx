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

  const fetchAlerts = () => {
    setLoading(true);
    adminApi
      .getAlerts({ severity: severityFilter })
      .then((res) => setAlerts(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAlerts();
  }, [severityFilter]);

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this alert?")) return;
    try {
      await adminApi.deleteAlert(id);
      setAlerts((prev) => prev.filter((a) => a.id !== id));
    } catch {
      alert("Failed to delete alert");
    }
  };

  const severityConfig: Record<string, { icon: typeof AlertTriangle; cls: string; bg: string }> = {
    warning: { icon: AlertTriangle, cls: "text-amber-600", bg: "bg-amber-100" },
    critical: { icon: XCircle, cls: "text-red-600", bg: "bg-red-100" },
    success: { icon: CheckCircle2, cls: "text-emerald-600", bg: "bg-emerald-100" },
    info: { icon: Info, cls: "text-blue-600", bg: "bg-blue-100" },
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900 tracking-tight flex items-center gap-3">
            <AlertTriangle
              className="text-amber-500"
              size={32}
              strokeWidth={2.5}
            />
            Alert Management
          </h1>
          <p className="text-slate-500 font-medium mt-1">
            View and manage system-wide alerts
          </p>
        </div>
        <div className="bg-amber-50/50 border border-amber-100 text-amber-700 px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm">
          <AlertTriangle size={18} />
          {alerts.length} Alerts
        </div>
      </div>

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
              "inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold border transition-all",
              severityFilter === f.key
                ? "bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-200"
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
        <div className="space-y-4">
          {alerts.map((alert) => {
            const cfg = severityConfig[alert.severity] || severityConfig.info;
            const Icon = cfg.icon;
            return (
              <div
                key={alert.id}
                className="bg-white rounded-2xl border border-slate-100 shadow-lg shadow-slate-200/40 p-6 flex gap-4 hover:shadow-xl transition-all duration-300 group"
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
                    <h3 className="font-display font-bold text-slate-800">
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
                  <p className="text-sm text-slate-500 leading-relaxed mb-2">
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
                  onClick={() => handleDelete(alert.id)}
                  className="self-center p-2.5 rounded-xl text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                  title="Delete alert"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            );
          })}
          {alerts.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="h-20 w-20 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                <CheckCircle2 size={36} className="text-emerald-400" />
              </div>
              <h3 className="font-display font-bold text-slate-700 text-lg mb-1">
                No alerts found
              </h3>
              <p className="text-slate-500 text-sm">
                {severityFilter
                  ? "No alerts match the selected filter."
                  : "Everything is running smoothly!"}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
