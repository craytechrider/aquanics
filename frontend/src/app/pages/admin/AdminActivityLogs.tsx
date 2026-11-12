import { useState, useEffect, useCallback } from "react";
import type { ReactNode } from "react";
import {
  Activity,
  FileText,
  Eye,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Globe,
  Users,
  UserCheck,
  ShieldAlert,
  RefreshCw,
  X,
  CalendarClock,
  Mail,
  Monitor,
} from "lucide-react";

import { adminApi } from "../../lib/api";
import { cn } from "../../lib/utils";

interface ActivityLog {
  id: number;
  time: string;
  userName: string;
  userEmail: string;
  activity: string;
  type: string;
  status: string;
  details?: string | null;
  ip?: string | null;
}

interface ActivityStats {
  total_site_views: number;
  guest_visits: number;
  registered_logins: number;
  security_alerts: number;
}

interface ActivityResponse {
  data: ActivityLog[];
  total: number;
  current_page?: number;
  last_page?: number;
  stats?: Partial<ActivityStats>;
}

const PER_PAGE = 6;

const TYPE_COLORS: Record<string, string> = {
  Login: "bg-emerald-50 text-emerald-700",
  View: "bg-cyan-50 text-cyan-700",
  Security: "bg-amber-50 text-amber-700",
  Modified: "bg-violet-50 text-violet-700",
  Export: "bg-blue-50 text-blue-700",
  "User Creation": "bg-teal-50 text-teal-700",
};

const STATUS_COLORS: Record<string, string> = {
  Success: "bg-emerald-50 text-emerald-700",
  Denied: "bg-red-50 text-red-700",
};

const EMPTY_STATS: ActivityStats = {
  total_site_views: 0,
  guest_visits: 0,
  registered_logins: 0,
  security_alerts: 0,
};

function formatNumber(value: number): string {
  return value.toLocaleString();
}

