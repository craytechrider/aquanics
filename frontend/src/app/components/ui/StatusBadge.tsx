import { cn } from "../../lib/utils";

export function StatusBadge({ status }: { status: "safe" | "warning" | "critical" | "online" | "offline" }) {
  const styles = {
    safe: "bg-emerald-100 text-emerald-800 border-emerald-200",
    online: "bg-emerald-100 text-emerald-800 border-emerald-200",
    warning: "bg-amber-100 text-amber-800 border-amber-200",
    critical: "bg-red-100 text-red-800 border-red-200",
    offline: "bg-slate-100 text-slate-800 border-slate-200",
  };

  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2", styles[status])}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
