import { useState, useEffect } from "react";
import {
  Cpu,
  Search,
  Loader2,
  Power,
  Zap,
  Wind,
  Activity,
} from "lucide-react";
import { adminApi } from "../../lib/api";
import { cn } from "../../lib/utils";

interface DeviceRow {
  id: number;
  key: string;
  name: string;
  isOn: boolean;
  mode: string;
  schedule: string | null;
  user: string;
  userId: number;
}

const DEVICE_ICONS: Record<string, typeof Zap> = {
  pump: Zap,
  aerator: Wind,
  lights: Zap,
  feeder: Activity,
};

export default function AdminDevices() {
  const [devices, setDevices] = useState<DeviceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchDevices = () => {
    setLoading(true);
    adminApi
      .getDevices({ search })
      .then((res) => setDevices(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDevices();
  }, [search]);

  const handleToggle = async (id: number) => {
    try {
      const res = await adminApi.toggleDevice(id);
      setDevices((prev) =>
        prev.map((d) => (d.id === id ? { ...d, isOn: res.data.isOn } : d))
      );
    } catch (err) {
      console.error("Toggle failed", err);
    }
  };

  const onlineCount = devices.filter((d) => d.isOn).length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900 tracking-tight flex items-center gap-3">
            <Cpu className="text-cyan-600" size={32} strokeWidth={2.5} />
            Device Management
          </h1>
          <p className="text-slate-500 font-medium mt-1">
            Control and monitor all system devices
          </p>
        </div>
        <div className="bg-cyan-50/50 border border-cyan-100 text-cyan-700 px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm">
          <Power size={18} />
          {onlineCount}/{devices.length} Online
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search
          size={20}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          type="text"
          placeholder="Search devices..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 bg-white text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm"
        />
      </div>

      {/* Device Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {devices.map((d) => {
            const IconComp = DEVICE_ICONS[d.key] || Cpu;
            return (
              <div
                key={d.id}
                className={cn(
                  "bg-white rounded-2xl border p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg relative overflow-hidden group",
                  d.isOn
                    ? "border-emerald-100 shadow-lg shadow-emerald-100/40"
                    : "border-slate-100 shadow-lg shadow-slate-200/40"
                )}
              >
                {/* Status indicator */}
                <div
                  className={cn(
                    "absolute top-4 right-4 h-3 w-3 rounded-full",
                    d.isOn
                      ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                      : "bg-slate-300"
                  )}
                />

                <div className="flex items-center gap-4 mb-5">
                  <div
                    className={cn(
                      "p-3 rounded-xl shadow-md text-white transition-all",
                      d.isOn
                        ? "bg-gradient-to-br from-emerald-500 to-cyan-500 shadow-emerald-200"
                        : "bg-gradient-to-br from-slate-400 to-slate-500 shadow-slate-200"
                    )}
                  >
                    <IconComp size={22} />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-slate-800">
                      {d.name}
                    </h3>
                    <p className="text-xs text-slate-400">owned by {d.user}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <div className="space-y-1">
                    <p className="text-xs text-slate-500 font-medium">
                      Mode:{" "}
                      <span className="text-slate-800 font-bold capitalize">
                        {d.mode || "Manual"}
                      </span>
                    </p>
                    {d.schedule && (
                      <p className="text-xs text-slate-500 font-medium">
                        Schedule:{" "}
                        <span className="text-slate-800 font-bold">
                          {d.schedule}
                        </span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Toggle Button */}
                <button
                  onClick={() => handleToggle(d.id)}
                  className={cn(
                    "w-full py-3 rounded-xl text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2",
                    d.isOn
                      ? "bg-red-50 text-red-600 border border-red-100 hover:bg-red-100"
                      : "bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100"
                  )}
                >
                  <Power size={16} />
                  {d.isOn ? "Turn Off" : "Turn On"}
                </button>
              </div>
            );
          })}
          {devices.length === 0 && (
            <div className="col-span-full text-center py-12 text-slate-400">
              No devices found
            </div>
          )}
        </div>
      )}
    </div>
  );
}
