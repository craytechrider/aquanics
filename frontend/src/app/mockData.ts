import { BadgeVariant } from "./components/ui/Badge";

export interface SensorData {
  id: string;
  name: string;
  value: number;
  unit: string;
  status: 'safe' | 'caution' | 'critical';
  trend: number[]; // Sparkline data
  icon: string;
}

export const sensorData: SensorData[] = [
  {
    id: 'ph',
    name: 'pH Level',
    value: 7.2,
    unit: 'pH',
    status: 'safe',
    trend: [6.8, 6.9, 7.0, 7.1, 7.2, 7.2, 7.1],
    icon: 'droplet'
  },
  {
    id: 'do',
    name: 'Dissolved Oxygen',
    value: 6.5,
    unit: 'mg/L',
    status: 'safe',
    trend: [6.0, 6.2, 6.4, 6.3, 6.5, 6.6, 6.5],
    icon: 'wind'
  },
  {
    id: 'temp',
    name: 'Temperature',
    value: 26.5,
    unit: '°C',
    status: 'safe',
    trend: [24, 25, 25.5, 26, 26.5, 27, 26.5],
    icon: 'thermometer'
  },
  {
    id: 'ammonia',
    name: 'Ammonia',
    value: 0.05,
    unit: 'ppm',
    status: 'caution',
    trend: [0.01, 0.02, 0.03, 0.04, 0.05, 0.06, 0.05],
    icon: 'alert-triangle'
  },
  {
    id: 'water_level',
    name: 'Water Level',
    value: 85,
    unit: '%',
    status: 'safe',
    trend: [80, 82, 84, 85, 85, 85, 85],
    icon: 'bar-chart'
  }
];

export interface SystemStatus {
  pump: boolean;
  aerator: boolean;
  lights: boolean;
  feeder_schedule: boolean;
}

export const systemStatus: SystemStatus = {
  pump: true,
  aerator: true,
  lights: false,
  feeder_schedule: true,
};

export interface Alert {
  id: string;
  title: string;
  message: string;
  severity: 'safe' | 'caution' | 'critical';
  timestamp: string;
}

export const alerts: Alert[] = [
  {
    id: '1',
    title: 'Low Oxygen Warning',
    message: 'DO levels dropped below 5.0 mg/L in Tank 2',
    severity: 'critical',
    timestamp: '10 mins ago'
  },
  {
    id: '2',
    title: 'High Ammonia Detected',
    message: 'Ammonia levels rising in Grow Bed A',
    severity: 'caution',
    timestamp: '2 hours ago'
  },
  {
    id: '3',
    title: 'System Optimal',
    message: 'All parameters within safe range',
    severity: 'safe',
    timestamp: '5 hours ago'
  }
];

export const growthPredictionData = [
  { week: 'Week 1', actual: 10, predicted: 12 },
  { week: 'Week 2', actual: 25, predicted: 28 },
  { week: 'Week 3', actual: 45, predicted: 48 },
  { week: 'Week 4', actual: 70, predicted: 75 },
  { week: 'Week 5', actual: 95, predicted: 100 },
];

export const yieldForecastData = [
  { month: 'Jan', lettuce: 120, basil: 80 },
  { month: 'Feb', lettuce: 130, basil: 85 },
  { month: 'Mar', lettuce: 140, basil: 90 },
  { month: 'Apr', lettuce: 150, basil: 100 },
  { month: 'May', lettuce: 160, basil: 110 },
];

// export const communityYieldData = [
//   { farmer: 'Farm A', yield: 450 },
//   { farmer: 'Farm B', yield: 380 },
//   { farmer: 'Farm C', yield: 510 },
//   { farmer: 'You', yield: 480 },
// ];
