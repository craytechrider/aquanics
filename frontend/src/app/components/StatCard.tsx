import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card";
import { Badge } from "./ui/Badge";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import { cn } from "../../lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  unit: string;
  status: "safe" | "caution" | "critical";
  trendData: number[];
  icon: LucideIcon;
}

export function StatCard({
  title,
  value,
  unit,
  status,
  trendData,
  icon: Icon,
}: StatCardProps) {
  const data = trendData.map((val, i) => ({ value: val, index: i }));
  const isUp = trendData[trendData.length - 1] > trendData[0];

  const statusColors = {
    safe: "text-green-600 bg-green-50 border-green-200",
    caution: "text-yellow-600 bg-yellow-50 border-yellow-200",
    critical: "text-red-600 bg-red-50 border-red-200",
  };

  const statusStroke = {
    safe: "#22c55e",
    caution: "#eab308",
    critical: "#ef4444",
  };

  return (
    <Card className="overflow-hidden relative group hover:shadow-lg transition-all duration-300">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-slate-500">
          {title}
        </CardTitle>
        <div className={cn("p-2 rounded-full", statusColors[status])}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline space-x-2">
          <div className="text-2xl font-bold text-slate-900">{value}</div>
          <span className="text-xs text-slate-500 font-medium">{unit}</span>
        </div>

        <div className="flex items-center justify-between mt-4 h-10">
          <div
            className={cn(
              "text-xs flex items-center gap-1 font-medium",
              isUp ? "text-green-600" : "text-slate-500",
            )}
          >
            {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            <span>
              {(trendData[trendData.length - 1] - trendData[0]).toFixed(1)}
            </span>
          </div>

          <div className="h-10 w-24">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={statusStroke[status]}
                  fill={statusStroke[status]}
                  fillOpacity={0.1}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div
          className={cn(
            "absolute bottom-0 left-0 right-0 h-1",
            status === "safe"
              ? "bg-green-500"
              : status === "caution"
                ? "bg-yellow-500"
                : "bg-red-500",
          )}
        />
      </CardContent>
    </Card>
  );
}
