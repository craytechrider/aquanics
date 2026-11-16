import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, Bell, X } from "lucide-react";
import { useNavigate } from "react-router";
import { alertApi } from "../../lib/api";
import { cn } from "../../lib/utils";

interface Notification {
  id: number;
  title?: string;
  message?: string;
  severity: string;
  is_read: boolean | number | string;
  sensor?: string | null;
  route?: string | null;
  created_at?: string;
  time?: string;
  type?: string;
  category?: string;
}

interface NotificationBellProps {
  dashboardPath: string;
  sensorPath: string;
  theme?: "dark" | "light";
}

function isNotificationList(value: unknown): value is Notification[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        typeof item === "object" &&
        item !== null &&
        "id" in item &&
        typeof item.id === "number" &&
        "severity" in item &&
        typeof item.severity === "string" &&
        "is_read" in item,
    )
  );
}

export function NotificationBell({
  dashboardPath,
  sensorPath,
  theme = "dark",
}: NotificationBellProps) {
  const navigate = useNavigate();
  const bellRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [alerts, setAlerts] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [markingRead, setMarkingRead] = useState<number | null>(null);

  const loadAlerts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await alertApi.getAll();
      const payload: unknown = response.data;
      const data =
        typeof payload === "object" && payload !== null && "alerts" in payload
          ? payload.alerts
          : payload;
      if (!isNotificationList(data)) {
        throw new Error("The notifications response has an invalid format.");
      }
      setAlerts(data);
    } catch (error) {
      console.error("Failed to load notifications:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAlerts();
    const interval = window.setInterval(() => void loadAlerts(), 10000);
    return () => window.clearInterval(interval);
  }, [loadAlerts]);

  useEffect(() => {
    if (open) void loadAlerts();
  }, [open, loadAlerts]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isRead = (alert: Notification) =>
    alert.is_read === true || alert.is_read === 1 || alert.is_read === "1";
  const unreadCount = alerts.filter((alert) => !isRead(alert)).length;

  const markRead = async (alert: Notification) => {
    if (isRead(alert)) return;
    try {
      setMarkingRead(alert.id);
      await alertApi.markRead(alert.id);
      setAlerts((current) =>
        current.map((item) =>
          item.id === alert.id ? { ...item, is_read: true } : item,
        ),
      );
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    } finally {
      setMarkingRead(null);
    }
  };

  const markAllRead = async () => {
    const unread = alerts.filter((alert) => !isRead(alert));
    try {
      await Promise.all(unread.map((alert) => alertApi.markRead(alert.id)));
      setAlerts((current) =>
        current.map((alert) => ({ ...alert, is_read: true })),
      );
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
      void loadAlerts();
    }
  };

  const openNotification = async (alert: Notification) => {
    await markRead(alert);
    let route = alert.route;
    if (dashboardPath.startsWith("/admin")) {
      if (!route || route === "/alerts") route = "/admin/alerts";
      else if (route === "/sensors") route = sensorPath;
    } else if (!route && (alert.sensor || alert.type === "sensor")) {
      route = sensorPath;
    }

    setOpen(false);
    if (route) navigate(route);
  };

  const severityColor =
    theme === "dark"
      ? "text-slate-400 hover:bg-white/5 hover:text-emerald-400"
      : "text-slate-500 hover:bg-slate-100 hover:text-emerald-700";

  return (
    <div className="relative" ref={bellRef}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={cn(
          "relative rounded-xl p-2.5 transition-colors",
          open ? "bg-emerald-50 text-emerald-700" : severityColor,
        )}
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
        aria-expanded={open}
      >
        <Bell size={22} />
        {unreadCount > 0 && (
          <span
            className={cn(
              "absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white",
              theme === "dark" ? "ring-2 ring-slate-900" : "ring-2 ring-white",
            )}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed right-3 top-[76px] z-[10000] w-[calc(100vw-24px)] max-w-[350px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl sm:absolute sm:right-0 sm:top-full sm:mt-3 sm:w-[350px] sm:max-w-[calc(100vw-2rem)]">
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-4">
            <div className="min-w-0">
              <h4 className="font-display font-bold text-slate-800">
                Notifications
              </h4>
              <p className="mt-0.5 text-[11px] text-slate-400">
                {unreadCount
                  ? `${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}`
                  : "You're all caught up"}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => void markAllRead()}
                  className="whitespace-nowrap rounded-lg px-2 py-1 text-[11px] font-bold text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                >
                  Mark all read
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                aria-label="Close notifications"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="max-h-[420px] overflow-y-auto">
            {loading && alerts.length === 0 && (
              <p className="p-8 text-center text-sm font-medium text-slate-400">
                Loading notifications...
              </p>
            )}
            {!loading && alerts.length === 0 && (
              <div className="p-8 text-center">
                <Bell size={22} className="mx-auto mb-3 text-slate-400" />
                <p className="text-sm font-bold text-slate-700">
                  No notifications
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  New system alerts will appear here.
                </p>
              </div>
            )}
            {alerts.map((alert) => {
              const read = isRead(alert);
              const critical = alert.severity === "critical";
              const warning = ["warning", "caution"].includes(alert.severity);
              return (
                <button
                  type="button"
                  key={alert.id}
                  onClick={() => void openNotification(alert)}
                  className={cn(
                    "flex w-full items-start gap-3 border-b border-slate-100 px-5 py-4 text-left transition-colors",
                    read ? "bg-white hover:bg-slate-50" : "bg-emerald-50/40 hover:bg-emerald-50",
                  )}
                >
                  <div
                    className={cn(
                      "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                      critical ? "bg-red-50 text-red-500" : warning ? "bg-amber-50 text-amber-500" : "bg-blue-50 text-blue-500",
                    )}
                  >
                    {critical || warning ? (
                      <AlertTriangle size={17} />
                    ) : (
                      <Bell size={17} />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={cn("truncate text-sm text-slate-800", !read && "font-bold")}>
                      {alert.title || "System Notification"}
                    </p>
                    <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                      {alert.message || "A new system event has occurred."}
                    </p>
                    <p className="mt-2 truncate text-[10px] text-slate-400">
                      {alert.time || alert.created_at || "Recently"}
                      {alert.sensor ? ` · ${alert.sensor}` : ""}
                    </p>
                  </div>
                  {!read && (
                    <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500">
                      {markingRead === alert.id && (
                        <span className="sr-only">Marking as read</span>
                      )}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {alerts.length > 0 && (
            <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-5 py-3">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  navigate(dashboardPath);
                }}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700"
              >
                View Dashboard
              </button>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  navigate(sensorPath);
                }}
                className="text-xs font-bold text-slate-500 hover:text-slate-700"
              >
                View Sensors
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
