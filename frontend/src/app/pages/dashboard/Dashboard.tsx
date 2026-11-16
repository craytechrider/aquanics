import { useEffect, useMemo, useState } from "react";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import {
  Droplets,
  Thermometer,
  Activity,
  Wind,
  AlertTriangle,
  Zap,
} from "lucide-react";

import { Toggle } from "../../components/ui/Toggle";
import { cn } from "../../lib/utils";
import { useAquaponicsData } from "../../../hooks/useAquaponicsData";
import { useSensorConfiguration } from "../../../hooks/useSensorConfiguration";
import {
  getSensorStatus,
  SENSOR_STATUS_PRESENTATION,
  type SensorStatus,
} from "../../lib/sensorStatus";
import {
  formatSensorHistoryLabel,
  readSensorHistory,
  type SensorHistoryPoint,
} from "../../lib/sensorHistory";
import WeatherWidget from "../../components/WeatherWidget";

import bgImage from "../../../assets/236227259a39f8fc98372b0db000196c5ed358d0.png";

import { ref, onValue, set } from "firebase/database";
import { db } from "../../../firebase";

/* =========================================================
   SENSOR CONFIGURATION
========================================================= */

const UNIT_MAP: Record<string, string> = {
  ph: "pH",
  dissolvedOxygen: "mg/L",
  waterTemp: "°C",
  ammonia: "mg/L",
  waterPercent: "%",
  batteryPercent: "%",
};

const LABEL_MAP: Record<string, string> = {
  ph: "pH Level",
  dissolvedOxygen: "Dissolved Oxygen",
  waterTemp: "Temperature",
  ammonia: "Ammonia",
  waterPercent: "Water Level",
  batteryPercent: "Battery",
};

/* =========================================================
   DEVICE CONFIGURATION
========================================================= */

const DEVICE_CONFIG: Record<
  string,
  {
    name: string;
    icon: typeof Zap;
    gradient: string;
    shadow: string;
  }
> = {
  pump: {
    name: "Pump",
    icon: Zap,
    gradient: "from-blue-500 to-blue-600",
    shadow: "shadow-blue-200",
  },

  aerator: {
    name: "Aerator",
    icon: Wind,
    gradient: "from-cyan-400 to-cyan-500",
    shadow: "shadow-cyan-200",
  },

  lights: {
    name: "Lights",
    icon: Zap,
    gradient: "from-amber-400 to-amber-500",
    shadow: "shadow-amber-200",
  },

  feeder: {
    name: "Feeder",
    icon: Activity,
    gradient: "from-emerald-400 to-emerald-500",
    shadow: "shadow-emerald-200",
  },
};

/* =========================================================
   FIREBASE HISTORY TYPES
========================================================= */

/* =========================================================
   BATTERY VOLTAGE

   8.4 V  = 0%
   12.6 V = 100%
========================================================= */

function voltageToPercent(voltage: number | null): number | null {
  if (voltage === null || !Number.isFinite(voltage)) {
    return null;
  }

  const MIN_VOLTAGE = 8.4;
  const MAX_VOLTAGE = 12.6;

  const percent = ((voltage - MIN_VOLTAGE) / (MAX_VOLTAGE - MIN_VOLTAGE)) * 100;

  return Math.max(0, Math.min(100, percent));
}

/* =========================================================
   DEVICE CONTROL
========================================================= */

