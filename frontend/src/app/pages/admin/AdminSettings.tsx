import { useEffect, useState } from "react";
import {
  Settings,
  Sliders,
  Bell,
  Shield,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { adminApi } from "../../lib/api";

const TABS = [
  { key: "general", label: "General", icon: Sliders },
  { key: "alerts", label: "Alerts", icon: Bell },
  { key: "security", label: "Security", icon: Shield },
];

const inputClass =
  "w-full min-w-0 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 sm:rounded-xl sm:px-4";

const labelClass = "mb-1.5 block text-xs font-bold text-slate-700 sm:text-sm";

const defaultGeneral = {
  systemName: "AQUANICS System",
  systemVersion: "v2.1.0",
  installDate: "February 15, 2026",
  systemStatus: "Operational",
  description:
    "IoT-based smart aquanics monitoring and management system with real-time sensor data collection, analytics, and automated alerts.",
  enableNotifications: true,
  enableDataLogging: true,
};

const defaultAlerts = {
  emailAlerts: true,
  smsAlerts: false,
  criticalOnly: false,
  alertFrequency: "immediate",
  emailRecipient: "admin@aquanics.com",
  maxAlertsPerDay: "50",
};

const defaultSecurity = {
  sessionTimeout: "30",
  requireMFA: false,
  passwordExpiry: "90",
  loginAttempts: "5",
  ipWhitelist: "",
  auditLogging: true,
};

type SettingsTab = "general" | "alerts" | "security";

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [error, setError] = useState("");

  const [general, setGeneral] = useState(defaultGeneral);
  const [alerts, setAlerts] = useState(defaultAlerts);
  const [security, setSecurity] = useState(defaultSecurity);

  useEffect(() => {
    let active = true;

    adminApi
      .getSettings()
      .then((res) => {
        if (!active) return;
        const data = res.data ?? {};

        if (data.general) {
          setGeneral({
            ...defaultGeneral,
            ...data.general,
            enableNotifications:
              data.general.enableNotifications === true ||
              data.general.enableNotifications === "true",
            enableDataLogging:
              data.general.enableDataLogging === true ||
              data.general.enableDataLogging === "true",
          });
        }

        if (data.alerts) {
          setAlerts({
            ...defaultAlerts,
            ...data.alerts,
            emailAlerts:
              data.alerts.emailAlerts === true ||
              data.alerts.emailAlerts === "true",
            smsAlerts:
              data.alerts.smsAlerts === true ||
              data.alerts.smsAlerts === "true",
            criticalOnly:
              data.alerts.criticalOnly === true ||
              data.alerts.criticalOnly === "true",
          });
        }

        if (data.security) {
          setSecurity({
            ...defaultSecurity,
            ...data.security,
            requireMFA:
              data.security.requireMFA === true ||
              data.security.requireMFA === "true",
            auditLogging:
              data.security.auditLogging === true ||
              data.security.auditLogging === "true",
          });
        }
      })
      .catch((err) => {
        console.error("Failed to load settings:", err);
        if (active) {
          setError(
            "Unable to load settings. You can retry by refreshing the page.",
          );
        }
      })
      .finally(() => {
        if (active) setLoadingSettings(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    setError("");

    const settingsMap = {
      general,
      alerts,
      security,
    };

    try {
      await adminApi.updateSettings(activeTab, settingsMap[activeTab]);
      setSaved(true);
    } catch (err: any) {
      console.error("Failed to save settings:", err);
      setError(
        err.response?.data?.message ||
          "Unable to save settings. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  const changeTab = (key: string) => {
    setActiveTab(key as SettingsTab);
    setSaved(false);
    setError("");
  };

  return (
    <div className="min-w-0 space-y-4 pb-6 sm:space-y-6">
      <header>
        <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight text-slate-900 sm:gap-3 sm:text-3xl">
          <Settings
            size={24}
            className="shrink-0 text-emerald-600 sm:h-8 sm:w-8"
          />
          System Settings
        </h1>
        <p className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm">
          Configure general preferences, alert delivery, and security options.
        </p>
      </header>

      {/* Responsive tabs */}
      <nav
        aria-label="Settings categories"
        className="-mx-1 flex min-w-0 gap-1.5 overflow-x-auto px-1 pb-1 sm:mx-0 sm:flex-wrap sm:gap-2 sm:overflow-visible sm:px-0"
      >
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const selected = activeTab === tab.key;

          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => changeTab(tab.key)}
              aria-current={selected ? "page" : undefined}
              className={cn(
                "inline-flex min-h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition sm:min-h-10 sm:gap-2 sm:rounded-xl sm:px-4 sm:text-sm",
                selected
                  ? "bg-emerald-700 text-white shadow-sm"
                  : "border border-slate-200 bg-white text-slate-600 hover:border-emerald-300 hover:text-emerald-700",
              )}
            >
              <Icon size={15} />
              {tab.label}
            </button>
          );
        })}
      </nav>

      <section className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm sm:rounded-2xl">
        {loadingSettings ? (
          <div className="flex min-h-36 flex-col items-center justify-center gap-2">
            <Loader2 size={26} className="animate-spin text-emerald-600" />
            <p className="text-xs text-slate-500">Loading settings...</p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 border-b border-slate-100 bg-white px-3 py-3 text-emerald-700 sm:px-5 sm:py-4">
              {activeTab === "general" && <Sliders size={17} />}
              {activeTab === "alerts" && <Bell size={17} />}
              {activeTab === "security" && <Shield size={17} />}

              <h2 className="text-sm font-bold text-slate-900 sm:text-base">
                {TABS.find((tab) => tab.key === activeTab)?.label} Settings
              </h2>
            </div>

            <div className="space-y-4 p-3 sm:space-y-5 sm:p-5">
              {error && (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-lg border border-red-100 bg-red-50 p-3 text-xs leading-5 text-red-700 sm:text-sm"
                >
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {activeTab === "general" && (
                <>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="System Name">
                      <input
                        value={general.systemName}
                        onChange={(e) =>
                          setGeneral({ ...general, systemName: e.target.value })
                        }
                        className={inputClass}
                        maxLength={120}
                      />
                    </Field>

                    <Field label="System Version">
                      <input
                        value={general.systemVersion}
                        readOnly
                        className={cn(
                          inputClass,
                          "cursor-not-allowed text-slate-500",
                        )}
                      />
                    </Field>

                    <Field label="Installation Date">
                      <input
                        value={general.installDate}
                        readOnly
                        className={cn(
                          inputClass,
                          "cursor-not-allowed text-slate-500",
                        )}
                      />
                    </Field>

                    <Field label="System Status">
                      <div className="flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm sm:rounded-xl sm:px-4">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        <span className="font-semibold text-slate-700">
                          {general.systemStatus}
                        </span>
                      </div>
                    </Field>
                  </div>

                  <Field label="System Description">
                    <textarea
                      rows={3}
                      value={general.description}
                      onChange={(e) =>
                        setGeneral({ ...general, description: e.target.value })
                      }
                      className={cn(inputClass, "resize-y")}
                    />
                  </Field>

                  <div className="space-y-3 rounded-xl bg-slate-50 p-3 sm:p-4">
                    <Toggle
                      label="Enable System Notifications"
                      checked={general.enableNotifications}
                      onChange={(checked) =>
                        setGeneral({ ...general, enableNotifications: checked })
                      }
                    />
                    <Toggle
                      label="Enable Data Logging"
                      checked={general.enableDataLogging}
                      onChange={(checked) =>
                        setGeneral({ ...general, enableDataLogging: checked })
                      }
                    />
                  </div>
                </>
              )}

              {activeTab === "alerts" && (
                <>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="Email Recipient">
                      <input
                        type="email"
                        value={alerts.emailRecipient}
                        onChange={(e) =>
                          setAlerts({
                            ...alerts,
                            emailRecipient: e.target.value,
                          })
                        }
                        className={inputClass}
                      />
                    </Field>

                    <Field label="Alert Frequency">
                      <select
                        value={alerts.alertFrequency}
                        onChange={(e) =>
                          setAlerts({
                            ...alerts,
                            alertFrequency: e.target.value,
                          })
                        }
                        className={inputClass}
                      >
                        <option value="immediate">Immediate</option>
                        <option value="hourly">Hourly Digest</option>
                        <option value="daily">Daily Digest</option>
                      </select>
                    </Field>

                    <Field label="Maximum Alerts Per Day">
                      <input
                        type="number"
                        min="1"
                        value={alerts.maxAlertsPerDay}
                        onChange={(e) =>
                          setAlerts({
                            ...alerts,
                            maxAlertsPerDay: e.target.value,
                          })
                        }
                        className={inputClass}
                      />
                    </Field>
                  </div>

                  <div className="space-y-3 rounded-xl bg-slate-50 p-3 sm:p-4">
                    <Toggle
                      label="Enable Email Alerts"
                      checked={alerts.emailAlerts}
                      onChange={(checked) =>
                        setAlerts({ ...alerts, emailAlerts: checked })
                      }
                    />
                    <Toggle
                      label="Enable SMS Alerts"
                      checked={alerts.smsAlerts}
                      onChange={(checked) =>
                        setAlerts({ ...alerts, smsAlerts: checked })
                      }
                    />
                    <Toggle
                      label="Critical Alerts Only"
                      checked={alerts.criticalOnly}
                      onChange={(checked) =>
                        setAlerts({ ...alerts, criticalOnly: checked })
                      }
                    />
                  </div>
                </>
              )}

              {activeTab === "security" && (
                <>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="Session Timeout (minutes)">
                      <input
                        type="number"
                        min="1"
                        value={security.sessionTimeout}
                        onChange={(e) =>
                          setSecurity({
                            ...security,
                            sessionTimeout: e.target.value,
                          })
                        }
                        className={inputClass}
                      />
                    </Field>

                    <Field label="Password Expiry (days)">
                      <input
                        type="number"
                        min="1"
                        value={security.passwordExpiry}
                        onChange={(e) =>
                          setSecurity({
                            ...security,
                            passwordExpiry: e.target.value,
                          })
                        }
                        className={inputClass}
                      />
                    </Field>

                    <Field label="Maximum Login Attempts">
                      <input
                        type="number"
                        min="1"
                        value={security.loginAttempts}
                        onChange={(e) =>
                          setSecurity({
                            ...security,
                            loginAttempts: e.target.value,
                          })
                        }
                        className={inputClass}
                      />
                    </Field>

                    <Field label="IP Whitelist (comma-separated)">
                      <input
                        type="text"
                        value={security.ipWhitelist}
                        onChange={(e) =>
                          setSecurity({
                            ...security,
                            ipWhitelist: e.target.value,
                          })
                        }
                        placeholder="e.g. 192.168.1.1, 10.0.0.1"
                        className={inputClass}
                      />
                    </Field>
                  </div>

                  <div className="space-y-3 rounded-xl bg-slate-50 p-3 sm:p-4">
                    <Toggle
                      label="Require Multi-Factor Authentication"
                      checked={security.requireMFA}
                      onChange={(checked) =>
                        setSecurity({ ...security, requireMFA: checked })
                      }
                    />
                    <Toggle
                      label="Enable Audit Logging"
                      checked={security.auditLogging}
                      onChange={(checked) =>
                        setSecurity({ ...security, auditLogging: checked })
                      }
                    />
                  </div>
                </>
              )}
            </div>

            <div className="flex flex-col gap-2 border-t border-slate-100 p-3 sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-4">
              <div className="min-h-5 text-xs">
                {saved && (
                  <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-700">
                    <CheckCircle2 size={15} />
                    Settings saved successfully.
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={saving || loadingSettings}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-emerald-800 disabled:opacity-60 sm:rounded-xl sm:text-sm"
              >
                {saving ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : saved ? (
                  <CheckCircle2 size={16} />
                ) : (
                  <Save size={16} />
                )}
                {saving ? "Saving..." : saved ? "Saved" : "Save Settings"}
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block min-w-0">
      <span className={labelClass}>{label}</span>
      {children}
    </label>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex min-w-0 cursor-pointer items-start gap-2.5">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
      />
      <span className="text-xs font-medium leading-5 text-slate-700 sm:text-sm">
        {label}
      </span>
    </label>
  );
}
