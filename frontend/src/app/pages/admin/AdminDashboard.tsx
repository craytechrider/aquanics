import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import {
  Users,
  Cpu,
  HeartPulse,
  TrendingUp,
  ArrowRight,
  Settings,
  Activity,
  Shield,
  Loader2,
  Database,
  Bell,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  BookOpen,
} from "lucide-react";

import { adminApi } from "../../lib/api";
import { useAuth } from "../../contexts/AuthContext";

interface Stats {
  totalUsers: number;
  totalSensors: number;
  totalDevices: number;
  activeDevices: number;
  totalAlerts: number;
  criticalAlerts: number;
  warningAlerts: number;
  systemHealth: number;
}

interface RecentAlert {
  id: number;
  title: string;
  message: string;
  severity: string;
  user: string;
  time: string;
}

interface DashboardData {
  stats: Stats;
  roleDistribution: Record<string, number>;
  recentAlerts: RecentAlert[];
}

const FEATURE_CARDS = [
  {
    title: "User Management",
    description: "Manage accounts, roles, and user access.",
    action: "Manage Users",
    path: "/admin/users",
    icon: Users,
    iconStyle: "bg-emerald-50 text-emerald-700",
  },
  {
    title: "System Settings",
    description: "Review the available system configuration.",
    action: "View Settings",
    path: "/admin/settings",
    icon: Settings,
    iconStyle: "bg-cyan-50 text-cyan-700",
  },
  {
    title: "Activity Monitoring",
    description: "Inspect activity records and audit logs.",
    action: "View Activity Logs",
    path: "/admin/activity",
    icon: Activity,
    iconStyle: "bg-violet-50 text-violet-700",
  },
  {
    title: "Device Management",
    description: "Monitor and control connected system devices.",
    action: "Manage Devices",
    path: "/admin/devices",
    icon: Cpu,
    iconStyle: "bg-cyan-50 text-cyan-700",
  },
  {
    title: "Sensor Management",
    description: "Review live readings and sensor status.",
    action: "View Sensors",
    path: "/admin/sensors",
    icon: Database,
    iconStyle: "bg-blue-50 text-blue-700",
  },
  {
    title: "Alert Management",
    description: "Review and manage system alerts.",
    action: "View Alerts",
    path: "/admin/alerts",
    icon: Bell,
    iconStyle: "bg-amber-50 text-amber-700",
  },
];

function formatNumber(value: number | undefined): string {
  return typeof value === "number" && Number.isFinite(value)
    ? value.toLocaleString()
    : "—";
}

