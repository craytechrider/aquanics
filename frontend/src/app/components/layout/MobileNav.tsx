import React from "react";
import { NavLink } from "react-router";
import {
  LayoutDashboard,
  Activity,
  Cpu,
  BarChart3,
  BookOpen,
} from "lucide-react";
import { cn } from "../../../lib/utils";

const mobileLinks = [
  { name: "Home", href: "/dashboard", icon: LayoutDashboard },
  { name: "Sensors", href: "/sensors", icon: Activity },
  { name: "Auto", href: "/automation", icon: Cpu },
  { name: "Reports", href: "/reports", icon: BarChart3 },
  { name: "Learn", href: "/learning", icon: BookOpen },
];

export function MobileNav({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "sticky top-0 z-[9999]",
        "md:hidden",
        "w-full",
        "bg-white/95 backdrop-blur-md",
        "border-b border-slate-200",
        "shadow-[0_4px_12px_-2px_rgba(0,0,0,0.08)]",
        className,
      )}
    >
      <nav className="h-16 px-2 sm:px-4 flex items-center justify-around">
        {mobileLinks.map((link) => (
          <NavLink
            key={link.name}
            to={link.href}
            className={({ isActive }) =>
              cn(
                "relative flex flex-1 h-full max-w-[80px]",
                "flex-col items-center justify-center",
                "gap-0.5 rounded-xl",
                "transition-all duration-200",
                isActive
                  ? "text-cyan-600"
                  : "text-slate-400 hover:text-slate-600",
              )
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={cn(
                    "absolute top-0 left-1/2 -translate-x-1/2",
                    "h-0.5 w-8 rounded-full",
                    isActive ? "bg-cyan-600" : "bg-transparent",
                  )}
                />

                <link.icon
                  className={cn("w-[21px] h-[21px]", "sm:w-[23px] sm:h-[23px]")}
                  strokeWidth={isActive ? 2.5 : 2}
                />

                <span
                  className={cn(
                    "text-[9px] sm:text-[10px]",
                    "font-semibold tracking-wide leading-none",
                    isActive ? "text-cyan-600" : "text-slate-400",
                  )}
                >
                  {link.name}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
