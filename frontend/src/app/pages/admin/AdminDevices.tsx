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
  const [pageError, setPageError] = useState("");
  const [actionError, setActionError] = useState("");

  const fetchDevices = () => {
    setLoading(true);
    setPageError("");
    adminApi
      .getDevices({ search })
      .then((res) => setDevices(res.data))
      .catch((error) => {
        console.error("Failed to load devices:", error);
        setPageError("Unable to load devices. Please try again.");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDevices();
  }, [search]);

  const handleToggle = async (id: number) => {
    setActionError("");
    try {
      const res = await adminApi.toggleDevice(id);
      setDevices((prev) =>
        prev.map((d) => (d.id === id ? { ...d, isOn: res.data.isOn } : d)),
      );
    } catch (err) {
      console.error("Failed to toggle device:", err);
      setActionError("Unable to update the device. Please try again.");
    }
  };

  const onlineCount = devices.filter((d) => d.isOn).length;

  return (
    <div className="min-w-0 space-y-5 pb-6 sm:space-y-6">
      {/* Header */}
      <div className="flex min-w-0 flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight text-slate-900 sm:gap-3 sm:text-3xl">
            <Cpu className="shrink-0 text-emerald-600" size={25} />
            Device Management
          </h1>
          <p className="mt-1 text-xs text-slate-500 sm:text-sm">
            Control and monitor all system devices
          </p>
        </div>
        <div className="inline-flex items-center gap-2 self-start rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-800 sm:self-auto">
          <Power size={18} />
          {onlineCount}/{devices.length} Online
        </div>
      </div>

      {/* Search */}
      <div className="relative w-full max-w-md">
        <Search
          size={20}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          type="text"
          placeholder="Search devices..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-800 shadow-sm placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
        />
      </div>
      {(pageError || actionError) && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700">
          <span>{actionError || pageError}</span>
          {pageError && (
            <button type="button" onClick={fetchDevices} className="font-semibold underline">
              Retry
            </button>
          )}
        </div>
      )}

      {/* Device Grid */}
      {loading ? (
        <div className="flex min-h-48 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      ) : (
        <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {devices.map((d) => {
            const IconComp = DEVICE_ICONS[d.key] || Cpu;
            return (
              <div
                key={d.id}
                className={cn(
                  "relative overflow-hidden rounded-2xl border bg-white p-5 shadow-sm transition hover:shadow-md",
                  d.isOn
                    ? "border-emerald-200"
                    : "border-slate-200"
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
                      "rounded-xl p-3 transition",
                      d.isOn
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-slate-100 text-slate-500"
                    )}
                  >
                    <IconComp size={22} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">
                      {d.name}
                    </h3>
                    <p className="text-xs text-slate-400">owned by {d.user}</p>
                  </div>
                </div>

                <div className="mb-4 flex items-center justify-between">
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
            <div className="col-span-full rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-12 text-center text-sm text-slate-500">
              No devices found
            </div>
          )}
        </div>
      )}
    </div>
  );
}
