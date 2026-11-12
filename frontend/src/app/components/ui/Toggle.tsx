import { cn } from "../../lib/utils";
import { motion } from "motion/react";

interface ToggleProps {
  isOn: boolean;
  onToggle: () => void;
  label?: string;
}

export function Toggle({ isOn, onToggle, label }: ToggleProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      {label && <span className="text-sm font-medium text-slate-700">{label}</span>}
      <button 
        onClick={onToggle}
        className={cn(
          "relative h-7 w-12 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2",
          isOn ? "bg-sky-500" : "bg-slate-200"
        )}
      >
        <motion.div
          className="absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow-sm"
          animate={{ x: isOn ? 20 : 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      </button>
    </div>
  );
}
