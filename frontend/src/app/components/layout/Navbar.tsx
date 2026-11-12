import { useState, useEffect, useRef, useCallback } from "react";
import { Bell, Menu, X, AlertTriangle } from "lucide-react";
import logo from "../../../assets/bf2f001026d6edc1e3beec70ce5240dc1734a24f.png";
import { useLocation, useNavigate } from "react-router";
import { useAuth } from "../../contexts/AuthContext";
import { alertApi } from "../../lib/api";
import { cn } from "../../lib/utils";

export function Navbar({ onMenuClick }: { onMenuClick: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [showNotifications, setShowNotifications] = useState(false);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loadingAlerts, setLoadingAlerts] = useState(false);
  const [markingRead, setMarkingRead] = useState<number | null>(null);

  const bellRef = useRef<HTMLDivElement | null>(null);

  const defaultAvatar =
    "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80";

  const pathTitleMap: Record<string, string> = {
    "/dashboard": "Dashboard",
    "/sensors": "Sensor Readings",
    "/automation": "Automation",
    "/analytics": "AI & Predictive Analytics",
    "/settings": "Settings",
    "/reports": "Reports",
    "/learning": "Learning Center",
  };

  const pathname = location.pathname;
  const pageTitle = pathTitleMap[pathname] || "AQUANICS";

  /*
   * ---------------------------------------------------------
   * LOAD REAL NOTIFICATIONS
   * ---------------------------------------------------------
   */

  const loadAlerts = useCallback(async () => {
    try {
      setLoadingAlerts(true);

      const res = await alertApi.getAll();

      const data = Array.isArray(res.data) ? res.data : res.data?.alerts || [];

      setAlerts(data);
    } catch (error) {
      console.error("Failed to load notifications:", error);
    } finally {
      setLoadingAlerts(false);
    }
  }, []);

  /*
   * ---------------------------------------------------------
   * INITIAL NOTIFICATION LOAD
   * ---------------------------------------------------------
   */

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  /*
   * ---------------------------------------------------------
   * AUTOMATIC NOTIFICATION CHECK
   * EVERY 10 SECONDS
   * ---------------------------------------------------------
   */

  useEffect(() => {
    const interval = setInterval(() => {
      loadAlerts();
    }, 10000);

    return () => clearInterval(interval);
  }, [loadAlerts]);

  /*
   * ---------------------------------------------------------
   * REFRESH WHEN DROPDOWN OPENS
   * ---------------------------------------------------------
   */

  useEffect(() => {
    if (showNotifications) {
      loadAlerts();
    }
  }, [showNotifications, loadAlerts]);

  /*
   * ---------------------------------------------------------
   * CLOSE NOTIFICATION DROPDOWN WHEN CLICKING OUTSIDE
   * ---------------------------------------------------------
   */

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  /*
   * ---------------------------------------------------------
   * HELPERS
   * ---------------------------------------------------------
   */

  const isRead = (alert: any) => {
    return (
      alert.is_read === true || alert.is_read === 1 || alert.is_read === "1"
    );
  };

  const unreadCount = alerts.filter((alert) => !isRead(alert)).length;

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-500";

      case "warning":
      case "caution":
        return "bg-amber-500";

      case "success":
        return "bg-emerald-500";

      default:
        return "bg-blue-500";
    }
  };

  const getSeverityBackground = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-50";

      case "warning":
      case "caution":
        return "bg-amber-50";

      case "success":
        return "bg-emerald-50";

      default:
        return "bg-blue-50";
    }
  };

  /*
   * ---------------------------------------------------------
   * MARK NOTIFICATION AS READ
   * ---------------------------------------------------------
   */

  const handleMarkRead = async (id: number, alreadyRead: boolean) => {
    if (alreadyRead) return;

    try {
      setMarkingRead(id);

      await alertApi.markRead(id);

      setAlerts((prev) =>
        prev.map((alert) =>
          alert.id === id
            ? {
                ...alert,
                is_read: true,
              }
            : alert,
        ),
      );
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    } finally {
      setMarkingRead(null);
    }
  };

  /*
   * ---------------------------------------------------------
   * MARK ALL AS READ
   * ---------------------------------------------------------
   */

  const handleMarkAllRead = async () => {
    const unreadAlerts = alerts.filter((alert) => !isRead(alert));

    if (unreadAlerts.length === 0) return;

    try {
      await Promise.all(
        unreadAlerts.map((alert) => alertApi.markRead(alert.id)),
      );

      setAlerts((prev) =>
        prev.map((alert) => ({
          ...alert,
          is_read: true,
        })),
      );
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  };

  /*
   * ---------------------------------------------------------
   * OPEN NOTIFICATION
   * ---------------------------------------------------------
   */

  const handleNotificationClick = async (alert: any) => {
    await handleMarkRead(alert.id, isRead(alert));

    /*
     * If backend provides a route:
     *
     * alert.route = "/sensors"
     */

    if (alert.route) {
      setShowNotifications(false);
      navigate(alert.route);
      return;
    }

    /*
     * Sensor-related notifications
     * go to Sensor Readings.
     */

    if (
      alert.sensor ||
      alert.type === "sensor" ||
      alert.category === "sensor"
    ) {
      setShowNotifications(false);
      navigate("/sensors");
    }
  };

  /*
   * ---------------------------------------------------------
   * UI
   * ---------------------------------------------------------
   */

  return (
    <header className="sticky top-0 z-[9999] h-20 bg-slate-900 border-b border-slate-800 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
      {/* =====================================================
          LEFT SIDE
      ===================================================== */}

      <div className="flex items-center gap-4 min-w-0">
        <img
          src={logo}
          alt="AQUANICS"
          className="h-9 w-auto object-contain shrink-0"
        />

        <div className="h-7 w-px bg-slate-700 hidden sm:block"></div>

        <h1 className="text-lg sm:text-xl font-display font-bold text-white truncate">
          {pageTitle}
        </h1>
      </div>

      {/* =====================================================
          RIGHT SIDE
      ===================================================== */}

      <div className="flex items-center gap-3 sm:gap-5 shrink-0">
        {/* =====================================================
            NOTIFICATION BELL
        ===================================================== */}

        <div className="relative" ref={bellRef}>
          <button
            onClick={() => setShowNotifications((prev) => !prev)}
            className={cn(
              "relative p-2.5 rounded-xl transition-all duration-300",
              showNotifications
                ? "bg-white/10 text-emerald-400"
                : "text-slate-400 hover:text-emerald-400 hover:bg-white/5",
            )}
            aria-label="Notifications"
          >
            <Bell size={22} />

            {/* UNREAD BADGE */}

            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 bg-red-500 rounded-full ring-2 ring-slate-900 text-[10px] font-bold text-white flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {/* =====================================================
              NOTIFICATION DROPDOWN
          ===================================================== */}

          {showNotifications && (
            <div
              className="
                fixed
                top-[76px]
                right-3
                w-[calc(100vw-24px)]
                max-w-[350px]
                bg-white
                rounded-2xl
                shadow-2xl
                border
                border-slate-200
                overflow-hidden
                z-[10000]

                sm:absolute
                sm:top-full
                sm:right-0
                sm:mt-3
                sm:w-[350px]
                sm:max-w-[calc(100vw-2rem)]
              "
            >
              {/* =================================================
                  HEADER
              ================================================= */}

              <div className="flex items-center justify-between px-5 py-4 bg-slate-50 border-b border-slate-100">
                <div className="min-w-0">
                  <h4 className="font-display font-bold text-slate-800">
                    Notifications
                  </h4>

                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {unreadCount > 0
                      ? `${unreadCount} unread notification${
                          unreadCount > 1 ? "s" : ""
                        }`
                      : "You're all caught up"}
                  </p>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 px-2 py-1 rounded-lg hover:bg-emerald-50 whitespace-nowrap"
                    >
                      Mark all read
                    </button>
                  )}

                  <button
                    onClick={() => setShowNotifications(false)}
                    className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
                    aria-label="Close notifications"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* =================================================
                  NOTIFICATIONS LIST
              ================================================= */}

              <div className="max-h-[420px] overflow-y-auto">
                {/* LOADING */}

                {loadingAlerts && (
                  <div className="p-8 text-center">
                    <div className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-emerald-50 text-emerald-600 mb-3">
                      <div className="h-5 w-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>

                    <p className="text-sm font-medium text-slate-400">
                      Loading notifications...
                    </p>
                  </div>
                )}

                {/* EMPTY */}

                {!loadingAlerts && alerts.length === 0 && (
                  <div className="p-8 text-center">
                    <div className="mx-auto h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                      <Bell size={22} className="text-slate-400" />
                    </div>

                    <p className="text-sm font-bold text-slate-700">
                      No notifications
                    </p>

                    <p className="text-xs text-slate-400 mt-1">
                      New sensor alerts will appear here.
                    </p>
                  </div>
                )}

                {/* ALERTS */}

                {!loadingAlerts &&
                  alerts.map((alert) => {
                    const read = isRead(alert);

                    return (
                      <button
                        key={alert.id}
                        onClick={() => handleNotificationClick(alert)}
                        className={cn(
                          "w-full text-left px-5 py-4 border-b border-slate-100 transition-colors flex items-start gap-3",
                          read
                            ? "bg-white hover:bg-slate-50"
                            : "bg-emerald-50/40 hover:bg-emerald-50",
                        )}
                      >
                        {/* SEVERITY ICON */}

                        <div
                          className={cn(
                            "mt-0.5 h-9 w-9 rounded-xl flex items-center justify-center shrink-0",
                            getSeverityBackground(alert.severity),
                          )}
                        >
                          {alert.severity === "critical" ||
                          alert.severity === "warning" ||
                          alert.severity === "caution" ? (
                            <AlertTriangle
                              size={17}
                              className={
                                alert.severity === "critical"
                                  ? "text-red-500"
                                  : "text-amber-500"
                              }
                            />
                          ) : (
                            <Bell size={17} className="text-blue-500" />
                          )}
                        </div>

                        {/* CONTENT */}

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                "h-2 w-2 rounded-full shrink-0",
                                getSeverityColor(alert.severity),
                              )}
                            />

                            <p
                              className={cn(
                                "text-sm text-slate-800 truncate",
                                !read && "font-bold",
                              )}
                            >
                              {alert.title || "System Notification"}
                            </p>
                          </div>

                          <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                            {alert.message ||
                              "A new system event has occurred."}
                          </p>

                          <div className="flex items-center gap-2 mt-2">
                            <p className="text-[10px] text-slate-400 truncate">
                              {alert.time || alert.created_at || "Recently"}
                            </p>

                            {alert.sensor && (
                              <>
                                <span className="text-slate-300">•</span>

                                <span className="text-[10px] font-bold text-slate-400 truncate">
                                  {alert.sensor}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* READ INDICATOR */}

                        {!read && (
                          <div className="shrink-0 mt-1">
                            {markingRead === alert.id ? (
                              <div className="h-4 w-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <span className="h-2.5 w-2.5 bg-emerald-500 rounded-full block"></span>
                            )}
                          </div>
                        )}
                      </button>
                    );
                  })}
              </div>

              {/* =================================================
                  FOOTER
              ================================================= */}

              {alerts.length > 0 && (
                <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => {
                      setShowNotifications(false);
                      navigate("/dashboard");
                    }}
                    className="text-xs font-bold text-emerald-600 hover:text-emerald-700"
                  >
                    View Dashboard
                  </button>

                  <button
                    onClick={() => {
                      setShowNotifications(false);
                      navigate("/sensors");
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

        {/* =====================================================
            MOBILE MENU
        ===================================================== */}

        <button
          onClick={onMenuClick}
          className="p-2 text-slate-400 hover:bg-white/10 hover:text-white rounded-xl lg:hidden transition-colors"
          aria-label="Open menu"
        >
          <Menu size={24} />
        </button>

        <div className="h-8 w-px bg-slate-700 hidden sm:block"></div>

        {/* =====================================================
            PROFILE
        ===================================================== */}

        <div
          onClick={() => navigate("/settings")}
          className="flex items-center gap-3 sm:gap-4 pl-1 cursor-pointer group"
          title="Go to Settings"
        >
          <div className="hidden sm:block text-right">
            <p className="text-sm font-bold text-slate-200 font-display group-hover:text-emerald-400 transition-colors">
              {user?.name || "User"}
            </p>

            <p className="text-xs font-medium text-slate-500">
              {user?.role || "farmer"}
            </p>
          </div>

          <div className="relative">
            <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-full p-0.5 bg-gradient-to-br from-emerald-400 to-cyan-500">
              <img
                src={user?.avatar || defaultAvatar}
                alt="User"
                className="h-full w-full rounded-full object-cover border-2 border-slate-900"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = defaultAvatar;
                }}
              />
            </div>

            <div className="absolute bottom-0 right-0 h-3.5 w-3.5 bg-emerald-500 rounded-full border-2 border-slate-900"></div>
          </div>
        </div>
      </div>
    </header>
  );
}
