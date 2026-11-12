import { NavLink } from 'react-router';
import { LayoutDashboard, Activity, Settings, FileText, Users, BarChart, Sun, Thermometer, Droplets, Fish, Leaf, Wind } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import logoImg from '../../assets/bf2f001026d6edc1e3beec70ce5240dc1734a24f.png';

// Helper to handle class merging
export function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Sensors', href: '/sensors', icon: Activity },
  { name: 'Automation', href: '/automation', icon: Settings },
  { name: 'Analytics', href: '/analytics', icon: BarChart },
  { name: 'Reports', href: '/reports', icon: FileText },
];

export function Sidebar() {
  return (
    <aside className="hidden md:flex flex-col w-64 bg-slate-900 border-r border-slate-800 text-slate-300 h-screen sticky top-0">
      <div className="p-6 border-b border-slate-800 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-cyan-500 flex items-center justify-center shrink-0 shadow-lg shadow-cyan-500/20">
            <img src={logoImg} alt="AquaSmart Logo" className="w-8 h-8 object-contain" />
        </div>
        <div>
          <h1 className="font-bold text-white text-lg tracking-tight">AquaSmart</h1>
          <p className="text-xs text-cyan-400 font-medium">IoT Aquanics</p>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative overflow-hidden",
                isActive
                  ? "bg-cyan-500/10 text-cyan-400 shadow-sm"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className={cn("w-5 h-5 transition-transform duration-200", isActive ? "scale-110" : "group-hover:scale-110")} />
                <span>{item.name}</span>
                {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-cyan-500 rounded-r-full" />}
              </>
            )}
          </NavLink>
        ))}
        
        <div className="pt-6 mt-6 border-t border-slate-800">
           <NavLink
            to="/settings"
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group",
                isActive
                  ? "bg-slate-800 text-white"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              )
            }
          >
             <Settings className="w-5 h-5" />
             <span>Settings</span>
          </NavLink>
        </div>
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="bg-slate-800/50 rounded-xl p-3 flex items-center gap-3">
           <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-white font-bold text-xs">
             JD
           </div>
           <div className="flex-1 min-w-0">
             <p className="text-sm font-medium text-white truncate">Juan Farmer</p>
             <p className="text-xs text-slate-500 truncate">Pro Plan</p>
           </div>
        </div>
      </div>
    </aside>
  );
}

export function MobileNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 md:hidden z-50 flex justify-around p-2 pb-safe">
      {navItems.slice(0, 5).map((item) => (
        <NavLink
          key={item.name}
          to={item.href}
          className={({ isActive }) =>
            cn(
              "flex flex-col items-center justify-center p-2 rounded-lg text-[10px] font-medium transition-colors w-16",
              isActive ? "text-cyan-400" : "text-slate-500"
            )
          }
        >
          <item.icon className="w-6 h-6 mb-1" />
          <span>{item.name}</span>
        </NavLink>
      ))}
    </nav>
  );
}

