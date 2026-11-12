import * as React from "react"
import { cn } from "../../../lib/utils"

export type BadgeVariant = "default" | "secondary" | "outline" | "destructive" | "safe" | "caution" | "critical";

const badgeVariants: Record<BadgeVariant, string> = {
  default: "bg-slate-900 text-slate-50 hover:bg-slate-900/80",
  secondary: "bg-slate-100 text-slate-900 hover:bg-slate-100/80",
  destructive: "bg-red-500 text-slate-50 hover:bg-red-500/80",
  outline: "text-slate-950 border border-slate-200",
  safe: "bg-green-100 text-green-700 border border-green-200",
  caution: "bg-yellow-100 text-yellow-700 border border-yellow-200",
  critical: "bg-red-100 text-red-700 border border-red-200",
}

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: BadgeVariant
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2",
        badgeVariants[variant],
        className
      )}
      {...props}
    />
  )
}

export { Badge }
