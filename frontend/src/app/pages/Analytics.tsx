import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar } from 'recharts';
import { growthPredictionData, yieldForecastData } from '../mockData';
import { TrendingUp, Fish, Leaf, Droplets } from 'lucide-react';

export default function Analytics() {
  return (
    <div className="space-y-6 animate-in fade-in zoom-in duration-500">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">AI Analytics</h2>
        <p className="text-slate-500">Predictive insights and performance forecasting.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-cyan-500 to-blue-600 text-white border-none shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Fish className="h-5 w-5" /> Harvest Readiness
            </CardTitle>
          </CardHeader>
          <CardContent>
             <div className="text-4xl font-bold mb-2">12 Days</div>
             <p className="text-cyan-100 text-sm">Estimated time until tilapia reaches optimal market weight based on current growth trajectory.</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white border-none shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Leaf className="h-5 w-5" /> Yield Forecast
            </CardTitle>
          </CardHeader>
          <CardContent>
             <div className="text-4xl font-bold mb-2">+15%</div>
             <p className="text-green-100 text-sm">Projected increase in lettuce yield compared to last month due to optimized lighting.</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-800">
              <Droplets className="h-5 w-5 text-cyan-500" /> Water Quality Score
            </CardTitle>
          </CardHeader>
          <CardContent>
             <div className="text-4xl font-bold mb-2 text-slate-900">98/100</div>
             <p className="text-slate-500 text-sm">Overall system health is excellent. No critical interventions needed.</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="h-[400px]">
          <CardHeader>
            <CardTitle>Fish Growth Prediction</CardTitle>
            <CardDescription>Actual weight vs AI predicted weight (grams)</CardDescription>
          </CardHeader>
          <CardContent className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={growthPredictionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="week" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}g`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                  itemStyle={{ color: '#0f172a' }}
                />
                <Legend />
                <Line type="monotone" dataKey="actual" stroke="#0ea5e9" strokeWidth={3} name="Actual Weight" dot={{ r: 4, strokeWidth: 2 }} />
                <Line type="monotone" dataKey="predicted" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" name="AI Prediction" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="h-[400px]">
          <CardHeader>
            <CardTitle>Crop Yield Forecast</CardTitle>
            <CardDescription>Projected harvest units per month</CardDescription>
          </CardHeader>
          <CardContent className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={yieldForecastData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                   cursor={{ fill: '#f1f5f9' }}
                   contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                />
                <Legend />
                <Bar dataKey="lettuce" fill="#22c55e" radius={[4, 4, 0, 0]} name="Lettuce Heads" />
                <Bar dataKey="basil" fill="#84cc16" radius={[4, 4, 0, 0]} name="Basil Bunches" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
