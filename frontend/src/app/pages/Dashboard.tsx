import React, { useState } from "react";
import { StatCard } from "../components/StatCard";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Toggle } from "../components/ui/Toggle";
import { Button } from "../components/ui/Button";
import {
  Droplet,
  Wind,
  Thermometer,
  AlertTriangle,
  Activity,
  CheckCircle,
  Flame,
  Lightbulb,
  Fan,
} from "lucide-react";
import {
  sensorData,
  alerts,
  SystemStatus as SystemStatusType,
} from "../mockData";
import { formatDistanceToNow } from "date-fns";

const SystemStatus = ({
  status,
  setStatus,
}: {
  status: SystemStatusType;
  setStatus: React.Dispatch<React.SetStateAction<SystemStatusType>>;
}) => {
  const toggle = (key: keyof SystemStatusType) => {
    setStatus((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-cyan-500" /> System Control
        </CardTitle>
        <CardDescription>Direct control of aquanics hardware</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-full ${status.pump ? "bg-green-100 text-green-600" : "bg-slate-200 text-slate-500"}`}
            >
              <Droplet size={20} />
            </div>
            <div>
              <p className="font-medium text-slate-900">Water Pump</p>
              <p className="text-xs text-slate-500">
                {status.pump ? "Running normally" : "System halted"}
              </p>
            </div>
          </div>
          <Toggle isOn={status.pump} onToggle={() => toggle("pump")} />
        </div>

        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-full ${status.aerator ? "bg-cyan-100 text-cyan-600" : "bg-slate-200 text-slate-500"}`}
            >
              <Fan size={20} />
            </div>
            <div>
              <p className="font-medium text-slate-900">Aerator</p>
              <p className="text-xs text-slate-500">Oxygen supply</p>
            </div>
          </div>
          <Toggle isOn={status.aerator} onToggle={() => toggle("aerator")} />
        </div>

        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-full ${status.lights ? "bg-yellow-100 text-yellow-600" : "bg-slate-200 text-slate-500"}`}
            >
              <Lightbulb size={20} />
            </div>
            <div>
              <p className="font-medium text-slate-900">Grow Lights</p>
              <p className="text-xs text-slate-500">Auto-schedule active</p>
            </div>
          </div>
          <Toggle
            isOn={status.lights}
            onToggle={() => toggle("lights")}
            activeColor="bg-yellow-400"
          />
        </div>
      </CardContent>
    </Card>
  );
};

const AlertsSection = () => {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-500" /> System Alerts
        </CardTitle>
        <CardDescription>Recent notifications and warnings</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={`p-4 rounded-lg border-l-4 ${
              alert.severity === "critical"
                ? "bg-red-50 border-red-500"
                : alert.severity === "caution"
                  ? "bg-amber-50 border-amber-500"
                  : "bg-green-50 border-green-500"
            }`}
          >
            <div className="flex justify-between items-start">
              <h4
                className={`font-semibold ${
                  alert.severity === "critical"
                    ? "text-red-700"
                    : alert.severity === "caution"
                      ? "text-amber-700"
                      : "text-green-700"
                }`}
              >
                {alert.title}
              </h4>
              <span className="text-xs text-slate-500">{alert.timestamp}</span>
            </div>
            <p className="text-sm text-slate-600 mt-1">{alert.message}</p>
          </div>
        ))}
        <Button variant="outline" className="w-full mt-4">
          View All Notifications
        </Button>
      </CardContent>
    </Card>
  );
};

export default function Dashboard() {
  const [sysStatus, setSysStatus] = useState<SystemStatusType>({
    pump: true,
    aerator: true,
    lights: false,
    feeder_schedule: true,
  });

  const getIcon = (name: string) => {
    switch (name) {
      case "pH Level":
        return Droplet;
      case "Dissolved Oxygen":
        return Wind;
      case "Temperature":
        return Thermometer;
      case "Ammonia":
        return AlertTriangle;
      case "Water Level":
        return Activity;
      default:
        return Activity;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in zoom-in duration-500">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">
          Dashboard
        </h2>
        <p className="text-slate-500">
          Real-time monitoring of your aquanics system.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {sensorData.map((sensor) => (
          <StatCard
            key={sensor.id}
            title={sensor.name}
            value={sensor.value}
            unit={sensor.unit}
            status={sensor.status}
            trendData={sensor.trend}
            icon={getIcon(sensor.name)}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <SystemStatus status={sysStatus} setStatus={setSysStatus} />
        </div>
        <div className="lg:col-span-2">
          <AlertsSection />
        </div>
      </div>
    </div>
  );
}