function getAlertStyle(severity: string) {
  switch (severity?.toLowerCase()) {
    case "critical":
      return {
        dot: "bg-red-500",
        badge: "border-red-100 bg-red-50 text-red-700",
        label: "Critical",
      };

    case "warning":
      return {
        dot: "bg-amber-500",
        badge: "border-amber-100 bg-amber-50 text-amber-700",
        label: "Warning",
      };

    case "success":
    case "info":
    case "normal":
      return {
        dot: "bg-emerald-500",
        badge: "border-emerald-100 bg-emerald-50 text-emerald-700",
        label: severity || "Info",
      };

    default:
      return {
        dot: "bg-slate-400",
        badge: "border-slate-200 bg-slate-50 text-slate-600",
        label: severity || "Unknown",
      };
  }
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      setErrorMessage("");

      try {
        const response = await adminApi.getDashboard();

        if (!response?.data) {
          throw new Error("The server returned an empty dashboard response.");
        }

        if (mounted) {
          setData(response.data as DashboardData);
        }
      } catch (error) {
        console.error("Failed to load admin dashboard:", error);

        if (mounted) {
          setErrorMessage(
            "Unable to load dashboard information. Check your connection and try again.",
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      mounted = false;
    };
  }, [refreshKey]);

  const stats = data?.stats;
  const roleDistribution = data?.roleDistribution ?? {};
  const recentAlerts = data?.recentAlerts ?? [];

  const adminUsers = roleDistribution.Admin ?? roleDistribution.admin ?? 0;
  const farmerUsers = Object.entries(roleDistribution).reduce(
    (total, [role, count]) =>
      ["farmer", "owner"].includes(role.toLowerCase()) ? total + count : total,
    0,
  );

  const systemHealth =
    typeof stats?.systemHealth === "number" &&
    Number.isFinite(stats.systemHealth)
      ? `${stats.systemHealth}%`
      : "N/A";

  const statCards = [
    {
      title: "Total Users",
      value: formatNumber(stats?.totalUsers),
      subtitle: "Registered accounts",
      icon: Users,
      iconStyle: "bg-emerald-50 text-emerald-700",
    },
    {
      title: "Farmers / Owners",
      value: formatNumber(farmerUsers),
      subtitle: "Registered operator accounts",
      icon: Users,
      iconStyle: "bg-cyan-50 text-cyan-700",
    },
    {
      title: "Admin Users",
      value: formatNumber(adminUsers),
      subtitle: "Administrator accounts",
      icon: Shield,
      iconStyle: "bg-violet-50 text-violet-700",
    },
    {
      title: "Active Devices",
      value: formatNumber(stats?.activeDevices),
      subtitle:
        typeof stats?.totalDevices === "number"
          ? `Out of ${formatNumber(stats.totalDevices)} devices`
          : "Connected devices",
      icon: Cpu,
      iconStyle: "bg-cyan-50 text-cyan-700",
    },
    {
      title: "System Health",
      value: systemHealth,
      subtitle: "Reported by backend",
      icon: HeartPulse,
      iconStyle: "bg-rose-50 text-rose-700",
    },
  ];

  const operationalCards = [
    {
      title: "Total Sensors",
      value: formatNumber(stats?.totalSensors),
      icon: Database,
      style: "text-blue-700 bg-blue-50",
    },
    {
      title: "Total Alerts",
      value: formatNumber(stats?.totalAlerts),
      icon: Bell,
      style: "text-amber-700 bg-amber-50",
    },
    {
      title: "Critical Alerts",
      value: formatNumber(stats?.criticalAlerts),
      icon: AlertTriangle,
      style: "text-red-700 bg-red-50",
    },
  ];

  const handleRefresh = () => {
    setRefreshKey((previous) => previous + 1);
  };

  return (
    <div className="min-w-0 space-y-6 pb-8 sm:space-y-8">
      {/* Dashboard header */}
      <section className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:p-6">
        <div className="min-w-0">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800">
            <Shield size={15} className="text-emerald-700" />
            ADMINISTRATION
          </div>

          <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            <TrendingUp className="shrink-0 text-emerald-600" size={28} />
            Admin Dashboard
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Welcome back, {user?.name || "Admin User"}! Here is your AQUANICS
            system overview.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>

          <button
            type="button"
            onClick={() => navigate("/admin/guide")}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800"
          >
            <BookOpen size={17} />
            Admin Guide
          </button>
        </div>
      </section>

      {/* Loading state */}
      {loading && !data && (
        <div
          className="flex min-h-52 flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white p-8"
          role="status"
        >
          <Loader2 className="h-9 w-9 animate-spin text-emerald-600" />
          <p className="text-sm font-semibold text-slate-600">
            Loading dashboard data...
          </p>
        </div>
      )}

      {/* Error state */}
      {errorMessage && (
        <div
          role="alert"
          className="flex flex-col gap-4 rounded-2xl border border-red-100 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle size={22} className="mt-0.5 shrink-0 text-red-600" />
            <div>
              <h2 className="font-bold text-red-800">
                Dashboard data unavailable
              </h2>
              <p className="mt-1 text-sm leading-6 text-red-700">
                {errorMessage}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-red-700 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-red-800 disabled:opacity-60"
          >
            <RefreshCw size={16} />
            Try Again
          </button>
        </div>
      )}

      {/* Dashboard data */}
      {data && (
        <>
          {/* Main statistics */}
          <section>
            <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 sm:text-xl">
                  System Overview
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Statistics returned by the backend.
                </p>
              </div>
              {loading && (
                <span className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-700">
                  <Loader2 size={14} className="animate-spin" />
                  Updating...
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
              {statCards.map((card) => {
                const Icon = card.icon;

                return (
                  <article
                    key={card.title}
                    className="group min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:border-emerald-200 hover:shadow-md sm:p-6"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-500">
                          {card.title}
                        </p>
                        <p className="mt-3 break-words text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
                          {card.value}
                        </p>
                      </div>

                      <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${card.iconStyle}`}
                      >
                        <Icon size={22} />
                      </div>
                    </div>

                    <p className="mt-3 text-xs leading-5 text-slate-400">
                      {card.subtitle}
                    </p>

                  </article>
                );
              })}
            </div>
          </section>

          {/* Operational statistics */}
          <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {operationalCards.map((card) => {
              const Icon = card.icon;

              return (
                <div
                  key={card.title}
                  className="flex min-w-0 items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
                >
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${card.style}`}
                  >
                    <Icon size={22} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-500">
                      {card.title}
                    </p>
                    <p className="mt-1 text-2xl font-black text-slate-900">
                      {card.value}
                    </p>
                  </div>
                </div>
              );
            })}
          </section>

          {/* Role distribution */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5">
              <h2 className="text-lg font-extrabold text-slate-900">
                User Role Distribution
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Account counts provided by the backend.
              </p>
            </div>

            {Object.keys(roleDistribution).length > 0 ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {Object.entries(roleDistribution).map(([role, count]) => (
                  <div
                    key={role}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-4"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800">
                        <Users size={18} />
                      </div>
                      <span className="truncate text-sm font-bold text-slate-700">
                        {role}
                      </span>
                    </div>
                    <span className="text-xl font-black tabular-nums text-slate-900">
                      {formatNumber(count)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
                No role distribution data was returned by the backend.
              </p>
            )}
          </section>

          {/* Feature navigation */}
          <section>
            <div className="mb-4">
              <h2 className="text-lg font-extrabold text-slate-900 sm:text-xl">
                Administration
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Access common system management pages.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {FEATURE_CARDS.map((card) => {
                const Icon = card.icon;

                return (
                  <article
                    key={card.title}
                    className="group flex min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:border-emerald-200 hover:shadow-md sm:p-6"
                  >
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-xl ${card.iconStyle}`}
                    >
                      <Icon size={23} />
                    </div>

                    <h3 className="mt-4 text-base font-extrabold text-slate-900">
                      {card.title}
                    </h3>

                    <p className="mt-2 flex-1 text-sm leading-6 text-slate-500">
                      {card.description}
                    </p>

                    <button
                      type="button"
                      onClick={() => navigate(card.path)}
                      className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800 focus:outline-none focus:ring-4 focus:ring-emerald-500/20"
                    >
                      {card.action}
                      <ArrowRight
                        size={16}
                        className="transition-transform group-hover:translate-x-1"
                      />
                    </button>
                  </article>
                );
              })}
            </div>
          </section>

          {/* Recent alerts */}
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-slate-100 bg-white px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                  <Bell size={21} />
                </div>
                <div>
                  <h2 className="font-extrabold text-slate-900">
                    System Alerts &amp; Notifications
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Most recent alerts returned by the backend.
                  </p>
                </div>
              </div>

              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-100 bg-white px-3 py-1.5 text-xs font-bold text-emerald-800">
                {recentAlerts.length} loaded
              </span>
            </div>

            <div className="p-4 sm:p-6">
              {recentAlerts.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {recentAlerts.slice(0, 5).map((alert) => {
                    const style = getAlertStyle(alert.severity);

                    return (
                      <div
                        key={alert.id}
                        className="flex min-w-0 flex-col gap-3 py-4 first:pt-1 last:pb-1 sm:flex-row sm:items-start sm:gap-4"
                      >
                        <div
                          className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${style.dot}`}
                        />

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="break-words text-sm font-extrabold text-slate-800">
                              {alert.title || "System Alert"}
                            </h3>
                            <span
                              className={`rounded-full border px-2 py-1 text-[10px] font-bold ${style.badge}`}
                            >
                              {style.label}
                            </span>
                          </div>

                          <p className="mt-1 break-words text-sm leading-6 text-slate-500">
                            {alert.message ||
                              "No additional details available."}
                          </p>

                          {alert.user && (
                            <p className="mt-2 text-xs text-slate-400">
                              Associated user: {alert.user}
                            </p>
                          )}
                        </div>

                        <span className="shrink-0 text-xs text-slate-400 sm:pt-1">
                          {alert.time || "Time unavailable"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                    <CheckCircle2 size={25} />
                  </div>
                  <h3 className="mt-3 font-bold text-slate-800">
                    No recent alerts
                  </h3>
                  <p className="mt-1 max-w-md text-sm leading-6 text-slate-500">
                    The backend did not return any recent alerts for this
                    dashboard.
                  </p>
                </div>
              )}

              <div className="mt-5 border-t border-slate-100 pt-4">
                <Link
                  to="/admin/activity"
                  className="inline-flex items-center gap-2 text-sm font-bold text-emerald-800 transition hover:text-emerald-950"
                >
                  Review Activity Logs
                  <ExternalLink size={15} />
                </Link>
              </div>
            </div>
          </section>
        </>
      )}

      {/* Footer */}
      <footer className="flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-5 text-slate-400">
          AQUANICS Administration · Dashboard information is supplied by the
          backend.
        </p>

        <Link
          to="/admin/guide"
          className="inline-flex items-center gap-2 text-xs font-bold text-emerald-800 hover:text-emerald-950"
        >
          Read Admin Guide
          <ArrowRight size={14} />
        </Link>
      </footer>
    </div>
  );
}
