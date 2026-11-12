import { useState, useEffect, useMemo } from "react";
import {
  Thermometer,
  Search,
  Pencil,
  X,
  Loader2,
  Save,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  CircleHelp,
} from "lucide-react";
import { adminApi } from "../../lib/api";
import { cn } from "../../lib/utils";
import { useSensorConfiguration } from "../../../hooks/useSensorConfiguration";
import {
  getSensorStatus,
  SENSOR_STATUS_PRESENTATION,
  type SensorStatus,
} from "../../lib/sensorStatus";

interface SensorRow {
  id: number;
  key: string;
  name: string;
  value: number | null;
  unit: string;
  status: string;
  trend: string;
  user: string;
  userId: number;
}

export default function AdminSensors() {
  const [sensors, setSensors] = useState<SensorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Edit modal
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<SensorRow | null>(null);
  const [form, setForm] = useState({ name: "", value: "", trend: "stable" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const { configuration } = useSensorConfiguration();

  const fetchSensors = () => {
    setLoading(true);
    adminApi
      .getSensors({ search })
      .then((res) => setSensors(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSensors();
  }, [search]);

  const sensorsWithStatus = useMemo(
    () =>
      sensors.map((sensor) => ({
        ...sensor,
        calculatedStatus: getSensorStatus(
          sensor.value,
          configuration?.[sensor.key],
        ),
      })),
    [sensors, configuration],
  );

  const filteredSensors = useMemo(
    () =>
      sensorsWithStatus.filter(
        (sensor) =>
          statusFilter === "" ||
          sensor.calculatedStatus === statusFilter ||
          (statusFilter === "safe" && sensor.calculatedStatus === "normal"),
      ),
    [sensorsWithStatus, statusFilter],
  );

  const openEdit = (s: SensorRow) => {
    setEditing(s);
    setForm({ name: s.name, value: s.value === null ? "" : String(s.value), trend: s.trend });
    setError("");
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    setError("");
    try {
      await adminApi.updateSensor(editing.id, {
        name: form.name,
        value: parseFloat(form.value),
        trend: form.trend,
      });
      setShowModal(false);
      fetchSensors();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update sensor");
    } finally {
      setSaving(false);
    }
  };

  const statusIcon = (status: SensorStatus) => {
    if (status === "normal") return <CheckCircle2 size={16} className="text-emerald-500" />;
    if (status === "warning") return <AlertTriangle size={16} className="text-amber-500" />;
    if (status === "critical") return <XCircle size={16} className="text-red-500" />;
    return <CircleHelp size={16} className="text-slate-500" />;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900 tracking-tight flex items-center gap-3">
            <Thermometer className="text-emerald-600" size={32} strokeWidth={2.5} />
            Sensor Management
          </h1>
          <p className="text-slate-500 font-medium mt-1">
            Monitor and configure sensors across all users
          </p>
        </div>
        <div className="bg-emerald-50/50 border border-emerald-100 text-emerald-700 px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm">
          <Thermometer size={18} />
          {sensors.length} Sensors
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search sensors..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 bg-white text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm"
          />
        </div>
        <div className="flex gap-2">
          {[
            { value: "", label: "All" },
            { value: "normal", label: "Stable" },
            { value: "warning", label: "Warning" },
            { value: "critical", label: "Critical" },
            { value: "no_data", label: "No Data" },
            { value: "unconfigured", label: "Unconfigured" },
          ].map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setStatusFilter(value)}
              className={cn(
                "px-4 py-2.5 rounded-xl text-sm font-bold border transition-all capitalize",
                statusFilter === value
                  ? "bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-200"
                  : "bg-white text-slate-600 border-slate-200 hover:border-emerald-300 hover:text-emerald-700"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100">
                  <th className="text-left py-4 px-6 text-slate-500 font-bold text-xs uppercase tracking-wider">Sensor</th>
                  <th className="text-left py-4 px-6 text-slate-500 font-bold text-xs uppercase tracking-wider">Value</th>
                  <th className="text-left py-4 px-6 text-slate-500 font-bold text-xs uppercase tracking-wider">Status</th>
                  <th className="text-left py-4 px-6 text-slate-500 font-bold text-xs uppercase tracking-wider">Trend</th>
                  <th className="text-left py-4 px-6 text-slate-500 font-bold text-xs uppercase tracking-wider">Owner</th>
                  <th className="text-right py-4 px-6 text-slate-500 font-bold text-xs uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSensors.map((s) => {
                  const styles = SENSOR_STATUS_PRESENTATION[s.calculatedStatus];
                  return (
                  <tr key={s.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className={cn("p-2 rounded-xl", styles.icon)}>
                          <Thermometer size={18} />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{s.name}</p>
                          <p className="text-xs text-slate-400">{s.key}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={cn("text-lg font-display font-bold", styles.value)}>{s.value ?? "--"}</span>
                      <span className="text-slate-400 ml-1 text-xs">{s.unit}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border capitalize",
                        styles.badge,
                      )}>
                        {statusIcon(s.calculatedStatus)}
                        {styles.label}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={cn(
                        "text-sm font-medium capitalize",
                        s.trend === "up" ? "text-emerald-600" : s.trend === "down" ? "text-red-500" : "text-slate-400"
                      )}>
                        {s.trend === "up" ? "↑" : s.trend === "down" ? "↓" : "→"} {s.trend}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-600">{s.user}</td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-end">
                        <button
                          onClick={() => openEdit(s)}
                          className="p-2 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                          title="Edit"
                        >
                          <Pencil size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                  );
                })}
                {filteredSensors.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      No sensors match this filter
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Edit Modal ─────────────────────────────────────── */}
      {showModal && editing && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg mx-4 p-8">
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
              <X size={20} />
            </button>

            <h2 className="text-xl font-display font-bold text-slate-900 mb-6">Edit Sensor</h2>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 font-medium">{error}</div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Value</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.value}
                  onChange={(e) => setForm({ ...form, value: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Trend</label>
                <select
                  value={form.trend}
                  onChange={(e) => setForm({ ...form, trend: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  <option value="up">Up</option>
                  <option value="down">Down</option>
                  <option value="stable">Stable</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-5 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-emerald-600 to-cyan-600 text-white rounded-xl text-sm font-bold hover:shadow-lg hover:shadow-emerald-200 transition-all disabled:opacity-70"
              >
                {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
