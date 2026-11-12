export type SensorStatus =
  | "normal"
  | "warning"
  | "critical"
  | "no_data"
  | "offline"
  | "unconfigured";

export interface SensorThresholdConfiguration {
  low?: unknown;
  high?: unknown;
  unit?: string;
}

export type SensorConfiguration = Record<
  string,
  SensorThresholdConfiguration
>;

const WARNING_BAND_RATIO = 0.1;

function toFiniteNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

export function getSensorStatus(
  reading: unknown,
  configuration: SensorThresholdConfiguration | undefined,
  deviceOffline = false,
): SensorStatus {
  if (deviceOffline) {
    return "offline";
  }

  const value = toFiniteNumber(reading);
  if (value === null) {
    return "no_data";
  }

  if (!configuration || typeof configuration !== "object") {
    return "unconfigured";
  }

  const low = toFiniteNumber(configuration.low);
  const high = toFiniteNumber(configuration.high);

  if (low === null && high === null) {
    return "unconfigured";
  }

  if (low !== null && high !== null && low >= high) {
    return "unconfigured";
  }

  if ((low !== null && value < low) || (high !== null && value > high)) {
    return "critical";
  }

  const range = low !== null && high !== null
    ? high - low
    : Math.abs(low ?? high ?? 0);
  const warningMargin = range * WARNING_BAND_RATIO;

  if (
    warningMargin > 0 &&
    ((low !== null && value <= low + warningMargin) ||
      (high !== null && value >= high - warningMargin))
  ) {
    return "warning";
  }

  return "normal";
}

export const SENSOR_STATUS_PRESENTATION: Record<
  SensorStatus,
  {
    label: string;
    card: string;
    icon: string;
    iconColor: string;
    value: string;
    badge: string;
    dot: string;
    progress: string;
    labelText: string;
  }
> = {
  normal: {
    label: "Stable",
    card: "border-emerald-200 bg-emerald-50/20",
    icon: "bg-emerald-100 text-emerald-600",
    iconColor: "text-emerald-600",
    value: "text-slate-900",
    badge: "border-emerald-100 bg-emerald-50 text-emerald-700",
    dot: "bg-emerald-500",
    progress: "bg-gradient-to-r from-emerald-400 to-emerald-600",
    labelText: "text-emerald-600",
  },
  warning: {
    label: "Warning",
    card: "border-amber-200 bg-amber-50/30",
    icon: "bg-amber-100 text-amber-600",
    iconColor: "text-amber-600",
    value: "text-amber-800",
    badge: "border-amber-100 bg-amber-50 text-amber-700",
    dot: "bg-amber-500",
    progress: "bg-gradient-to-r from-amber-400 to-amber-600",
    labelText: "text-amber-600",
  },
  critical: {
    label: "Critical",
    card: "border-red-200 bg-red-50/30",
    icon: "bg-red-100 text-red-600",
    iconColor: "text-red-600",
    value: "text-red-800",
    badge: "border-red-100 bg-red-50 text-red-700",
    dot: "bg-red-500",
    progress: "bg-gradient-to-r from-red-400 to-red-600",
    labelText: "text-red-600",
  },
  no_data: {
    label: "No Data",
    card: "border-slate-200 bg-slate-50/70",
    icon: "bg-slate-100 text-slate-500",
    iconColor: "text-slate-500",
    value: "text-slate-500",
    badge: "border-slate-200 bg-slate-100 text-slate-600",
    dot: "bg-slate-400",
    progress: "bg-slate-400",
    labelText: "text-slate-500",
  },
  offline: {
    label: "Offline",
    card: "border-slate-200 bg-slate-50/70",
    icon: "bg-slate-100 text-slate-500",
    iconColor: "text-slate-500",
    value: "text-slate-500",
    badge: "border-slate-200 bg-slate-100 text-slate-600",
    dot: "bg-slate-400",
    progress: "bg-slate-400",
    labelText: "text-slate-500",
  },
  unconfigured: {
    label: "Unconfigured",
    card: "border-slate-200 bg-slate-50/70",
    icon: "bg-slate-100 text-slate-500",
    iconColor: "text-slate-500",
    value: "text-slate-500",
    badge: "border-slate-200 bg-slate-100 text-slate-600",
    dot: "bg-slate-400",
    progress: "bg-slate-400",
    labelText: "text-slate-500",
  },
};
