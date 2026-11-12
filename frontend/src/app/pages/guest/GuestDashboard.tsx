import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import {
  Activity,
  ArrowLeft,
  BookOpen,
  ChevronDown,
  CircleHelp,
  Droplets,
  ExternalLink,
  Gauge,
  Leaf,
  Menu,
  RefreshCw,
  ShieldCheck,
  Thermometer,
  Wind,
  X,
  Zap,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { onValue, ref } from "firebase/database";
import { db } from "../../../firebase";
import { useAquaponicsData } from "../../../hooks/useAquaponicsData";

type HistoryRecord = Record<string, Record<string, number>>;

type ChartPoint = {
  time: string;
  ph?: number;
  dissolvedOxygen?: number;
  waterTemp?: number;
  ammonia?: number;
  waterPercent?: number;
};

const sensorDefinitions = [
  {
    key: "ph",
    label: "pH Level",
    unit: "pH",
    icon: Droplets,
    color: "#10b981",
    description: "Water acidity",
  },
  {
    key: "dissolvedOxygen",
    label: "Dissolved Oxygen",
    unit: "mg/L",
    icon: Wind,
    color: "#0891b2",
    description: "Available oxygen",
  },
  {
    key: "waterTemp",
    label: "Water Temperature",
    unit: "°C",
    icon: Thermometer,
    color: "#f59e0b",
    description: "Current water temperature",
  },
  {
    key: "ammonia",
    label: "Ammonia",
    unit: "mg/L",
    icon: Activity,
    color: "#ef4444",
    description: "Ammonia concentration",
  },
  {
    key: "waterPercent",
    label: "Water Level",
    unit: "%",
    icon: Gauge,
    color: "#3b82f6",
    description: "Tank water level",
  },
  {
    key: "batteryPercent",
    label: "Battery",
    unit: "%",
    icon: Zap,
    color: "#8b5cf6",
    description: "Estimated battery charge",
  },
] as const;

function numericValue(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function batteryPercentage(voltage: unknown): number | null {
  const volts = numericValue(voltage);
  if (volts === null) return null;
  return Math.max(0, Math.min(100, ((volts - 8.4) / 4.2) * 100));
}

function formatValue(value: number | null, key: string): string {
  if (value === null) return "--";
  if (key === "ph" || key === "ammonia") return value.toFixed(2);
  return value.toFixed(1);
}

function formatTimestamp(value: string): string {
  const parts = value.split(" ");
  return parts.length > 1 ? parts[1].slice(0, 5) : value;
}

function readHistory(
  history: HistoryRecord | null | undefined,
  rangeHours: number,
) {
  if (!history || typeof history !== "object") return [];

  const cutoff = Date.now() - rangeHours * 60 * 60 * 1000;
  const points: { time: string; value: number }[] = [];

  for (const date of Object.keys(history).sort()) {
    const readings = history[date];
    if (!readings || typeof readings !== "object") continue;

    for (const time of Object.keys(readings).sort()) {
      const value = numericValue(readings[time]);
      if (value === null) continue;

      const timestamp = new Date(
        `${date}T${time.replace(/-/g, ":")}`,
      ).getTime();
      if (!Number.isFinite(timestamp) || timestamp < cutoff) continue;

      points.push({ time: `${date} ${time}`, value });
    }
  }

  return points.slice(-500);
}

export default function GuestDashboard() {
  const { data, loading, error } = useAquaponicsData();

  const [rangeHours, setRangeHours] = useState(24);
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState("all");

  const values = useMemo(
    () => ({
      ph: numericValue(data.ph),
      dissolvedOxygen: numericValue(data.dissolvedOxygen),
      waterTemp: numericValue(data.waterTemp),
      ammonia: numericValue(data.ammonia),
      waterPercent: numericValue(data.waterPercent),
      batteryPercent: batteryPercentage(data.batteryVoltage),
    }),
    [
      data.ph,
      data.dissolvedOxygen,
      data.waterTemp,
      data.ammonia,
      data.waterPercent,
      data.batteryVoltage,
    ],
  );

  useEffect(() => {
    const keys = [
      "ph",
      "dissolvedOxygen",
      "waterTemp",
      "ammonia",
      "waterPercent",
    ] as const;

    const histories: Partial<
      Record<(typeof keys)[number], { time: string; value: number }[]>
    > = {};
    let active = true;

    const rebuildChart = () => {
      if (!active) return;

      const byTime = new Map<string, ChartPoint>();

      for (const key of keys) {
        for (const point of histories[key] ?? []) {
          if (!byTime.has(point.time))
            byTime.set(point.time, { time: point.time });
          const row = byTime.get(point.time)!;
          row[key] = point.value;
        }
      }

      setChartData(
        Array.from(byTime.values())
          .sort((a, b) => a.time.localeCompare(b.time))
          .slice(-500),
      );
    };

    const unsubscribers = keys.map((key) =>
      onValue(
        ref(db, `sensors/${key}`),
        (snapshot) => {
          histories[key] = readHistory(
            snapshot.val() as HistoryRecord | undefined,
            rangeHours,
          );
          rebuildChart();
        },
        (firebaseError) => {
          console.error(`Unable to read ${key} history`, firebaseError);
        },
      ),
    );

    return () => {
      active = false;
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [rangeHours]);

  const currentReadingCount = Object.values(values).filter(
    (value) => value !== null,
  ).length;

  const navigation = [
    { label: "Overview", href: "/guest/dashboard", icon: Gauge },
    { label: "Learning Center", href: "/guest/learning", icon: BookOpen },
    { label: "Sign In", href: "/login", icon: ExternalLink },
  ];

  return (
    <div className="min-h-screen bg-[#f4f7f5] text-slate-800">
      {mobileMenuOpen && (
        <button
          aria-label="Close navigation menu"
          className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-emerald-900/10 bg-[#123b2d] text-white transition-transform duration-300 lg:translate-x-0 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-20 items-center justify-between border-b border-white/10 px-6">
          <Link to="/" className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-400 text-emerald-950 shadow-lg shadow-emerald-950/20">
              <Leaf size={25} />
            </span>
            <span>
              <span className="block text-lg font-black tracking-wide">
                AQUANICS
              </span>
              <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-200">
                Aquaponics System
              </span>
            </span>
          </Link>

          <button
            aria-label="Close menu"
            className="rounded-lg p-2 text-white/70 hover:bg-white/10 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <div className="mx-4 mt-6 rounded-2xl border border-emerald-200/10 bg-white/[0.06] p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-400/15 text-emerald-300">
              <ShieldCheck size={22} />
            </div>
            <div>
              <p className="font-bold">Guest Access</p>
              <p className="mt-0.5 text-xs text-emerald-100/65">
                Read-only monitoring
              </p>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-emerald-400/10 px-3 py-2 text-xs font-semibold text-emerald-200">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Controls disabled for guests
          </div>
        </div>

        <div className="px-6 pb-2 pt-8 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-100/45">
          Navigation
        </div>

        <nav className="space-y-1 px-3">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = item.href === "/guest/dashboard";

            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                  active
                    ? "bg-emerald-400 text-emerald-950 shadow-lg shadow-black/10"
                    : "text-emerald-50/75 hover:bg-white/[0.08] hover:text-white"
                }`}
              >
                <Icon size={19} />
                <span>{item.label}</span>
                {active && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-950" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto p-4">
          <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
            <div className="mb-3 flex items-center gap-2 text-emerald-200">
              <CircleHelp size={17} />
              <span className="text-sm font-bold">Need full access?</span>
            </div>
            <p className="mb-4 text-xs leading-5 text-emerald-50/65">
              Sign in to access your authorized AQUANICS management tools.
            </p>
            <Link
              to="/login"
              className="flex w-full items-center justify-center rounded-xl bg-white px-4 py-2.5 text-sm font-extrabold text-[#123b2d] transition hover:bg-emerald-100"
            >
              Sign In
            </Link>
          </div>

          <p className="px-2 pt-5 text-center text-[10px] text-emerald-100/35">
            AQUANICS • Guest Portal
          </p>
        </div>
      </aside>

      <div className="min-w-0 lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
          <div className="flex min-h-[76px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button
                aria-label="Open navigation menu"
                onClick={() => setMobileMenuOpen(true)}
                className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-700 shadow-sm lg:hidden"
              >
                <Menu size={20} />
              </button>
              <div className="min-w-0">
                <p className="hidden text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700 sm:block">
                  Public Monitoring Portal
                </p>
                <h1 className="truncate text-lg font-black text-slate-900 sm:text-xl">
                  Sensor Overview
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <span className="hidden items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800 sm:inline-flex">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Guest Mode
              </span>
              <Link
                to="/"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-800 sm:px-4 sm:text-sm"
              >
                <ArrowLeft size={16} />
                <span className="hidden sm:inline">Return to Landing Page</span>
                <span className="sm:hidden">Home</span>
              </Link>
            </div>
          </div>
        </header>

        <main className="space-y-7 p-4 sm:p-6 lg:p-8">
          <section className="relative isolate overflow-hidden rounded-[28px] bg-gradient-to-br from-[#123b2d] via-[#176449] to-[#14805d] p-6 text-white shadow-xl shadow-emerald-950/10 sm:p-8 lg:p-10">
            <div className="pointer-events-none absolute -right-12 -top-20 -z-10 h-64 w-64 rounded-full border-[35px] border-white/[0.06]" />
            <div className="pointer-events-none absolute -bottom-24 right-36 -z-10 h-52 w-52 rounded-full bg-emerald-300/10 blur-2xl" />

            <div className="relative grid gap-8 lg:grid-cols-[1.5fr_0.8fr] lg:items-center">
              <div>
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold text-emerald-100">
                  <Activity size={14} />
                  AQUANICS LIVE MONITORING
                </div>

                <h2 className="max-w-2xl text-3xl font-black leading-tight tracking-tight sm:text-4xl lg:text-5xl">
                  Monitor your water.
                  <span className="block text-emerald-300">
                    Understand your system.
                  </span>
                </h2>

                <p className="mt-4 max-w-xl text-sm leading-7 text-emerald-50/75 sm:text-base">
                  Explore current aquaponics sensor readings and historical
                  water quality trends. This public dashboard is designed for
                  viewing only.
                </p>

                <div className="mt-7 flex flex-wrap gap-3">
                  <a
                    href="#sensor-readings"
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-300 px-5 py-3 text-sm font-extrabold text-emerald-950 transition hover:bg-emerald-200"
                  >
                    View Sensor Readings
                    <ChevronDown size={17} />
                  </a>
                  <Link
                    to="/guest/learning"
                    className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/15"
                  >
                    <BookOpen size={17} />
                    Explore Learning Center
                  </Link>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-white/15 bg-white/[0.08] p-5 backdrop-blur">
                  <div className="flex items-center gap-2 text-emerald-200">
                    <Activity size={17} />
                    <span className="text-xs font-bold">Sensor Channels</span>
                  </div>
                  <p className="mt-4 text-4xl font-black">06</p>
                  <p className="mt-1 text-xs text-white/60">
                    Available indicators
                  </p>
                </div>

                <div className="rounded-2xl border border-white/15 bg-white/[0.08] p-5 backdrop-blur">
                  <div className="flex items-center gap-2 text-emerald-200">
                    <ShieldCheck size={17} />
                    <span className="text-xs font-bold">Access</span>
                  </div>
                  <p className="mt-4 text-2xl font-black">Read-only</p>
                  <p className="mt-2 text-xs text-white/60">
                    No device controls
                  </p>
                </div>

                <div className="col-span-2 rounded-2xl border border-white/15 bg-white/[0.08] p-4 backdrop-blur">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold text-white/65">
                        Available readings
                      </p>
                      <p className="mt-1 text-2xl font-black">
                        {currentReadingCount}
                        <span className="ml-2 text-sm font-semibold text-white/60">
                          of 6 indicators
                        </span>
                      </p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-emerald-200">
                      <Gauge size={24} />
                    </div>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/20">
                    <div
                      className="h-full rounded-full bg-emerald-300 transition-all"
                      style={{ width: `${(currentReadingCount / 6) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section id="sensor-readings">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
                  System Snapshot
                </p>
                <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-900">
                  Sensor Readings
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Latest available values from the monitoring system.
                </p>
              </div>
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-500">
                <RefreshCw size={13} />
                Updates when sensor data changes
              </div>
            </div>

            {error && (
              <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                Some readings may be unavailable. Check the Firebase connection
                and database permissions.
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {sensorDefinitions.map((sensor, index) => {
                const Icon = sensor.icon;
                const value = values[sensor.key];
                const displayValue = formatValue(value, sensor.key);
                const isAvailable = value !== null;

                return (
                  <article
                    key={sensor.key}
                    className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-950/[0.05] sm:p-6"
                  >
                    <div
                      className="absolute inset-x-0 top-0 h-1"
                      style={{ backgroundColor: sensor.color }}
                    />

                    <div className="flex items-start justify-between gap-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <div
                          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
                          style={{
                            color: sensor.color,
                            backgroundColor: `${sensor.color}15`,
                          }}
                        >
                          <Icon size={23} />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-extrabold text-slate-800">
                            {sensor.label}
                          </h3>
                          <p className="mt-1 text-xs text-slate-400">
                            {sensor.description}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-extrabold ${
                          isAvailable
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            isAvailable ? "bg-emerald-500" : "bg-slate-400"
                          }`}
                        />
                        {isAvailable ? "AVAILABLE" : "NO DATA"}
                      </span>
                    </div>

                    <div className="mt-7 flex items-end justify-between gap-3">
                      <p className="text-4xl font-black tracking-tight text-slate-900">
                        {displayValue}
                        <span className="ml-1.5 text-sm font-bold text-slate-400">
                          {sensor.unit}
                        </span>
                      </p>
                      <div
                        className="rounded-xl p-2 transition group-hover:scale-110"
                        style={{
                          color: sensor.color,
                          backgroundColor: `${sensor.color}12`,
                        }}
                      >
                        <Activity size={18} />
                      </div>
                    </div>

                    <div className="mt-5 border-t border-slate-100 pt-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">
                          Data availability
                        </span>
                        <span
                          className="font-bold"
                          style={{ color: sensor.color }}
                        >
                          {isAvailable
                            ? "Reading received"
                            : "Waiting for reading"}
                        </span>
                      </div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: isAvailable ? "100%" : "8%",
                            backgroundColor: sensor.color,
                          }}
                        />
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            {loading && (
              <p className="mt-4 text-sm text-slate-500">
                Loading current sensor readings...
              </p>
            )}
          </section>

          <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-7">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
                  Historical Data
                </p>
                <h2 className="mt-1 text-xl font-black text-slate-900 sm:text-2xl">
                  Water Quality Trends
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Compare changes in recorded sensor readings.
                </p>
              </div>

              <label className="flex items-center gap-2 text-sm font-bold text-slate-600">
                <span className="whitespace-nowrap">Time range</span>
                <select
                  value={rangeHours}
                  onChange={(event) =>
                    setRangeHours(Number(event.target.value))
                  }
                  className="max-w-[170px] rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
                >
                  <option value={1}>Last hour</option>
                  <option value={6}>Last 6 hours</option>
                  <option value={24}>Last 24 hours</option>
                  <option value={72}>Last 3 days</option>
                  <option value={168}>Last 7 days</option>
                </select>
              </label>
            </div>

            <div className="flex flex-wrap gap-2 px-5 pt-5 sm:px-7">
              {[
                { key: "all", label: "All Sensors" },
                { key: "ph", label: "pH" },
                { key: "dissolvedOxygen", label: "Oxygen" },
                { key: "waterTemp", label: "Temperature" },
                { key: "ammonia", label: "Ammonia" },
                { key: "waterPercent", label: "Water Level" },
              ].map((metric) => (
                <button
                  key={metric.key}
                  onClick={() => setSelectedMetric(metric.key)}
                  className={`rounded-full px-3.5 py-2 text-xs font-bold transition ${
                    selectedMetric === metric.key
                      ? "bg-[#123b2d] text-white shadow-sm"
                      : "border border-slate-200 bg-white text-slate-500 hover:border-emerald-200 hover:text-emerald-800"
                  }`}
                >
                  {metric.label}
                </button>
              ))}
            </div>

            <div className="h-[340px] w-full px-2 pb-5 pt-4 sm:h-[420px] sm:px-5">
              {chartData.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center px-6 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                    <Activity size={26} />
                  </div>
                  <p className="mt-4 font-bold text-slate-700">
                    No historical readings found
                  </p>
                  <p className="mt-1 max-w-sm text-sm leading-6 text-slate-400">
                    The chart will display data when Firebase contains
                    timestamped sensor history within the selected time range.
                  </p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={chartData}
                    margin={{ top: 10, right: 12, left: -14, bottom: 5 }}
                  >
                    <defs>
                      <linearGradient
                        id="guestPhFill"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#10b981"
                          stopOpacity={0.25}
                        />
                        <stop
                          offset="95%"
                          stopColor="#10b981"
                          stopOpacity={0.01}
                        />
                      </linearGradient>
                      <linearGradient
                        id="guestOxygenFill"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#0891b2"
                          stopOpacity={0.2}
                        />
                        <stop
                          offset="95%"
                          stopColor="#0891b2"
                          stopOpacity={0.01}
                        />
                      </linearGradient>
                      <linearGradient
                        id="guestTempFill"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#f59e0b"
                          stopOpacity={0.2}
                        />
                        <stop
                          offset="95%"
                          stopColor="#f59e0b"
                          stopOpacity={0.01}
                        />
                      </linearGradient>
                      <linearGradient
                        id="guestAmmoniaFill"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#ef4444"
                          stopOpacity={0.15}
                        />
                        <stop
                          offset="95%"
                          stopColor="#ef4444"
                          stopOpacity={0.01}
                        />
                      </linearGradient>
                      <linearGradient
                        id="guestWaterFill"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#3b82f6"
                          stopOpacity={0.2}
                        />
                        <stop
                          offset="95%"
                          stopColor="#3b82f6"
                          stopOpacity={0.01}
                        />
                      </linearGradient>
                    </defs>

                    <CartesianGrid
                      stroke="#edf2ef"
                      strokeDasharray="4 4"
                      vertical={false}
                    />

                    <XAxis
                      dataKey="time"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: "#94a3b8" }}
                      tickFormatter={formatTimestamp}
                      minTickGap={28}
                    />

                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: "#94a3b8" }}
                      width={42}
                    />

                    <Tooltip
                      labelFormatter={(label) => String(label)}
                      contentStyle={{
                        borderRadius: 14,
                        border: "1px solid #e2e8f0",
                        boxShadow: "0 10px 30px rgba(15,23,42,0.08)",
                        fontSize: 12,
                      }}
                    />

                    <Legend
                      verticalAlign="top"
                      align="left"
                      height={40}
                      wrapperStyle={{ fontSize: 11 }}
                    />

                    {(selectedMetric === "all" || selectedMetric === "ph") && (
                      <Area
                        type="monotone"
                        dataKey="ph"
                        name="pH"
                        stroke="#10b981"
                        strokeWidth={2.5}
                        fill="url(#guestPhFill)"
                        connectNulls
                        dot={false}
                        activeDot={{ r: 4 }}
                      />
                    )}

                    {(selectedMetric === "all" ||
                      selectedMetric === "dissolvedOxygen") && (
                      <Area
                        type="monotone"
                        dataKey="dissolvedOxygen"
                        name="Dissolved Oxygen"
                        stroke="#0891b2"
                        strokeWidth={2.5}
                        fill="url(#guestOxygenFill)"
                        connectNulls
                        dot={false}
                        activeDot={{ r: 4 }}
                      />
                    )}

                    {(selectedMetric === "all" ||
                      selectedMetric === "waterTemp") && (
                      <Area
                        type="monotone"
                        dataKey="waterTemp"
                        name="Temperature"
                        stroke="#f59e0b"
                        strokeWidth={2.5}
                        fill="url(#guestTempFill)"
                        connectNulls
                        dot={false}
                        activeDot={{ r: 4 }}
                      />
                    )}

                    {(selectedMetric === "all" ||
                      selectedMetric === "ammonia") && (
                      <Area
                        type="monotone"
                        dataKey="ammonia"
                        name="Ammonia"
                        stroke="#ef4444"
                        strokeWidth={2.5}
                        fill="url(#guestAmmoniaFill)"
                        connectNulls
                        dot={false}
                        activeDot={{ r: 4 }}
                      />
                    )}

                    {(selectedMetric === "all" ||
                      selectedMetric === "waterPercent") && (
                      <Area
                        type="monotone"
                        dataKey="waterPercent"
                        name="Water Level"
                        stroke="#3b82f6"
                        strokeWidth={2.5}
                        fill="url(#guestWaterFill)"
                        connectNulls
                        dot={false}
                        activeDot={{ r: 4 }}
                      />
                    )}
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="flex flex-col gap-2 border-t border-slate-100 bg-slate-50/70 px-5 py-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-7">
              <span>Showing up to 500 historical points</span>
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-emerald-700" />
                Guest access is read-only
              </span>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            <Link
              to="/guest/learning"
              className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-emerald-200 hover:shadow-md sm:p-6"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 transition group-hover:bg-emerald-100">
                <BookOpen size={24} />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-extrabold text-slate-900">
                  Learning Center
                </h3>
                <p className="mt-1 text-sm leading-5 text-slate-500">
                  Learn about aquaponics and water quality monitoring.
                </p>
              </div>
              <ExternalLink size={17} className="shrink-0 text-slate-400" />
            </Link>

            <Link
              to="/"
              className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-emerald-200 hover:shadow-md sm:p-6"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 transition group-hover:bg-slate-200">
                <ArrowLeft size={24} />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-extrabold text-slate-900">Back to Home</h3>
                <p className="mt-1 text-sm leading-5 text-slate-500">
                  Return to the AQUANICS landing page.
                </p>
              </div>
              <ExternalLink size={17} className="shrink-0 text-slate-400" />
            </Link>
          </section>

          <footer className="flex flex-col gap-2 border-t border-slate-200 py-5 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
            <p>
              © {new Date().getFullYear()} AQUANICS Aquaponics Monitoring System
            </p>
            <p className="inline-flex items-center gap-1.5">
              <ShieldCheck size={13} />
              Public guest view • No device controls
            </p>
          </footer>
        </main>
      </div>
    </div>
  );
}
