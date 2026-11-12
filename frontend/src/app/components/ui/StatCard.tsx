import { ArrowDown, ArrowUp, Minus, Activity } from "lucide-react";
import { cn } from "../../lib/utils";

interface StatCardProps {
  title: string;
  value: string | number | null;
  unit?: string;
  trend?: "up" | "down" | "stable";
  status?: "safe" | "warning" | "caution" | "critical";
  icon?: React.ReactNode;
  chartData?: number[];
}

export function StatCard({
  title,
  value,
  unit,
  trend = "stable",
  status = "safe",
  icon,
  chartData,
}: StatCardProps) {
  /*
   * Support both "warning" and the older "caution" naming.
   */
  const normalizedStatus = status === "caution" ? "warning" : status;

  const statusConfig = {
    safe: {
      bg: "bg-white",
      border: "border-emerald-100",
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
      valueColor: "text-slate-900",
      shadow: "shadow-emerald-100/50",
    },

    warning: {
      bg: "bg-amber-50/30",
      border: "border-amber-200",
      iconBg: "bg-amber-100",
      iconColor: "text-amber-600",
      valueColor: "text-amber-900",
      shadow: "shadow-amber-100/50",
    },

    critical: {
      bg: "bg-red-50/30",
      border: "border-red-200",
      iconBg: "bg-red-100",
      iconColor: "text-red-600",
      valueColor: "text-red-900",
      shadow: "shadow-red-100/50",
    },
  };

  /*
   * Extra safety:
   * If Firebase sends an unexpected status,
   * use "safe" instead of crashing the dashboard.
   */
  const currentStatus =
    statusConfig[normalizedStatus as "safe" | "warning" | "critical"] ??
    statusConfig.safe;

  const trendIcon = {
    up: <ArrowUp size={13} />,
    down: <ArrowDown size={13} />,
    stable: <Minus size={13} />,
  };

  const safeChartData =
    Array.isArray(chartData) && chartData.length > 0
      ? chartData.filter((value) => typeof value === "number")
      : [];

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border p-5",
        "transition-all duration-300",
        "hover:-translate-y-1 hover:shadow-lg",
        currentStatus.bg,
        currentStatus.border,
        currentStatus.shadow,
      )}
    >
      {/* Background Decorative Gradient */}
      <div
        className={cn(
          "absolute -right-6 -top-6 h-24 w-24",
          "rounded-full opacity-10 blur-2xl",
          normalizedStatus === "safe"
            ? "bg-emerald-500"
            : normalizedStatus === "warning"
              ? "bg-amber-500"
              : "bg-red-500",
        )}
      />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-500 font-display">
          {title}
        </p>

        <div
          className={cn(
            "p-2.5 rounded-xl transition-colors",
            currentStatus.iconBg,
            currentStatus.iconColor,
          )}
        >
          {icon || <Activity size={18} />}
        </div>
      </div>

      {/* Value */}
      <div className="relative z-10 mt-4 flex items-baseline gap-1.5">
        <h3
          className={cn(
            "text-3xl font-bold font-display tracking-tight",
            currentStatus.valueColor,
          )}
        >
          {value === null || value === undefined ? "--" : value}
        </h3>

        {unit && (
          <span className="text-sm text-slate-500 font-medium">{unit}</span>
        )}
      </div>

      {/* Trend */}
      <div className="relative z-10 mt-3 flex items-center gap-2">
        <div className="flex items-center gap-1 bg-white/60 backdrop-blur-sm px-2 py-1 rounded-lg border border-slate-100 shadow-sm">
          {trendIcon[trend]}

          <span
            className={cn(
              "text-xs font-semibold",
              trend === "up"
                ? "text-emerald-600"
                : trend === "down"
                  ? "text-red-600"
                  : "text-slate-500",
            )}
          >
            {trend === "stable" ? "Stable" : "vs last hr"}
          </span>
        </div>
      </div>

      {/* Sparkline */}
      {safeChartData.length > 1 && (
        <div className="absolute bottom-0 left-0 right-0 h-12 opacity-30">
          <svg
            className="h-full w-full"
            preserveAspectRatio="none"
            viewBox="0 0 100 50"
          >
            <path
              d={safeChartData
                .map((value, index) => {
                  const x = (index / (safeChartData.length - 1)) * 100;

                  const min = Math.min(...safeChartData);
                  const max = Math.max(...safeChartData);

                  const range = max - min || 1;

                  const y = 40 - ((value - min) / range) * 30;

                  return `${index === 0 ? "M" : "L"}${x},${y}`;
                })
                .join(" ")}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className={
                normalizedStatus === "safe"
                  ? "text-emerald-500"
                  : normalizedStatus === "warning"
                    ? "text-amber-500"
                    : "text-red-500"
              }
            />
          </svg>
        </div>
      )}
    </div>
  );
}