function useDeviceControl() {
  const [devices, setDevices] = useState<Record<string, boolean>>({
    pump: false,
    aerator: false,
    lights: false,
    feeder: false,
  });

  /* =======================================================
     LISTEN TO FIREBASE DEVICE STATES
  ======================================================= */

  useEffect(() => {
    const devicesRef = ref(db, "devices");

    const unsubscribe = onValue(
      devicesRef,
      (snapshot) => {
        const firebaseDevices = snapshot.val();

        if (!firebaseDevices) {
          return;
        }

        setDevices((previous) => ({
          ...previous,

          pump:
            firebaseDevices.pump?.isOn !== undefined
              ? Boolean(firebaseDevices.pump.isOn)
              : previous.pump,

          aerator:
            firebaseDevices.aerator?.isOn !== undefined
              ? Boolean(firebaseDevices.aerator.isOn)
              : previous.aerator,

          lights:
            firebaseDevices.lights?.isOn !== undefined
              ? Boolean(firebaseDevices.lights.isOn)
              : previous.lights,

          feeder:
            firebaseDevices.feeder?.isOn !== undefined
              ? Boolean(firebaseDevices.feeder.isOn)
              : previous.feeder,
        }));
      },
      (error) => {
        console.error("Firebase devices error:", error);
      },
    );

    return () => unsubscribe();
  }, []);

  /* =======================================================
     TOGGLE DEVICE
  ======================================================= */

  const toggleDevice = async (key: string) => {
    if (!(key in devices)) {
      return;
    }

    const newState = !devices[key];

    try {
      await set(ref(db, `devices/${key}/isOn`), newState);

      setDevices((previous) => ({
        ...previous,
        [key]: newState,
      }));
    } catch (error) {
      console.error(`Failed to toggle ${key}:`, error);
    }
  };

  return {
    devices,
    toggleDevice,
  };
}

function SensorStatusAlert({
  title,
  reading,
  unit,
  status,
}: {
  title: string;
  reading: number;
  unit: string;
  status: SensorStatus;
}) {
  const styles = SENSOR_STATUS_PRESENTATION[status];

  return (
    <div className={cn("flex gap-3 rounded-2xl border p-3 sm:gap-4 sm:p-4", styles.card)}>
      <div className={cn("mt-1 h-fit rounded-lg p-2", styles.icon)}>
        <AlertTriangle size={16} />
      </div>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-bold text-slate-800">{title}</p>
          <span
            className={cn(
              "rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase",
              styles.badge,
            )}
          >
            {styles.label}
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          Current reading: {reading.toFixed(2)} {unit}
        </p>
      </div>
    </div>
  );
}

