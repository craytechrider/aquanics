import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { sensorData } from '../mockData';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Activity, AlertCircle, CheckCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function Sensors() {
  return (
    <div className="space-y-6 animate-in fade-in zoom-in duration-500">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Sensors</h2>
        <p className="text-slate-500">Detailed historical data and calibration status.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sensorData.map((sensor) => (
          <Card key={sensor.id} className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="space-y-1">
                <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                   {sensor.name}
                   {sensor.status === 'critical' && <AlertCircle className="text-red-500 w-4 h-4" />}
                   {sensor.status === 'safe' && <CheckCircle className="text-green-500 w-4 h-4" />}
                </CardTitle>
                <CardDescription>Last update: 2 mins ago</CardDescription>
              </div>
              <div className={cn(
                "text-2xl font-bold",
                sensor.status === 'safe' ? "text-green-600" : 
                sensor.status === 'caution' ? "text-yellow-600" : "text-red-600"
              )}>
                {sensor.value} <span className="text-sm font-normal text-slate-500">{sensor.unit}</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={sensor.trend.map((val, i) => ({ time: i, value: val }))}>
                    <defs>
                      <linearGradient id={`gradient-${sensor.id}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis hide />
                    <YAxis domain={['auto', 'auto']} hide />
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      cursor={{ stroke: '#cbd5e1' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#06b6d4" 
                      fillOpacity={1} 
                      fill={`url(#gradient-${sensor.id})`} 
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 flex justify-between items-center text-xs text-slate-500 border-t border-slate-100 pt-4">
                 <span>Sensor ID: {sensor.id.toUpperCase()}_01</span>
                 <span className="text-cyan-600 cursor-pointer hover:underline">Calibrate Sensor</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
