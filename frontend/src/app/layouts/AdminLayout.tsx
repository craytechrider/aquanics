import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router";
import {
  Activity,
  AlertTriangle,
  BookOpen,
  Cpu,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Shield,
  Thermometer,
  Users,
  X,
} from "lucide-react";
import { cn } from "../lib/utils";
import logo from "../../assets/bf2f001026d6edc1e3beec70ce5240dc1734a24f.png";
import { useAuth } from "../contexts/AuthContext";

const ADMIN_NAV = [
  { label: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
  { label: "User Management", path: "/admin/users", icon: Users },
  { label: "Device Management", path: "/admin/devices", icon: Cpu },
  { label: "Sensor Management", path: "/admin/sensors", icon: Thermometer },
  { label: "Alert Management", path: "/admin/alerts", icon: AlertTriangle },
  { label: "Settings", path: "/admin/settings", icon: Settings },
  { label: "Activity Logs", path: "/admin/activity", icon: Activity },
  { label: "Admin Guide", path: "/admin/guide", icon: BookOpen },
];

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const initials = (user?.name || "AU")
    .split(" ")
    .map((name) => name[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-50 lg:flex">
      <button
        type="button"
        aria-label="Close admin navigation"
        tabIndex={sidebarOpen ? 0 : -1}
        onClick={() => setSidebarOpen(false)}
        className={cn(
          "fixed inset-0 z-40 bg-slate-950/60 transition-opacity lg:hidden",
          sidebarOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />

      <aside
        id="admin-navigation"
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-slate-900 text-white shadow-2xl transition-transform duration-300 lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-20 shrink-0 items-center gap-3 border-b border-slate-700/70 px-6">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 ring-1 ring-emerald-400/20">
            <img src={logo} alt="AQUANICS logo" className="h-8 w-8 object-contain" />
          </div>
          <div className="min-w-0">
            <p className="font-display text-lg font-bold tracking-tight text-white">
              AQUANICS
            </p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-300">
              Admin workspace
            </p>
          </div>
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setSidebarOpen(false)}
            className="ml-auto rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-white lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        <nav
          aria-label="Admin navigation"
          className="flex-1 space-y-1 overflow-y-auto px-4 py-6"
        >
          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
            Administration
          </p>
          {ADMIN_NAV.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  "group relative flex min-h-11 items-center gap-3 rounded-xl px-3.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-emerald-500/15 text-emerald-200"
                    : "text-slate-400 hover:bg-white/5 hover:text-white",
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute inset-y-2 left-0 w-1 rounded-r-full bg-emerald-400" />
                  )}
                  <item.icon
                    size={19}
                    className={cn(
                      "shrink-0 transition-colors",
                      isActive
                        ? "text-emerald-300"
                        : "text-slate-500 group-hover:text-emerald-300",
                    )}
                  />
                  <span className="truncate">{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-slate-700/70 p-4">
          <div className="mb-3 flex min-w-0 items-center gap-3 rounded-xl bg-white/5 p-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-bold text-emerald-200">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">
                {user?.name || "Admin User"}
              </p>
              <p className="flex items-center gap-1 text-[11px] text-slate-400">
                <Shield size={12} />
                Administrator
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3.5 text-sm font-semibold text-slate-400 transition-colors hover:bg-red-500/10 hover:text-red-300"
          >
            <LogOut size={18} />
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex min-h-screen min-w-0 flex-1 flex-col lg:ml-72">
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white/95 px-4 shadow-sm backdrop-blur sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              aria-label="Open admin navigation"
              aria-controls="admin-navigation"
              aria-expanded={sidebarOpen}
              onClick={() => setSidebarOpen(true)}
              className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-emerald-700 lg:hidden"
            >
              <Menu size={21} />
            </button>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-slate-900 sm:text-base">
                AQUANICS Administration
              </p>
              <p className="hidden text-xs text-slate-500 sm:block">
                System management workspace
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <span className="hidden text-sm font-medium text-slate-600 sm:block">
              {user?.name || "Admin User"}
            </span>
            <div
              aria-label={`Signed in as ${user?.name || "Admin User"}`}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-xs font-bold text-emerald-800 ring-1 ring-emerald-100"
            >
              {initials}
            </div>
          </div>
        </header>

        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto w-full max-w-7xl min-w-0">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
