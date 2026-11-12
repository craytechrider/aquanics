import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "https://aquanics.site/api";
const BACKEND_URL = API_URL.replace(/\/api\/?$/, "");

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// ============================================================
// AUTH TOKEN INTERCEPTOR
// ============================================================

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("auth_token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// ============================================================
// HANDLE 401 RESPONSES
// ============================================================

api.interceptors.response.use(
  (response) => response,

  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_user");

      window.location.href = "/login";
    }

    return Promise.reject(error);
  },
);

// ============================================================
// AUTH
// ============================================================

export const authApi = {
  login: (email: string, password: string) =>
    api.post("/login", {
      email,
      password,
    }),

  startGoogleLogin: () => {
    window.location.assign(`${BACKEND_URL}/auth/google/redirect`);
  },

  exchangeGoogleCode: (code: string) =>
    api.post("/auth/google/exchange", { code }),

  register: (data: { name: string; email: string; password: string }) =>
    api.post("/register", data),

  logout: () => api.post("/logout"),

  getUser: () => api.get("/user"),

  updateProfile: (data: { name?: string; email?: string; phone?: string }) =>
    api.put("/user/profile", data),
};

// ============================================================
// DASHBOARD
// ============================================================

export const dashboardApi = {
  getData: () => api.get("/dashboard"),

  toggleDevice: (id: number) => api.patch(`/devices/${id}/toggle`),
};

// ============================================================
// SENSORS
// ============================================================

export const sensorApi = {
  getAll: () => api.get("/sensors"),

  update: (
    id: number,
    data: {
      value?: number;
      status?: string;
      trend?: string;
    },
  ) => api.put(`/sensors/${id}`, data),
};

// ============================================================
// AUTOMATION
// ============================================================

export const automationApi = {
  getAll: () => api.get("/automation"),

  createRule: (data: any) => api.post("/automation/rules", data),

  toggleRule: (id: number) => api.patch(`/automation/rules/${id}/toggle`),

  deleteRule: (id: number) => api.delete(`/automation/rules/${id}`),

  createSchedule: (data: any) => api.post("/automation/schedules", data),

  updateSchedule: (id: number, data: any) =>
    api.patch(`/automation/schedules/${id}`, data),
};

// ============================================================
// ANALYTICS
// ============================================================

export const analyticsApi = {
  getData: () => api.get("/analytics"),
};

// ============================================================
// REPORTS
// ============================================================

export const reportApi = {
  getAll: () => api.get("/reports"),

  create: (data: { name: string; type?: string }) => api.post("/reports", data),
};

// ============================================================
// SETTINGS
// ============================================================

export const settingsApi = {
  getData: () => api.get("/settings"),

  updateProfile: (data: {
    name?: string;
    email?: string;
    phone?: string;
    avatar?: string;
  }) => api.put("/settings/profile", data),

  updateAvatar: (file: File) => {
    const formData = new FormData();

    formData.append("avatar", file);
    formData.append("_method", "PUT");

    return api.post("/settings/profile", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  changePassword: (data: { current_password: string; new_password: string }) =>
    api.put("/settings/password", data),

  addDevice: (data: { name: string; device_id: string }) =>
    api.post("/settings/devices", data),
};

// ============================================================
// PUSH NOTIFICATIONS
// ============================================================

export const pushNotificationApi = {
  /**
   * Register the browser's Firebase Cloud Messaging token.
   *
   * The Laravel backend automatically identifies the
   * currently logged-in user using the auth_token.
   */
  registerToken: (data: {
    token: string;
    device_name?: string;
    platform?: string;
  }) => api.post("/push-tokens", data),

  /**
   * Remove a registered FCM token.
   */
  removeToken: (token: string) =>
    api.delete("/push-tokens", {
      data: {
        token,
      },
    }),
};

// ============================================================
// ALERTS
// ============================================================

export const alertApi = {
  getAll: () => api.get("/alerts"),

  markRead: (id: number) => api.patch(`/alerts/${id}/read`),
};

// ============================================================
// ADMIN
// ============================================================

export const adminApi = {
  getDashboard: () => api.get("/admin/dashboard"),

  // ----------------------------------------------------------
  // USERS
  // ----------------------------------------------------------

  getUsers: (params?: { search?: string; role?: string }) =>
    api.get("/admin/users", {
      params,
    }),

  createUser: (data: {
    name: string;
    email: string;
    password: string;
    role: string;
    phone?: string;
  }) => api.post("/admin/users", data),

  updateUser: (
    id: number,
    data: {
      name?: string;
      email?: string;
      role?: string;
      phone?: string;
      password?: string;
    },
  ) => api.put(`/admin/users/${id}`, data),

  deleteUser: (id: number) => api.delete(`/admin/users/${id}`),

  // ----------------------------------------------------------
  // SENSORS
  // ----------------------------------------------------------

  getSensors: (params?: { search?: string; status?: string }) =>
    api.get("/admin/sensors", {
      params,
    }),

  updateSensor: (
    id: number,
    data: {
      name?: string;
      value?: number;
      status?: string;
      trend?: string;
    },
  ) => api.put(`/admin/sensors/${id}`, data),

  // ----------------------------------------------------------
  // DEVICES
  // ----------------------------------------------------------

  getDevices: (params?: { search?: string }) =>
    api.get("/admin/devices", {
      params,
    }),

  toggleDevice: (id: number) => api.patch(`/admin/devices/${id}/toggle`),

  // ----------------------------------------------------------
  // ALERTS
  // ----------------------------------------------------------

  getAlerts: (params?: { severity?: string }) =>
    api.get("/admin/alerts", {
      params,
    }),

  deleteAlert: (id: number) => api.delete(`/admin/alerts/${id}`),

  // ----------------------------------------------------------
  // ACTIVITY LOGS
  // ----------------------------------------------------------

  getActivityLogs: (params?: {
    type?: string;
    status?: string;
    per_page?: number;
    page?: number;
  }) =>
    api.get("/admin/activity-logs", {
      params,
    }),

  // ----------------------------------------------------------
  // ADMIN SETTINGS
  // ----------------------------------------------------------

  getSettings: () => api.get("/admin/settings"),

  updateSettings: (group: string, settings: Record<string, any>) =>
    api.put("/admin/settings", {
      group,
      settings,
    }),
};

export default api;
