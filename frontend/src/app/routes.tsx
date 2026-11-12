import { createBrowserRouter, Navigate, Outlet } from "react-router";

import DashboardLayout from "./layouts/DashboardLayout";
import AdminLayout from "./layouts/AdminLayout";
import AuthLayout from "./layouts/AuthLayout";

import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";

import LandingPage from "./pages/public/LandingPage";
import GuestDashboard from "./pages/guest/GuestDashboard";

import Dashboard from "./pages/dashboard/Dashboard";
import Automation from "./pages/automation/Automation";
import Analytics from "./pages/analytics/Analytics";
import Settings from "./pages/settings/Settings";
import Reports from "./pages/reports/Reports";
import Sensors from "./pages/sensors/Sensors";
import Learning from "./pages/learning/Learning";
import GrowthMeasurements from "./pages/growth/GrowthMeasurements";

import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminActivityLogs from "./pages/admin/AdminActivityLogs";
import AdminGuide from "./pages/admin/AdminGuide";

import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";

export const router = createBrowserRouter([
  {
    element: <Outlet />,
    children: [
      // ============================================================
      // PUBLIC ROUTES
      // ============================================================
      {
        path: "/",
        element: <Outlet />,
        children: [
          // Public landing page
          {
            index: true,
            element: <LandingPage />,
          },

          // Guest dashboard: read-only sensor monitoring
          {
            path: "guest/dashboard",
            element: <GuestDashboard />,
          },

          // Public Learning Center
          {
            path: "guest/learning",
            element: <Learning />,
          },

          // Authentication pages retain their existing layout
          {
            element: <AuthLayout />,
            children: [
              {
                path: "login",
                element: <Login />,
              },
              {
                path: "register",
                element: <Register />,
              },
            ],
          },
        ],
      },

      // ============================================================
      // PROTECTED USER ROUTES
      // ============================================================
      {
        element: <ProtectedRoute />,
        children: [
          {
            element: <DashboardLayout />,
            children: [
              {
                path: "dashboard",
                element: <Dashboard />,
              },
              {
                path: "sensors",
                element: <Sensors />,
              },
              {
                path: "automation",
                element: <Automation />,
              },
              {
                path: "analytics",
                element: <Analytics />,
              },
              {
                path: "growth/measurements",
                element: <GrowthMeasurements />,
              },
              {
                path: "reports",
                element: <Reports />,
              },
              {
                path: "learning",
                element: <Learning />,
              },
              {
                path: "settings",
                element: <Settings />,
              },
            ],
          },

          // ========================================================
          // ADMIN ROUTES
          // ========================================================
          {
            element: <AdminRoute />,
            children: [
              {
                element: <AdminLayout />,
                children: [
                  {
                    path: "admin/dashboard",
                    element: <AdminDashboard />,
                  },
                  {
                    path: "admin/users",
                    element: <AdminUsers />,
                  },
                  {
                    path: "admin/settings",
                    element: <AdminSettings />,
                  },
                  {
                    path: "admin/activity",
                    element: <AdminActivityLogs />,
                  },
                  {
                    path: "admin/guide",
                    element: <AdminGuide />,
                  },
                ],
              },
            ],
          },
        ],
      },

      // ============================================================
      // FALLBACK
      // ============================================================
      {
        path: "*",
        element: <Navigate to="/" replace />,
      },
    ],
  },
]);