export default function AdminActivityLogs() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [stats, setStats] = useState<ActivityStats>(EMPTY_STATS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [detailLog, setDetailLog] = useState<ActivityLog | null>(null);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await adminApi.getActivityLogs({
        per_page: PER_PAGE,
        page,
      });

      const result = response.data as ActivityResponse;

      setLogs(Array.isArray(result.data) ? result.data : []);
      setTotal(Number(result.total ?? 0));
      setTotalPages(Math.max(1, Number(result.last_page ?? 1)));

      if (result.stats) {
        setStats({
          total_site_views: Number(result.stats.total_site_views ?? 0),
          guest_visits: Number(result.stats.guest_visits ?? 0),
          registered_logins: Number(result.stats.registered_logins ?? 0),
          security_alerts: Number(result.stats.security_alerts ?? 0),
        });
      }
    } catch (err) {
      console.error("Failed to load activity logs:", err);
      setError("Unable to load activity logs. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    void loadLogs();
  }, [loadLogs]);

  const statCards = [
    {
      title: "Total Site Views",
      value: stats.total_site_views,
      description: "Recorded landing-page views",
      icon: Globe,
      iconStyle: "bg-cyan-50 text-cyan-700",
    },
    {
      title: "Guest Visits",
      value: stats.guest_visits,
      description: "Views without an account",
      icon: Users,
      iconStyle: "bg-emerald-50 text-emerald-700",
    },
    {
      title: "Registered Logins",
      value: stats.registered_logins,
      description: "Successful account logins",
      icon: UserCheck,
      iconStyle: "bg-blue-50 text-blue-700",
    },
    {
      title: "Security Alerts",
      value: stats.security_alerts,
      description: "Denied activity records",
      icon: ShieldAlert,
      iconStyle: "bg-amber-50 text-amber-700",
    },
  ];

  return (
    <div className="min-w-0 space-y-4 pb-6 sm:space-y-6 sm:pb-8">
      {/* Page header */}
      <section className="flex min-w-0 items-start justify-between gap-2">
        <div className="min-w-0">
          <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight text-slate-900 sm:gap-3 sm:text-3xl">
            <Activity
              size={24}
              className="shrink-0 text-emerald-600 sm:h-8 sm:w-8"
            />
            Activity Logs
          </h1>

          <p className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm">
            Monitor website visits, guest activity, and system events.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadLogs()}
          disabled={loading}
          className="inline-flex min-h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50 sm:min-h-11 sm:gap-2 sm:rounded-xl sm:px-4 sm:text-sm"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </section>

      {/* Statistics cards */}
      <section className="grid grid-cols-2 gap-2 sm:gap-4 xl:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;

          return (
            <article
              key={card.title}
              className="min-w-0 rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition hover:border-emerald-200 hover:shadow-md sm:rounded-2xl sm:p-5"
            >
              <div className="flex items-start justify-between gap-1.5">
                <p className="min-w-0 text-[11px] font-semibold leading-tight text-slate-500 sm:text-sm">
                  {card.title}
                </p>

                <div
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg sm:h-10 sm:w-10 sm:rounded-xl",
                    card.iconStyle,
                  )}
                >
                  <Icon size={17} />
                </div>
              </div>

              <p className="mt-2 break-words text-2xl font-black leading-none tracking-tight text-slate-900 sm:mt-3 sm:text-3xl">
                {formatNumber(card.value)}
              </p>

              <p className="mt-2 text-[9px] leading-4 text-slate-400 sm:mt-3 sm:text-xs">
                {card.description}
              </p>
            </article>
          );
        })}
      </section>

      {/* Activity records */}
      <section className="min-w-0 overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm sm:rounded-2xl">
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 bg-white px-3 py-3 sm:px-5 sm:py-4">
          <h2 className="flex min-w-0 items-center gap-2 text-sm font-bold text-slate-900 sm:text-base">
            <FileText size={17} className="shrink-0" />
            <span>Recent Activities</span>
          </h2>

          <span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-[9px] font-semibold text-slate-600 sm:px-3 sm:text-xs">
            {formatNumber(total)} records
          </span>
        </div>

        {error && (
          <div
            role="alert"
            className="m-3 rounded-xl border border-red-100 bg-red-50 p-3 sm:m-4"
          >
            <p className="text-xs leading-5 text-red-700 sm:text-sm">{error}</p>

            <button
              type="button"
              onClick={() => void loadLogs()}
              className="mt-2 text-xs font-bold text-red-800 underline"
            >
              Try again
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex min-h-32 flex-col items-center justify-center gap-2 p-6">
            <Loader2 size={25} className="animate-spin text-emerald-600" />
            <p className="text-xs text-slate-500">
              Loading activity records...
            </p>
          </div>
        ) : logs.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <Activity size={28} className="mx-auto text-slate-300" />
            <p className="mt-2 text-sm font-bold text-slate-600">
              No activities found
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Activity records will appear here when available.
            </p>
          </div>
        ) : (
          <>
            {/* Mobile: compact activity cards */}
            <div className="divide-y divide-slate-100 sm:hidden">
              {logs.map((log) => (
                <article key={log.id} className="min-w-0 p-3">
                  <div className="flex min-w-0 items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="break-words text-xs font-extrabold text-slate-800">
                        {log.userName || "Guest"}
                      </p>
                      <p className="mt-0.5 break-all text-[10px] text-slate-400">
                        {log.userEmail || "-"}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setDetailLog(log)}
                      aria-label={`View details for ${log.activity}`}
                      className="shrink-0 rounded-lg p-2 text-slate-400 transition hover:bg-emerald-50 hover:text-emerald-700"
                    >
                      <Eye size={16} />
                    </button>
                  </div>

                  <p className="mt-2 break-words text-xs font-semibold leading-5 text-slate-700">
                    {log.activity}
                  </p>

                  <p className="mt-1 text-[10px] text-slate-400">{log.time}</p>

                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <span
                      className={cn(
                        "rounded-full px-2 py-1 text-[9px] font-bold",
                        TYPE_COLORS[log.type] ?? "bg-slate-100 text-slate-600",
                      )}
                    >
                      {log.type}
                    </span>

                    <span
                      className={cn(
                        "rounded-full px-2 py-1 text-[9px] font-bold",
                        STATUS_COLORS[log.status] ??
                          "bg-slate-100 text-slate-600",
                      )}
                    >
                      {log.status}
                    </span>
                  </div>
                </article>
              ))}
            </div>

            {/* Desktop: activity table */}
            <div className="hidden w-full overflow-x-auto sm:block">
              <table className="w-full min-w-[650px] text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70">
                    {[
                      "Time",
                      "User",
                      "Activity",
                      "Type",
                      "Status",
                      "Details",
                    ].map((heading) => (
                      <th
                        key={heading}
                        className="whitespace-nowrap px-4 py-3 text-left text-[11px] font-extrabold uppercase tracking-wider text-slate-600"
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {logs.map((log) => (
                    <tr
                      key={log.id}
                      className="border-b border-slate-50 transition hover:bg-slate-50/70"
                    >
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">
                        {log.time}
                      </td>

                      <td className="max-w-[170px] px-4 py-3">
                        <p className="break-words text-xs font-bold text-slate-800">
                          {log.userName || "Guest"}
                        </p>
                        <p className="break-all text-[10px] text-slate-400">
                          {log.userEmail || "-"}
                        </p>
                      </td>

                      <td className="max-w-[220px] break-words px-4 py-3 text-xs text-slate-700">
                        {log.activity}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3">
                        <span
                          className={cn(
                            "rounded-full px-2 py-1 text-[10px] font-bold",
                            TYPE_COLORS[log.type] ??
                              "bg-slate-100 text-slate-600",
                          )}
                        >
                          {log.type}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-4 py-3">
                        <span
                          className={cn(
                            "rounded-full px-2 py-1 text-[10px] font-bold",
                            STATUS_COLORS[log.status] ??
                              "bg-slate-100 text-slate-600",
                          )}
                        >
                          {log.status}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => setDetailLog(log)}
                          aria-label={`View details for ${log.activity}`}
                          className="rounded-lg p-2 text-slate-400 transition hover:bg-emerald-50 hover:text-emerald-700"
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Pagination */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-3 py-3 sm:px-5 sm:py-4">
          <p className="text-[10px] text-slate-500 sm:text-xs">
            {total === 0
              ? "Showing 0 activities"
              : `Showing ${(page - 1) * PER_PAGE + 1}-${Math.min(
                  page * PER_PAGE,
                  total,
                )} of ${formatNumber(total)}`}
          </p>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={page <= 1 || loading}
              aria-label="Previous page"
              className="rounded-lg p-1.5 text-slate-600 transition hover:bg-slate-100 disabled:opacity-40 sm:p-2"
            >
              <ChevronLeft size={16} />
            </button>

            <span className="whitespace-nowrap px-1 text-[10px] font-bold text-slate-700 sm:text-xs">
              Page {page} of {totalPages}
            </span>

            <button
              type="button"
              onClick={() =>
                setPage((current) => Math.min(totalPages, current + 1))
              }
              disabled={page >= totalPages || loading}
              aria-label="Next page"
              className="rounded-lg p-1.5 text-slate-600 transition hover:bg-slate-100 disabled:opacity-40 sm:p-2"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* Activity details modal */}
      {detailLog && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-900/50 p-0 backdrop-blur-sm sm:items-center sm:p-4">
          <button
            type="button"
            aria-label="Close details"
            onClick={() => setDetailLog(null)}
            className="absolute inset-0"
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="activity-details-title"
            className="relative max-h-[85dvh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-white p-4 shadow-2xl sm:rounded-2xl sm:p-6"
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2
                id="activity-details-title"
                className="text-base font-black text-slate-900 sm:text-lg"
              >
                Activity Details
              </h2>

              <button
                type="button"
                onClick={() => setDetailLog(null)}
                aria-label="Close activity details"
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-1">
              <DetailRow
                icon={<CalendarClock size={15} />}
                label="Time"
                value={detailLog.time}
              />
              <DetailRow
                icon={<Users size={15} />}
                label="User"
                value={detailLog.userName || "Guest"}
              />
              <DetailRow
                icon={<Mail size={15} />}
                label="Email"
                value={detailLog.userEmail || "-"}
              />
              <DetailRow
                icon={<Activity size={15} />}
                label="Activity"
                value={detailLog.activity}
              />
              <DetailRow
                icon={<FileText size={15} />}
                label="Type"
                value={detailLog.type}
              />
              <DetailRow
                icon={<ShieldAlert size={15} />}
                label="Status"
                value={detailLog.status}
              />
              <DetailRow
                icon={<FileText size={15} />}
                label="Details"
                value={detailLog.details || "-"}
              />
              <DetailRow
                icon={<Monitor size={15} />}
                label="IP address"
                value={detailLog.ip || "Not available"}
              />
            </div>

            <button
              type="button"
              onClick={() => setDetailLog(null)}
              className="mt-4 min-h-10 w-full rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

interface DetailRowProps {
  icon: ReactNode;
  label: string;
  value: string;
}

function DetailRow({ icon, label, value }: DetailRowProps) {
  return (
    <div className="flex items-start gap-2.5 border-b border-slate-100 py-2.5 text-xs sm:gap-3 sm:text-sm">
      <span className="mt-0.5 shrink-0 text-emerald-700">{icon}</span>

      <span className="w-20 shrink-0 text-slate-500 sm:w-24">{label}</span>

      <span className="min-w-0 flex-1 break-words text-right font-semibold text-slate-800">
        {value}
      </span>
    </div>
  );
}
