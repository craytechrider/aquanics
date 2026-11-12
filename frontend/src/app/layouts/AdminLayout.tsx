import { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router";
import {
  LayoutDashboard,
  Users,
  Settings,
  Activity,
  BookOpen,
  LogOut,
  X,
  Menu,
  Crown,
} from "lucide-react";
import { cn } from "../lib/utils";
import logo from "../../assets/bf2f001026d6edc1e3beec70ce5240dc1734a24f.png";
import { useAuth } from "../contexts/AuthContext";

const ADMIN_NAV = [
  { label: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
  { label: "User Management", path: "/admin/users", icon: Users },
  { label: "Settings", path: "/admin/settings", icon: Settings },
  { label: "Activity Logs", path: "/admin/activity", icon: Activity },
  { label: "Admin Guide", path: "/admin/guide", icon: BookOpen },
];

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const initials = (user?.name || "AU")
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* ── Mobile Overlay ─────────────────────────────────── */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm transition-opacity lg:hidden",
          sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setSidebarOpen(false)}
      />

      {/* ── Sidebar ────────────────────────────────────────── */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-slate-200 shadow-lg transition-transform duration-300 lg:translate-x-0 flex flex-col",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="flex flex-col items-center py-6 px-4 border-b border-slate-100">
          <div className="relative h-16 w-16 overflow-hidden rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 p-0.5 shadow-lg shadow-emerald-500/20 mb-3">
            <div className="h-full w-full rounded-full bg-white flex items-center justify-center">
              <img src={logo} alt="Logo" className="h-10 w-10 object-contain" />
            </div>
          </div>
          <span className="font-display font-bold text-lg tracking-tight text-emerald-700">
            AQUANICS
          </span>
          <span className="text-xs text-slate-400 font-medium">
            Admin Control
          </span>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden absolute top-4 right-4 text-slate-400 hover:text-slate-600"
          >
            <X size={24} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {ADMIN_NAV.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-md shadow-emerald-200"
                    : "text-slate-600 hover:bg-slate-50 hover:text-emerald-700"
                )
              }
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-slate-100">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* ── Main Content ────────────────────────────────────── */}
      <div className="flex flex-col flex-1 min-h-screen lg:ml-64">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-xl lg:hidden transition-colors"
            >
              <Menu size={24} />
            </button>
            <Crown size={22} className="text-emerald-600" />
            <span className="font-display font-bold text-lg text-emerald-700">
              Admin Panel
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs text-slate-400">Logged in as</p>
              <p className="text-sm font-bold text-emerald-700">
                {user?.name || "Admin User"}
              </p>
            </div>
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
              {initials}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

