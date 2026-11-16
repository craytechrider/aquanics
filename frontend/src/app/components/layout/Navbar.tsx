import { Menu } from "lucide-react";
import logo from "../../../assets/bf2f001026d6edc1e3beec70ce5240dc1734a24f.png";
import { useLocation, useNavigate } from "react-router";
import { useAuth } from "../../contexts/AuthContext";
import { NotificationBell } from "./NotificationBell";

export function Navbar({ onMenuClick }: { onMenuClick: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const defaultAvatar =
    "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80";

  const pathTitleMap: Record<string, string> = {
    "/dashboard": "Dashboard",
    "/sensors": "Sensor Readings",
    "/automation": "Automation",
    "/analytics": "Predictive Forecasting",
    "/settings": "Settings",
    "/reports": "Reports",
    "/learning": "Learning Center",
  };

  const pathname = location.pathname;
  const pageTitle = pathTitleMap[pathname] || "AQUANICS";

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
        <NotificationBell dashboardPath="/dashboard" sensorPath="/sensors" />

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