/* =========================================================
   DASHBOARD
========================================================= */

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<"overview" | "detailed">(
    "overview",
  );

  /* =======================================================
     REAL FIREBASE SENSOR DATA
  ======================================================= */

  const { data, liveData, loading, error, isOffline } = useAquaponicsData();
  const {
    configuration,
    error: configurationError,
  } = useSensorConfiguration();

  /* =======================================================
     DEVICE DATA
  ======================================================= */

  const { devices, toggleDevice } = useDeviceControl();

  /* =======================================================
     BATTERY PERCENT
  ======================================================= */

  const batteryPercent = useMemo(() => {
    return voltageToPercent(liveData.batteryVoltage);
  }, [liveData.batteryVoltage]);

  /* =======================================================
     SENSOR CARDS
  ======================================================= */

  const sensorCards = useMemo(() => {
    return [
      {
        key: "ph",
        value: liveData.ph,
      },

      {
        key: "dissolvedOxygen",
        value: liveData.dissolvedOxygen,
      },

      {
        key: "waterTemp",
        value: liveData.waterTemp,
      },

      {
        key: "ammonia",
        value: liveData.ammonia,
      },

      {
        key: "waterPercent",
        value: liveData.waterPercent,
      },

      {
        key: "batteryPercent",
        value: batteryPercent,
        statusValue: liveData.batteryVoltage,
      },
    ];
  }, [
    liveData.ph,
    liveData.dissolvedOxygen,
    liveData.waterTemp,
    liveData.ammonia,
    liveData.waterPercent,
    liveData.batteryVoltage,
    batteryPercent,
  ]);

  const sensorStatuses = useMemo(
    () =>
      sensorCards.reduce<Record<string, SensorStatus>>((statuses, sensor) => {
        const configurationKey =
          sensor.key === "batteryPercent" ? "batteryVoltage" : sensor.key;

        statuses[sensor.key] = getSensorStatus(
          "statusValue" in sensor ? sensor.statusValue : sensor.value,
          configuration?.[configurationKey],
          isOffline,
        );

        return statuses;
      }, {}),
    [sensorCards, configuration, isOffline],
  );

  const alertSensors = [
    { key: "ph", title: "pH outside configured range", value: liveData.ph, unit: "pH" },
    {
      key: "waterTemp",
      title: "Water temperature outside configured range",
      value: liveData.waterTemp,
      unit: "°C",
    },
    {
      key: "dissolvedOxygen",
      title: "Dissolved oxygen outside configured range",
      value: liveData.dissolvedOxygen,
      unit: "mg/L",
    },
    {
      key: "ammonia",
      title: "Ammonia outside configured range",
      value: liveData.ammonia,
      unit: "mg/L",
    },
    {
      key: "waterPercent",
      title: "Water level outside configured range",
      value: liveData.waterPercent,
      unit: "%",
    },
    {
      key: "batteryPercent",
      title: "Battery outside configured range",
      value: batteryPercent,
      unit: "%",
    },
  ];

  /* =======================================================
     WATER QUALITY CHART
  ======================================================= */

  const [chartData, setChartData] = useState<
    {
      time: string;
      ph: number | null;
      dissolvedOxygen: number | null;
      waterTemp: number | null;
      ammonia: number | null;
      waterPercent: number | null;
    }[]
  >([]);
  const [chartRangeHours, setChartRangeHours] = useState(1);

  useEffect(() => {
    const phRef = ref(db, "sensors/ph");
    const doRef = ref(db, "sensors/dissolvedOxygen");
    const tempRef = ref(db, "sensors/waterTemp");
    const ammoniaRef = ref(db, "sensors/ammonia");
    const waterRef = ref(db, "sensors/waterPercent");

    let phHistory: SensorHistoryPoint[] = [];
    let doHistory: SensorHistoryPoint[] = [];
    let tempHistory: SensorHistoryPoint[] = [];
    let ammoniaHistory: SensorHistoryPoint[] = [];
    let waterHistory: SensorHistoryPoint[] = [];

    const rebuildChart = () => {
      // Build maps once instead of repeatedly searching arrays.
      // The selected range is filtered before chart points are merged.
      const byTime = new Map<
        string,
        {
          time: string;
          ph: number | null;
          dissolvedOxygen: number | null;
          waterTemp: number | null;
          ammonia: number | null;
          waterPercent: number | null;
        }
      >();

      const ensurePoint = (time: string) => {
        let point = byTime.get(time);
        if (!point) {
          point = {
            time,
            ph: null,
            dissolvedOxygen: null,
            waterTemp: null,
            ammonia: null,
            waterPercent: null,
          };
          byTime.set(time, point);
        }
        return point;
      };

      for (const item of phHistory) ensurePoint(item.time).ph = item.value;
      for (const item of doHistory)
        ensurePoint(item.time).dissolvedOxygen = item.value;
      for (const item of tempHistory)
        ensurePoint(item.time).waterTemp = item.value;
      for (const item of ammoniaHistory)
        ensurePoint(item.time).ammonia = item.value;
      for (const item of waterHistory)
        ensurePoint(item.time).waterPercent = item.value;

      const result = Array.from(byTime.values()).sort((a, b) =>
        a.time.localeCompare(b.time),
      );

      // Keep the chart responsive while allowing historical ranges up to 7 days.
      setChartData(result.slice(-500));
    };

    const unsubscribePH = onValue(phRef, (snapshot) => {
      phHistory = readSensorHistory(snapshot.val(), chartRangeHours);
      rebuildChart();
    });

    const unsubscribeDO = onValue(doRef, (snapshot) => {
      doHistory = readSensorHistory(snapshot.val(), chartRangeHours);
      rebuildChart();
    });

    const unsubscribeTemp = onValue(tempRef, (snapshot) => {
      tempHistory = readSensorHistory(snapshot.val(), chartRangeHours);
      rebuildChart();
    });

    const unsubscribeAmmonia = onValue(ammoniaRef, (snapshot) => {
      ammoniaHistory = readSensorHistory(snapshot.val(), chartRangeHours);
      rebuildChart();
    });

    const unsubscribeWater = onValue(waterRef, (snapshot) => {
      waterHistory = readSensorHistory(snapshot.val(), chartRangeHours);
      rebuildChart();
    });

    return () => {
      unsubscribePH();
      unsubscribeDO();
      unsubscribeTemp();
      unsubscribeAmmonia();
      unsubscribeWater();
    };
  }, [chartRangeHours]);

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="rounded-3xl bg-white p-8 shadow-xl">
          <p className="text-sm font-medium text-slate-500">
            Loading live sensor data...
          </p>
        </div>
      </div>
    );
  }

  /* =======================================================
     DASHBOARD
  ======================================================= */

  return (
    <>
      {/* ===================================================
          BACKGROUND
      =================================================== */}

      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.02] mix-blend-multiply"
        style={{
          backgroundImage: `url(${bgImage})`,
          backgroundSize: "cover",
        }}
      />

      {/* ===================================================
          DASHBOARD HEADER
      =================================================== */}

      <div className="relative z-10 flex flex-col gap-3 sm:gap-4 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-display font-bold tracking-tight text-slate-900 sm:text-3xl">
            Dashboard
            <span className="text-emerald-500">.</span>
          </h1>

          <p className="mt-1 text-xs font-medium text-slate-500 sm:text-sm">
            Real-time monitoring of Tank 1
          </p>

          {(error || configurationError) && (
            <p className="mt-2 text-xs text-red-500 sm:text-sm">
              Firebase: {error ?? `Sensor thresholds: ${configurationError}`}
            </p>
          )}
        </div>
        <WeatherWidget />
      </div>

      {/* ===================================================
          SENSOR CARDS

          MOBILE:
          3 COLUMNS × 2 ROWS

          TABLET:
          3 COLUMNS

          DESKTOP:
          3 COLUMNS

          XL:
          6 COLUMNS
      =================================================== */}

      <div className="relative z-10 grid grid-cols-3 gap-2 sm:gap-3 lg:grid-cols-3 xl:grid-cols-6">
        {sensorCards.map((sensor) => {
          const value = sensor.value;
          const status = sensorStatuses[sensor.key];
          const styles = SENSOR_STATUS_PRESENTATION[status];

          let displayValue = "--";

          if (value !== null) {
            if (sensor.key === "ph" || sensor.key === "ammonia") {
              displayValue = value.toFixed(2);
            } else {
              displayValue = value.toFixed(1);
            }
          }

          /* =================================================
             CARD STYLE
          ================================================= */

          return (
            <div
              key={sensor.key}
              className={cn(
                "min-w-0 overflow-hidden rounded-2xl border",
                "px-2 py-2.5",
                "sm:px-4 sm:py-4",
                "lg:px-5 lg:py-5",
                "transition-all duration-200",
                "hover:-translate-y-0.5 hover:shadow-md",
                styles.card,
              )}
            >
              {/* =================================================
                  SENSOR CARD HEADER
              ================================================= */}

              <div className="flex min-w-0 items-start justify-between gap-1">
                <h3
                  className={cn(
                    "min-w-0 flex-1 truncate pr-1",
                    "text-[9px] leading-tight font-semibold text-slate-500",
                    "sm:text-xs",
                    "lg:text-sm",
                  )}
                >
                  {LABEL_MAP[sensor.key]}
                </h3>

                {/* SENSOR ICON */}

                <div
                  className={cn(
                    "flex shrink-0 items-center justify-center rounded-lg",
                    "h-6 w-6",
                    "sm:h-9 sm:w-9 sm:rounded-xl",
                    "lg:h-10 lg:w-10",
                    styles.icon,
                  )}
                >
                  {sensor.key === "ph" && <Droplets size={14} />}

                  {sensor.key === "dissolvedOxygen" && <Wind size={14} />}

                  {sensor.key === "waterTemp" && <Thermometer size={14} />}

                  {sensor.key === "ammonia" && <Activity size={14} />}

                  {sensor.key === "waterPercent" && <Droplets size={14} />}

                  {sensor.key === "batteryPercent" && <Zap size={14} />}
                </div>
              </div>

              {/* =================================================
                  SENSOR VALUE
              ================================================= */}

              <div className="mt-2 flex min-w-0 items-baseline gap-0.5 sm:mt-3 sm:gap-1">
                <span
                  className={cn(
                    "min-w-0 truncate font-display font-bold tracking-tight",
                    "text-[17px]",
                    "sm:text-2xl",
                    "lg:text-3xl",
                    styles.value,
                  )}
                >
                  {displayValue}
                </span>

                <span
                  className={cn(
                    "shrink-0 font-medium text-slate-400",
                    "text-[8px]",
                    "sm:text-xs",
                  )}
                >
                  {UNIT_MAP[sensor.key]}
                </span>
              </div>

              {/* =================================================
                  SENSOR STATUS
              ================================================= */}

              <div className="mt-1.5 sm:mt-2">
                <span
                  className={cn(
                    "inline-flex max-w-full items-center gap-0.5",
                    "rounded-md border",
                    "bg-white/80 shadow-sm",
                    "px-1.5 py-0.5",
                    "text-[7px] font-semibold",
                    "sm:gap-1 sm:rounded-lg sm:px-2 sm:py-1 sm:text-[10px]",
                    styles.badge,
                  )}
                >
                  <span
                    className={cn(
                      "h-1.5 w-1.5 rounded-full sm:h-2 sm:w-2",
                      styles.dot,
                    )}
                    aria-hidden="true"
                  />
                  {styles.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ===================================================
          MAIN CONTENT
      =================================================== */}

      <div className="relative z-10 grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3 lg:gap-8">
        {/* =================================================
            WATER QUALITY TRENDS
        ================================================= */}

        <div
          className="
            lg:col-span-2
            bg-white
            p-4 sm:p-6 lg:p-8
            rounded-3xl
            border border-slate-100
            shadow-xl shadow-slate-200/50
            min-w-0
            overflow-hidden
          "
        >
          {/* =================================================
              CHART HEADER
          ================================================= */}

          <div
            className="
              flex
              flex-col
              gap-4
              mb-5
              sm:mb-6
              lg:flex-row
              lg:items-center
              lg:justify-between
            "
          >
            <div className="min-w-0">
              <h3
                className="
                  text-xl
                  sm:text-2xl
                  lg:text-lg
                  font-display
                  font-bold
                  text-slate-800
                "
              >
                Water Quality Trends
              </h3>

              <p
                className="
                  mt-1
                  text-xs
                  sm:text-sm
                  text-slate-400
                  leading-5
                  max-w-[280px]
                  sm:max-w-none
                "
              >
                pH, Dissolved Oxygen, Temperature, Ammonia and Water Level
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <label
                htmlFor="chart-range"
                className="text-xs font-semibold text-slate-500"
              >
                Past readings
              </label>
              <select
                id="chart-range"
                value={chartRangeHours}
                onChange={(event) =>
                  setChartRangeHours(Number(event.target.value))
                }
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
              >
                <option value={1}>Last 1 hour</option>
                <option value={6}>Last 6 hours</option>
                <option value={24}>Last 24 hours</option>
                <option value={72}>Last 3 days</option>
                <option value={168}>Last 7 days</option>
                <option value={720}>Last 30 days</option>
              </select>
            </div>
            {chartRangeHours === 720 && (
              <p className="text-xs text-slate-400">
                Daily averages use recorded readings only; dates without stored
                history are not filled in.
              </p>
            )}

            {/* =================================================
                TABS
            ================================================= */}

            <div
              className="
                self-start
                flex
                bg-slate-50
                rounded-xl
                p-1
                border border-slate-100
              "
            >
              <button
                onClick={() => setActiveTab("overview")}
                className={cn(
                  "px-3 sm:px-4 py-2 text-[10px] sm:text-xs font-bold rounded-lg transition-all duration-300",
                  activeTab === "overview"
                    ? "bg-white text-emerald-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-700",
                )}
              >
                Overview
              </button>

              <button
                onClick={() => setActiveTab("detailed")}
                className={cn(
                  "px-3 sm:px-4 py-2 text-[10px] sm:text-xs font-bold rounded-lg transition-all duration-300",
                  activeTab === "detailed"
                    ? "bg-white text-emerald-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-700",
                )}
              >
                Detailed
              </button>
            </div>
          </div>

          {/* =================================================
              SENSOR LEGEND

              CUSTOM LEGEND
              Keeps everything INSIDE the card.
          ================================================= */}

          <div
            className="
              w-full
              mb-4
              p-3
              sm:p-4
              rounded-2xl
              bg-slate-50/70
              border border-slate-100
              overflow-hidden
            "
          >
            <div
              className="
                grid
                grid-cols-2
                gap-x-3
                gap-y-2
                sm:flex
                sm:flex-wrap
                sm:gap-x-5
                sm:gap-y-2
              "
            >
              {/* pH */}

              <div className="flex items-center gap-1.5 min-w-0">
                <span className="w-2.5 h-2.5 shrink-0 rounded-full bg-emerald-500" />

                <span className="text-[10px] sm:text-xs font-semibold text-emerald-600 truncate">
                  pH Level
                </span>
              </div>

              {/* Dissolved Oxygen */}

              <div className="flex items-center gap-1.5 min-w-0">
                <span className="w-2.5 h-2.5 shrink-0 rounded-full bg-cyan-500" />

                <span className="text-[10px] sm:text-xs font-semibold text-cyan-600 truncate">
                  Dissolved Oxygen
                </span>
              </div>

              {/* Temperature */}

              <div className="flex items-center gap-1.5 min-w-0">
                <span className="w-2.5 h-2.5 shrink-0 rounded-full bg-orange-500" />

                <span className="text-[10px] sm:text-xs font-semibold text-orange-600 truncate">
                  Temperature
                </span>
              </div>

              {/* Ammonia */}

              <div className="flex items-center gap-1.5 min-w-0">
                <span className="w-2.5 h-2.5 shrink-0 rounded-full bg-red-500" />

                <span className="text-[10px] sm:text-xs font-semibold text-red-600 truncate">
                  Ammonia
                </span>
              </div>

              {/* Water Level */}

              <div className="flex items-center gap-1.5 min-w-0">
                <span className="w-2.5 h-2.5 shrink-0 rounded-full bg-blue-500" />

                <span className="text-[10px] sm:text-xs font-semibold text-blue-600 truncate">
                  Water Level
                </span>
              </div>
            </div>
          </div>

          {/* =================================================
              CHART
          ================================================= */}

          <div className="w-full min-w-0 overflow-hidden">
            <div
              className="
                h-[250px]
                sm:h-[300px]
                lg:h-[400px]
                w-full
                min-w-0
              "
            >
              {chartData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-sm text-slate-400">
                  Waiting for sensor history...
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={chartData}
                    margin={{
                      top: 5,
                      right: 5,
                      left: -10,
                      bottom: 5,
                    }}
                  >
                    {/* =================================================
                        GRADIENTS
                    ================================================= */}

                    <defs>
                      {/* pH */}

                      <linearGradient id="colorPH" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="5%"
                          stopColor="#10b981"
                          stopOpacity={0.18}
                        />

                        <stop
                          offset="95%"
                          stopColor="#10b981"
                          stopOpacity={0}
                        />
                      </linearGradient>

                      {/* Dissolved Oxygen */}

                      <linearGradient id="colorDO" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="5%"
                          stopColor="#06b6d4"
                          stopOpacity={0.18}
                        />

                        <stop
                          offset="95%"
                          stopColor="#06b6d4"
                          stopOpacity={0}
                        />
                      </linearGradient>

                      {/* Temperature */}

                      <linearGradient
                        id="colorTemp"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#f59e0b"
                          stopOpacity={0.18}
                        />

                        <stop
                          offset="95%"
                          stopColor="#f59e0b"
                          stopOpacity={0}
                        />
                      </linearGradient>

                      {/* Ammonia */}

                      <linearGradient
                        id="colorAmmonia"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#ef4444"
                          stopOpacity={0.18}
                        />

                        <stop
                          offset="95%"
                          stopColor="#ef4444"
                          stopOpacity={0}
                        />
                      </linearGradient>

                      {/* Water Level */}

                      <linearGradient
                        id="colorWater"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#3b82f6"
                          stopOpacity={0.18}
                        />

                        <stop
                          offset="95%"
                          stopColor="#3b82f6"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>

                    {/* =================================================
                        GRID
                    ================================================= */}

                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#f1f5f9"
                    />

                    {/* =================================================
                        X AXIS
                    ================================================= */}

                    <XAxis
                      dataKey="time"
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fontSize: 9,
                        fill: "#94a3b8",
                        fontWeight: 500,
                      }}
                      tickFormatter={(value) => {
                        return formatSensorHistoryLabel(String(value));
                      }}
                      dy={8}
                      interval="preserveStartEnd"
                    />

                    {/* =================================================
                        Y AXIS
                    ================================================= */}

                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      width={28}
                      tick={{
                        fontSize: 9,
                        fill: "#94a3b8",
                        fontWeight: 500,
                      }}
                    />

                    {/* =================================================
                        TOOLTIP
                    ================================================= */}

                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(255, 255, 255, 0.97)",
                        borderRadius: "12px",
                        border: "1px solid #e2e8f0",
                        boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                        fontSize: "11px",
                      }}
                      labelStyle={{
                        color: "#64748b",
                        marginBottom: "8px",
                        fontWeight: 600,
                      }}
                      formatter={(value: any, name: any) => {
                        if (value === null || value === undefined) {
                          return ["--", name];
                        }

                        if (name === "pH Level") {
                          return [Number(value).toFixed(2), name];
                        }

                        if (name === "Ammonia") {
                          return [Number(value).toFixed(2) + " mg/L", name];
                        }

                        if (name === "Dissolved Oxygen") {
                          return [Number(value).toFixed(2) + " mg/L", name];
                        }

                        if (name === "Temperature") {
                          return [Number(value).toFixed(1) + " °C", name];
                        }

                        if (name === "Water Level") {
                          return [Number(value).toFixed(1) + "%", name];
                        }

                        return [value, name];
                      }}
                    />

                    {/* =================================================
                        pH
                    ================================================= */}

                    <Area
                      type="monotone"
                      dataKey="ph"
                      stroke="#10b981"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#colorPH)"
                      name="pH Level"
                      connectNulls
                      dot={false}
                      activeDot={{
                        r: 4,
                      }}
                    />

                    {/* =================================================
                        DISSOLVED OXYGEN
                    ================================================= */}

                    <Area
                      type="monotone"
                      dataKey="dissolvedOxygen"
                      stroke="#06b6d4"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#colorDO)"
                      name="Dissolved Oxygen"
                      connectNulls
                      dot={false}
                      activeDot={{
                        r: 4,
                      }}
                    />

                    {/* =================================================
                        TEMPERATURE
                    ================================================= */}

                    <Area
                      type="monotone"
                      dataKey="waterTemp"
                      stroke="#f59e0b"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#colorTemp)"
                      name="Temperature"
                      connectNulls
                      dot={false}
                      activeDot={{
                        r: 4,
                      }}
                    />

                    {/* =================================================
                        AMMONIA
                    ================================================= */}

                    <Area
                      type="monotone"
                      dataKey="ammonia"
                      stroke="#ef4444"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#colorAmmonia)"
                      name="Ammonia"
                      connectNulls
                      dot={false}
                      activeDot={{
                        r: 4,
                      }}
                    />

                    {/* =================================================
                        WATER LEVEL
                    ================================================= */}

                    <Area
                      type="monotone"
                      dataKey="waterPercent"
                      stroke="#3b82f6"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#colorWater)"
                      name="Water Level"
                      connectNulls
                      dot={false}
                      activeDot={{
                        r: 4,
                      }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* =================================================
              LIVE DATA FOOTER
          ================================================= */}

          <div
            className="
              mt-4
              flex
              items-center
              justify-between
              px-3
              py-3
              rounded-xl
              bg-slate-50
            "
          >
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />

              <span className="text-[10px] sm:text-xs font-semibold text-slate-500">
                Live sensor data
              </span>
            </div>

            <span className="text-[9px] sm:text-xs font-semibold text-slate-400">
              Auto updated
            </span>
          </div>
        </div>

        {/* =================================================
            RIGHT COLUMN
        ================================================= */}

        <div className="space-y-4 sm:space-y-6 lg:space-y-8">
          {/* =================================================
              MANUAL SYSTEM CONTROLS
          ================================================= */}

          <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-xl shadow-slate-200/50 sm:p-6 lg:p-8">
            <h3 className="mb-5 text-lg font-display font-bold text-slate-800 sm:mb-6">
              Manual System Controls
            </h3>

            <div className="space-y-3 sm:space-y-5">
              {Object.entries(DEVICE_CONFIG).map(([key, config]) => {
                const IconComp = config.icon;

                const isOn = Boolean(devices[key]);

                return (
                  <div
                    key={key}
                    className="
                        flex
                        items-center
                        justify-between
                        rounded-2xl
                        border
                        border-slate-100
                        bg-slate-50/50
                        p-3
                        transition-colors
                        hover:border-emerald-100
                        sm:p-4
                      "
                  >
                    <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                      {/* DEVICE ICON */}

                      <div
                        className={cn(
                          "shrink-0 rounded-xl p-2.5 text-white shadow-md sm:p-3",
                          `bg-gradient-to-br ${config.gradient}`,
                          config.shadow,
                        )}
                      >
                        <IconComp size={18} />
                      </div>

                      {/* DEVICE NAME */}

                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-slate-800">
                          {config.name}
                        </p>
                      </div>
                    </div>

                    {/* TOGGLE */}

                    <Toggle isOn={isOn} onToggle={() => toggleDevice(key)} />
                  </div>
                );
              })}
            </div>
          </div>

          {/* =================================================
              ALERTS
          ================================================= */}

          <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-xl shadow-slate-200/50 sm:p-6 lg:p-8">
            <h3 className="mb-5 flex items-center justify-between text-lg font-display font-bold text-slate-800 sm:mb-6">
              Recent Alerts
              <span className="rounded-full border border-red-100 bg-red-50 px-2 py-0.5 text-xs font-bold text-red-600">
                Live
              </span>
            </h3>

            <div className="space-y-3 sm:space-y-4">
              {alertSensors.map((sensor) => {
                const status = sensorStatuses[sensor.key];

                if (
                  (status !== "warning" && status !== "critical") ||
                  sensor.value === null
                ) {
                  return null;
                }

                return (
                  <SensorStatusAlert
                    key={sensor.key}
                    title={sensor.title}
                    reading={sensor.value}
                    unit={sensor.unit}
                    status={status}
                  />
                );
              })}

              {!alertSensors.some(({ key }) =>
                ["warning", "critical"].includes(sensorStatuses[key]),
              ) && (
                <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
                  {isOffline
                    ? "The sensor device is offline. Check the latest sensor statuses above."
                    : alertSensors.every((sensor) => sensor.value === null)
                      ? "Waiting for live Firebase sensor readings..."
                      : "No warning or critical sensor conditions. Review cards marked No Data or Unconfigured."}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
