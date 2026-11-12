import { ArrowUp, ArrowDown, Info, AlertTriangle, AlertOctagon, CheckCircle, TrendingUp } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, AreaChart, Area } from 'recharts';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

export function StatCard({ title, value, unit, status, trend, icon: Icon, trendValue }: { title: string, value: string | number, unit: string, status: 'safe' | 'caution' | 'critical', trend: number[], icon: any, trendValue?: string }) {
  const statusColors = {
    safe: 'text-green-600 bg-green-50 border-green-200',
    caution: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    critical: 'text-red-600 bg-red-50 border-red-200',
  };

  const trendColor = status === 'critical' ? '#ef4444' : status === 'caution' ? '#eab308' : '#22c55e';

  // Create data for sparkline
  const data = trend.map((val, i) => ({ i, val }));

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all duration-200 relative overflow-hidden group">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className={cn("p-2.5 rounded-lg transition-colors", statusColors[status])}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-slate-500 text-sm font-medium">{title}</h3>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-slate-900 tracking-tight">{value}</span>
              <span className="text-sm text-slate-400 font-medium">{unit}</span>
            </div>
          </div>
        </div>
        {trendValue && (
            <div className={cn("flex items-center text-xs font-bold px-2 py-1 rounded-full", parseInt(trendValue) > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}>
                {parseInt(trendValue) > 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <ArrowDown className="w-3 h-3 mr-1" />}
                {trendValue}%
            </div>
        )}
      </div>

      <div className="h-12 w-full mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <Line 
                type="monotone" 
                dataKey="val" 
                stroke={trendColor} 
                strokeWidth={2} 
                dot={false} 
                isAnimationActive={false} 
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      {/* Decorative gradient blob */}
      <div className={cn("absolute -bottom-4 -right-4 w-24 h-24 rounded-full opacity-10 blur-2xl transition-transform group-hover:scale-150", 
          status === 'safe' ? 'bg-green-500' : status === 'caution' ? 'bg-yellow-500' : 'bg-red-500'
      )} />
    </div>
  );
}

export function AlertCard({ title, message, severity, time }: { title: string, message: string, severity: 'info' | 'warning' | 'critical', time: string }) {
  const styles = {
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    critical: 'bg-red-50 border-red-200 text-red-800',
  };

  const icons = {
    info: Info,
    warning: AlertTriangle,
    critical: AlertOctagon,
  };

  const Icon = icons[severity];

  return (
    <div className={cn("flex gap-4 p-4 rounded-xl border shadow-sm transition-all hover:translate-x-1", styles[severity])}>
      <div className="shrink-0 mt-0.5">
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1">
        <div className="flex justify-between items-start">
          <h4 className="font-semibold text-sm">{title}</h4>
          <span className="text-xs opacity-70 whitespace-nowrap ml-2">{time}</span>
        </div>
        <p className="text-sm mt-1 opacity-90 leading-relaxed">{message}</p>
      </div>
    </div>
  );
}

export function SystemStatusToggle({ name, state, icon: Icon, onToggle }: { name: string, state: boolean | string, icon: any, onToggle?: () => void }) {
    const isActive = state === true || state === 'Scheduled';
    const isScheduled = state === 'Scheduled';

    return (
        <div className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-cyan-200 transition-colors">
            <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-lg transition-colors", isActive ? "bg-cyan-100 text-cyan-600" : "bg-slate-100 text-slate-400")}>
                    <Icon className="w-5 h-5" />
                </div>
                <div>
                    <h4 className="font-medium text-slate-700 text-sm">{name}</h4>
                    <p className={cn("text-xs font-medium", isActive ? "text-cyan-600" : "text-slate-400")}>
                        {isActive ? (isScheduled ? 'Scheduled' : 'Running') : 'Stopped'}
                    </p>
                </div>
            </div>
            
            {/* Toggle Switch */}
            <button 
                onClick={onToggle}
                className={cn("w-11 h-6 rounded-full relative transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500/20", 
                    isActive ? "bg-cyan-500" : "bg-slate-300"
                )}
            >
                <div className={cn("absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200", 
                    isActive ? "left-6" : "left-1"
                )} />
            </button>
        </div>
    )
}
