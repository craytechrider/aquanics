import { NavLink, useNavigate } from "react-router";

import {
  LayoutDashboard,
  Thermometer,
  Settings,
  Activity,
  FileText,
  Zap,
  LogOut,
  X,
  BookOpen,
  Shield,
  Ruler,
} from "lucide-react";

import { cn } from "../../lib/utils";
import logo from "../../../assets/bf2f001026d6edc1e3beec70ce5240dc1734a24f.png";
import { useAuth } from "../../contexts/AuthContext";

const NAV_ITEMS = [
  {
    label: "Dashboard",
    path: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Sensors",
    path: "/sensors",
    icon: Thermometer,
  },
  {
    label: "Automation",
    path: "/automation",
    icon: Zap,
  },
  {
    label: "Analytics",
    path: "/analytics",
    icon: Activity,
  },
  {
    label: "Growth Management",
    path: "/growth/measurements",
    icon: Ruler,
  },
  {
    label: "Reports",
    path: "/reports",
    icon: FileText,
  },
  {
    label: "Learning",
    path: "/learning",
    icon: BookOpen,
  },
  {
    label: "Settings",
    path: "/settings",
    icon: Settings,
  },
];

export function Sidebar({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <>
      {/* ============================================================
          MOBILE OVERLAY
      ============================================================ */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm transition-opacity lg:hidden",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
        onClick={onClose}
      />

      {/* ============================================================
          SIDEBAR
      ============================================================ */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-72",
          "bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900",
          "text-white shadow-2xl",
          "transition-transform duration-300",
          "lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* ==========================================================
            LOGO SECTION
        ========================================================== */}
        <div className="flex h-20 items-center gap-3 px-6 border-b border-slate-700/50 bg-slate-900/50 backdrop-blur-md">
          {/* Logo */}
          <div className="relative h-10 w-10 overflow-hidden rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 p-0.5 shadow-lg shadow-emerald-500/20">
            <div className="h-full w-full rounded-[10px] bg-slate-900 flex items-center justify-center">
              <img
                src={logo}
                alt="AQUANICS Logo"
                className="h-8 w-8 object-contain"
              />
            </div>
          </div>

          {/* Brand */}
          <div>
            <span className="block font-display font-bold text-xl tracking-tight bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              AQUANICS
            </span>

            <span className="block text-[10px] text-slate-500 tracking-widest">
              SMART AQUAPONICS
            </span>
          </div>

          {/* Mobile close */}
          <button
            onClick={onClose}
            className="lg:hidden ml-auto text-slate-400 hover:text-white transition-colors"
            aria-label="Close menu"
          >
            <X size={24} />
          </button>
        </div>

        {/* ==========================================================
            NAVIGATION
        ========================================================== */}
        <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100vh-5rem)] sidebar-nav-hide-scrollbar">
          {/* Main Menu */}
          <div className="mt-4 mb-2 px-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
            Main Menu
          </div>

          {/* Navigation Items */}
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  "group flex items-center gap-3 px-4 py-3.5 rounded-xl",
                  "text-sm font-medium transition-all duration-200",
                  "relative overflow-hidden",

                  isActive
                    ? "text-white shadow-lg shadow-emerald-500/10"
                    : "text-slate-400 hover:text-slate-100 hover:bg-white/5",
                )
              }
            >
              {({ isActive }) => (
                <>
                  {/* Active background */}
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-cyan-600" />
                  )}

                  {/* Hover background */}
                  {!isActive && (
                    <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}

                  {/* Icon + Label */}
                  <div className="relative z-10 flex items-center gap-3 min-w-0">
                    <item.icon
                      size={20}
                      className={cn(
                        "shrink-0 transition-colors",
                        isActive
                          ? "text-white"
                          : "text-slate-500 group-hover:text-emerald-400",
                      )}
                    />

                    <span className="font-display tracking-wide truncate">
                      {item.label}
                    </span>
                  </div>

                  {/* Active indicator */}
                  {isActive && (
                    <div className="absolute right-3 h-2 w-2 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.6)]" />
                  )}
                </>
              )}
            </NavLink>
          ))}

          {/* ========================================================
              SYSTEM
          ======================================================== */}
          <div className="mt-8 mb-2 px-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
            System
          </div>

          {/* System Information Card */}
          <div className="px-4 py-4 rounded-2xl bg-gradient-to-br from-emerald-900/30 to-cyan-900/30 border border-emerald-500/20">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-1.5 bg-emerald-500/20 rounded-lg text-emerald-400">
                <Activity size={16} />
              </div>

              <span className="text-xs font-semibold text-emerald-100 font-display">
                AQUANICS System
              </span>
            </div>

            <p className="text-[10px] text-slate-300 leading-relaxed">
              Sensor data, growth measurements, automation, and analytics are
              connected to your aquaponics system.
            </p>
          </div>

          {/* ========================================================
              ADMIN PANEL
          ======================================================== */}
          {user?.role === "Admin" && (
            <NavLink
              to="/admin/dashboard"
              onClick={onClose}
              className="group flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium text-violet-400 hover:text-violet-300 hover:bg-violet-500/10 transition-colors relative overflow-hidden mt-2"
            >
              <Shield
                size={20}
                className="text-violet-400 group-hover:text-violet-300"
              />

              <span className="font-display tracking-wide">Admin Panel</span>
            </NavLink>
          )}

          {/* ========================================================
              LOGOUT
          ======================================================== */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors text-left group mt-1"
          >
            <LogOut
              size={20}
              className="group-hover:translate-x-1 transition-transform"
            />

            <span className="font-display">Logout</span>
          </button>
        </nav>
      </aside>
    </>
  );
}
