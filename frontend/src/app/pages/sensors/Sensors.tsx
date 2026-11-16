import { useEffect, useMemo, useState } from "react";
import {
  Thermometer,
  Droplets,
  Wind,
  Activity,
  Battery,
  Gauge,
  Ruler,
  Zap,
  AlertTriangle,
  Settings,
  SlidersHorizontal,
  X,
  Save,
  RotateCcw,
  CheckCircle2,
  Waves,
} from "lucide-react";

import { cn } from "../../lib/utils";
import { useAquaponicsData } from "../../../hooks/useAquaponicsData";
import { useSensorConfiguration } from "../../../hooks/useSensorConfiguration";
import {
  getSensorStatus,
  SENSOR_STATUS_PRESENTATION,
  type SensorConfiguration,
  type SensorStatus,
} from "../../lib/sensorStatus";

import { get, ref, set } from "firebase/database";
import { db } from "../../../firebase";

/*
==================================================
SENSOR CARD
==================================================
*/

interface SensorCard {
  key: string;
  name: string;
  value: number | null;
  unit: string;
  icon: React.ReactNode;
  status: SensorStatus;
  displayValue?: string;
  secondary?: string;
}

interface SensorLimit {
  low: number;
  high: number;
  unit: string;
}

function parseLimitValue(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function toEditableLimits(
  configuration: SensorConfiguration,
): Record<string, SensorLimit> {
  const result: Record<string, SensorLimit> = {};

  Object.entries(configuration).forEach(([key, threshold]) => {
    const low = parseLimitValue(threshold.low);
    const high = parseLimitValue(threshold.high);

    if (low === null || high === null || low >= high) {
      return;
    }

    result[key] = {
      low,
      high,
      unit: typeof threshold.unit === "string" ? threshold.unit : "",
    };
  });

  return result;
}

/*
==================================================
3-POINT PH CALIBRATION
==================================================

Three calibration points:

pH 4.00
pH 7.00
pH 10.01

The ESP32 can use these as two linear segments:

Segment 1:
pH 4.00 -> pH 7.00

Segment 2:
pH 7.00 -> pH 10.01
*/

interface PHCalibration {
  ph4Voltage: number | null;
  ph7Voltage: number | null;
  ph10Voltage: number | null;

  /*
  Legacy values retained for compatibility
  with existing code.
  */
  slope: number | null;
  intercept: number | null;

  calibratedAt: string | null;
}

/*
==================================================
ULTRASONIC CALIBRATION
==================================================
*/

interface UltrasonicCalibration {
  tankDepth: number;
  emptyDistance: number | null;
  fullDistance: number | null;
  calibratedAt: string | null;
}

/*
==================================================
BATTERY
==================================================
*/

const MIN_BATTERY_VOLTAGE = 8.4;
const MAX_BATTERY_VOLTAGE = 12.6;

function batteryPercentage(voltage: number | null): number | null {
  if (voltage === null || !Number.isFinite(voltage)) {
    return null;
  }

  const percentage =
    ((voltage - MIN_BATTERY_VOLTAGE) /
      (MAX_BATTERY_VOLTAGE - MIN_BATTERY_VOLTAGE)) *
    100;

  return Math.max(0, Math.min(100, percentage));
}

/*
==================================================
FORMAT VALUE
==================================================
*/

function formatValue(key: string, value: number | null): string {
  if (value === null || !Number.isFinite(value)) {
    return "--";
  }

  switch (key) {
    case "ph":
      return value.toFixed(2);

    case "ammonia":
      return value.toFixed(2);

    case "dissolvedOxygen":
      return value.toFixed(2);

    case "waterTemp":
      return value.toFixed(1);

    case "waterPercent":
      return value.toFixed(1);

    case "batteryVoltage":
      return value.toFixed(2);

    case "currentDraw":
      return value.toFixed(2);

    case "distance":
      return value.toFixed(1);

    case "waterLevel":
      return value.toFixed(1);

    default:
      return value.toFixed(2);
  }
}

/*
==================================================
MAIN COMPONENT
==================================================
*/

export default function Sensors() {
  const { liveData, loading, error, isOffline } = useAquaponicsData();
  const {
    configuration: sensorConfiguration,
    error: sensorConfigurationError,
  } = useSensorConfiguration();

  /*
  ==================================================
  CONFIGURATION
  ==================================================
  */

  const [configurationOpen, setConfigurationOpen] = useState(false);

  const [limits, setLimits] =
    useState<Record<string, SensorLimit>>({});

  const [savingConfiguration, setSavingConfiguration] = useState(false);

  const [configurationMessage, setConfigurationMessage] = useState("");

  /*
  ==================================================
  FEEDER CONFIGURATION
  ==================================================
  */

  const [feederOpenSeconds, setFeederOpenSeconds] = useState(0.5);

  /*
  ==================================================
  CALIBRATION MODAL
  ==================================================
  */

  const [calibrationOpen, setCalibrationOpen] = useState(false);

  const [calibrationTab, setCalibrationTab] = useState<
    "ph" | "ultrasonic" | "feeder"
  >("ph");

  /*
  ==================================================
  3-POINT PH CALIBRATION
  ==================================================
  */

  const [phCalibration, setPhCalibration] = useState<PHCalibration>({
    ph4Voltage: null,
    ph7Voltage: null,
    ph10Voltage: null,
    slope: null,
    intercept: null,
    calibratedAt: null,
  });

  const [savingPH4, setSavingPH4] = useState(false);
  const [savingPH7, setSavingPH7] = useState(false);
  const [savingPH10, setSavingPH10] = useState(false);

  const [phMessage, setPhMessage] = useState("");

  /*
  ==================================================
  ULTRASONIC CALIBRATION
  ==================================================
  */

  const [ultrasonicCalibration, setUltrasonicCalibration] =
    useState<UltrasonicCalibration>({
      tankDepth: 60,
      emptyDistance: null,
      fullDistance: null,
      calibratedAt: null,
    });

  const [tankDepthInput, setTankDepthInput] = useState("60");

  const [emptyDistanceInput, setEmptyDistanceInput] = useState("");

  const [fullDistanceInput, setFullDistanceInput] = useState("");

  const [savingUltrasonic, setSavingUltrasonic] = useState(false);

  const [ultrasonicMessage, setUltrasonicMessage] = useState("");

  /*
  ==================================================
  FEEDER CALIBRATION
  ==================================================
  The feeder duration is stored in Firebase at:
  /calibration/feeder/openSeconds

  This is the actual calibration value used by the ESP32.
  */
  const [feederCalibrationSeconds, setFeederCalibrationSeconds] =
    useState("0.5");

  const [savingFeederCalibration, setSavingFeederCalibration] = useState(false);

  const [feederCalibrationMessage, setFeederCalibrationMessage] = useState("");

  const DEFAULT_FEEDER_CALIBRATION_SECONDS = 0.5;

  /*
  ==================================================
  BATTERY
  ==================================================
  */

  const batteryPercent = batteryPercentage(liveData.batteryVoltage);

  /*
  ==================================================
  LIVE PH VOLTAGE

  This reads:

  liveData.phVoltage

  to be supplied by useAquaponicsData().
  ==================================================
  */

  const phVoltage = liveData.phVoltage;

  /*
  ==================================================
  LOAD CONFIGURATION
  ==================================================
  */

  useEffect(() => {
    if (!configurationOpen && sensorConfiguration) {
      setLimits(toEditableLimits(sensorConfiguration));
    }
  }, [configurationOpen, sensorConfiguration]);

  /*
  ==================================================
  LOAD FEEDER CONFIGURATION
  ==================================================
  */

  useEffect(() => {
    async function loadFeederConfiguration() {
      try {
        const snapshot = await get(ref(db, "/calibration/feeder"));

        if (snapshot.exists()) {
          const value = snapshot.val();
          const seconds = Number(value.openSeconds);

          if (Number.isFinite(seconds)) {
            setFeederOpenSeconds(Math.max(0.1, Math.min(10, seconds)));
          }
        }
      } catch (err) {
        console.error("Failed to load feeder configuration:", err);
      }
    }

    loadFeederConfiguration();
  }, []);

  /*
  ==================================================
  LOAD 3-POINT PH CALIBRATION
  ==================================================
  */

  useEffect(() => {
    async function loadPHCalibration() {
      try {
        const snapshot = await get(ref(db, "/calibration/ph"));

        if (!snapshot.exists()) {
          return;
        }

        const value = snapshot.val();

        setPhCalibration({
          ph4Voltage:
            value.ph4Voltage !== undefined ? Number(value.ph4Voltage) : null,

          ph7Voltage:
            value.ph7Voltage !== undefined ? Number(value.ph7Voltage) : null,

          ph10Voltage:
            value.ph10Voltage !== undefined ? Number(value.ph10Voltage) : null,

          slope: value.slope !== undefined ? Number(value.slope) : null,

          intercept:
            value.intercept !== undefined ? Number(value.intercept) : null,

          calibratedAt: value.calibratedAt ?? null,
        });
      } catch (err) {
        console.error("Failed to load pH calibration:", err);
      }
    }

    loadPHCalibration();
  }, []);

  /*
  ==================================================
  LOAD ULTRASONIC CALIBRATION
  ==================================================
  */

  useEffect(() => {
    async function loadUltrasonicCalibration() {
      try {
        const snapshot = await get(ref(db, "/calibration/ultrasonic"));

        if (!snapshot.exists()) {
          return;
        }

        const value = snapshot.val();

        setUltrasonicCalibration({
          tankDepth: value.tankDepth ?? 60,
          emptyDistance: value.emptyDistance ?? null,
          fullDistance: value.fullDistance ?? null,
          calibratedAt: value.calibratedAt ?? null,
        });

        setTankDepthInput(String(value.tankDepth ?? 60));

        if (value.emptyDistance !== undefined) {
          setEmptyDistanceInput(String(value.emptyDistance));
        }

        if (value.fullDistance !== undefined) {
          setFullDistanceInput(String(value.fullDistance));
        }
      } catch (err) {
        console.error("Failed to load ultrasonic calibration:", err);
      }
    }

    loadUltrasonicCalibration();
  }, []);

  /*
  ==================================================
  SAVE CONFIGURATION
  ==================================================
  */

  async function saveConfiguration() {
    if (!sensorConfiguration) {
      setConfigurationMessage("Sensor thresholds have not loaded from Firebase yet.");
      return;
    }

    if (Object.keys(limits).length === 0) {
      setConfigurationMessage("No valid Firebase sensor thresholds are available to save.");
      return;
    }

    setSavingConfiguration(true);
    setConfigurationMessage("");

    try {
      await set(ref(db, "/configuration/sensors"), limits);

      setConfigurationMessage("Sensor limits saved successfully.");
    } catch (err) {
      console.error(err);

      setConfigurationMessage("Failed to save configuration.");
    } finally {
      setSavingConfiguration(false);
    }
  }

  /*
  ==================================================
  RESET CONFIGURATION
  ==================================================
  */

  function resetConfiguration() {
    setLimits(
      sensorConfiguration ? toEditableLimits(sensorConfiguration) : {},
    );

    setConfigurationMessage(
      "Saved Firebase thresholds restored.",
    );
  }

  /*
  ==================================================
  COMPLETE 3-POINT PH CALIBRATION
  ==================================================

  pH 4.00
  pH 7.00
  pH 10.01

  The three points are stored.

  For compatibility, slope/intercept are calculated
  using the pH 4 -> pH 7 segment.
  ==================================================
  */

  async function completePHCalibration(
    ph4Voltage: number,
    ph7Voltage: number,
    ph10Voltage: number,
  ) {
    if (
      !Number.isFinite(ph4Voltage) ||
      !Number.isFinite(ph7Voltage) ||
      !Number.isFinite(ph10Voltage)
    ) {
      setPhMessage("Invalid calibration voltage.");
      return;
    }

    /*
    All three voltage values must be different.
    */

    if (
      ph4Voltage === ph7Voltage ||
      ph7Voltage === ph10Voltage ||
      ph4Voltage === ph10Voltage
    ) {
      setPhMessage("The three calibration voltages must be different.");
      return;
    }

    /*
    Expected PH probe behavior:

    pH 4  -> higher voltage
    pH 7  -> middle voltage
    pH 10 -> lower voltage
    */

    if (!(ph4Voltage > ph7Voltage && ph7Voltage > ph10Voltage)) {
      setPhMessage(
        "Expected voltage order is pH 4 > pH 7 > pH 10.01. Please verify the probe and buffer solutions.",
      );

      return;
    }

    /*
    Legacy slope/intercept.

    This represents the pH 4 -> pH 7 segment.
    */

    const slope = (7.0 - 4.0) / (ph7Voltage - ph4Voltage);

    const intercept = 4.0 - slope * ph4Voltage;

    const calibratedAt = new Date().toISOString();

    try {
      await set(ref(db, "/calibration/ph"), {
        ph4Voltage,
        ph7Voltage,
        ph10Voltage,

        /*
        Legacy compatibility fields.
        */

        slope,
        intercept,

        calibratedAt,
      });

      setPhCalibration({
        ph4Voltage,
        ph7Voltage,
        ph10Voltage,
        slope,
        intercept,
        calibratedAt,
      });

      setPhMessage("Three-point pH calibration completed successfully.");
    } catch (err) {
      console.error(err);

      setPhMessage("Failed to save final pH calibration.");
    }
  }

  /*
  ==================================================
  SAVE PH 4 POINT
  ==================================================
  */

  async function savePH4Calibration() {
    if (phVoltage === null || !Number.isFinite(phVoltage)) {
      setPhMessage(
        "No valid pH voltage is currently being received from the ESP32.",
      );

      return;
    }

    setSavingPH4(true);
    setPhMessage("");

    try {
      const newPH4Voltage = phVoltage;

      await set(ref(db, "/calibration/ph/ph4Voltage"), newPH4Voltage);

      const existingPH7 = phCalibration.ph7Voltage;
      const existingPH10 = phCalibration.ph10Voltage;

      setPhCalibration((previous) => ({
        ...previous,
        ph4Voltage: newPH4Voltage,
      }));

      /*
      If all three points exist,
      automatically complete calibration.
      */

      if (existingPH7 !== null && existingPH10 !== null) {
        await completePHCalibration(newPH4Voltage, existingPH7, existingPH10);
      } else {
        setPhMessage(
          `pH 4.00 calibration point saved at ${newPH4Voltage.toFixed(3)} V.`,
        );
      }
    } catch (err) {
      console.error(err);

      setPhMessage("Failed to save pH 4 calibration.");
    } finally {
      setSavingPH4(false);
    }
  }

  /*
  ==================================================
  SAVE PH 7 POINT
  ==================================================
  */

  async function savePH7Calibration() {
    if (phVoltage === null || !Number.isFinite(phVoltage)) {
      setPhMessage(
        "No valid pH voltage is currently being received from the ESP32.",
      );

      return;
    }

    setSavingPH7(true);
    setPhMessage("");

    try {
      const newPH7Voltage = phVoltage;

      await set(ref(db, "/calibration/ph/ph7Voltage"), newPH7Voltage);

      const existingPH4 = phCalibration.ph4Voltage;
      const existingPH10 = phCalibration.ph10Voltage;

      setPhCalibration((previous) => ({
        ...previous,
        ph7Voltage: newPH7Voltage,
      }));

      if (existingPH4 !== null && existingPH10 !== null) {
        await completePHCalibration(existingPH4, newPH7Voltage, existingPH10);
      } else {
        setPhMessage(
          `pH 7.00 calibration point saved at ${newPH7Voltage.toFixed(3)} V.`,
        );
      }
    } catch (err) {
      console.error(err);

      setPhMessage("Failed to save pH 7 calibration.");
    } finally {
      setSavingPH7(false);
    }
  }

  /*
  ==================================================
  SAVE PH 10.01 POINT
  ==================================================
  */

  async function savePH10Calibration() {
    if (phVoltage === null || !Number.isFinite(phVoltage)) {
      setPhMessage(
        "No valid pH voltage is currently being received from the ESP32.",
      );

      return;
    }

    setSavingPH10(true);
    setPhMessage("");

    try {
      const newPH10Voltage = phVoltage;

      await set(ref(db, "/calibration/ph/ph10Voltage"), newPH10Voltage);

      const existingPH4 = phCalibration.ph4Voltage;
      const existingPH7 = phCalibration.ph7Voltage;

      setPhCalibration((previous) => ({
        ...previous,
        ph10Voltage: newPH10Voltage,
      }));

      if (existingPH4 !== null && existingPH7 !== null) {
        await completePHCalibration(existingPH4, existingPH7, newPH10Voltage);
      } else {
        setPhMessage(
          `pH 10.01 calibration point saved at ${newPH10Voltage.toFixed(3)} V.`,
        );
      }
    } catch (err) {
      console.error(err);

      setPhMessage("Failed to save pH 10.01 calibration.");
    } finally {
      setSavingPH10(false);
    }
  }

  /*
  ==================================================
  SAVE FEEDER CALIBRATION
  ==================================================
  */

  async function saveFeederCalibration() {
    const seconds = Number(feederCalibrationSeconds);

    if (!Number.isFinite(seconds) || seconds < 0.1 || seconds > 10) {
      setFeederCalibrationMessage(
        "Please enter a feeder duration between 0.1 and 10 seconds.",
      );
      return;
    }

    setSavingFeederCalibration(true);
    setFeederCalibrationMessage("");

    try {
      const safeSeconds = Number(seconds.toFixed(1));

      await set(ref(db, "/calibration/feeder"), {
        openSeconds: safeSeconds,
        calibratedAt: new Date().toISOString(),
      });

      setFeederOpenSeconds(safeSeconds);
      setFeederCalibrationSeconds(String(safeSeconds));

      setFeederCalibrationMessage(
        `Feeder calibration saved: ${safeSeconds.toFixed(1)} seconds.`,
      );
    } catch (err) {
      console.error(err);
      setFeederCalibrationMessage("Failed to save feeder calibration.");
    } finally {
      setSavingFeederCalibration(false);
    }
  }

  /*
  ==================================================
  RESET FEEDER CALIBRATION
  ==================================================
  */

  function resetFeederCalibration() {
    setFeederCalibrationSeconds(String(DEFAULT_FEEDER_CALIBRATION_SECONDS));

    setFeederOpenSeconds(DEFAULT_FEEDER_CALIBRATION_SECONDS);

    setFeederCalibrationMessage(
      "Default feeder duration restored. Click Save Feeder Calibration to apply it.",
    );
  }

  /*
  ==================================================
  SAVE ULTRASONIC CALIBRATION
  ==================================================
  */

  async function saveUltrasonicCalibration() {
    const tankDepth = Number(tankDepthInput);
    const emptyDistance = Number(emptyDistanceInput);
    const fullDistance = Number(fullDistanceInput);

    if (
      !Number.isFinite(tankDepth) ||
      !Number.isFinite(emptyDistance) ||
      !Number.isFinite(fullDistance)
    ) {
      setUltrasonicMessage("Please enter valid measurements.");

      return;
    }

    if (emptyDistance <= fullDistance) {
      setUltrasonicMessage(
        "Empty-tank distance should be greater than full-tank distance.",
      );

      return;
    }

    const calibratedAt = new Date().toISOString();

    setSavingUltrasonic(true);
    setUltrasonicMessage("");

    try {
      await set(ref(db, "/calibration/ultrasonic"), {
        tankDepth,
        emptyDistance,
        fullDistance,
        calibratedAt,
      });

      setUltrasonicCalibration({
        tankDepth,
        emptyDistance,
        fullDistance,
        calibratedAt,
      });

      setUltrasonicMessage("Water-level calibration saved successfully.");
    } catch (err) {
      console.error(err);

      setUltrasonicMessage("Failed to save ultrasonic calibration.");
    } finally {
      setSavingUltrasonic(false);
    }
  }

  /*
  ==================================================
  SENSOR CARDS
  ==================================================
  */

  const sensors = useMemo<SensorCard[]>(
    () => [
      {
        key: "ph",
        name: "pH Level",
        value: liveData.ph,
        unit: "pH",
        icon: <Droplets size={28} />,
        status: getSensorStatus(
          liveData.ph,
          sensorConfiguration?.ph,
          isOffline,
        ),
      },

      {
        key: "dissolvedOxygen",
        name: "Dissolved Oxygen",
        value: liveData.dissolvedOxygen,
        unit: "mg/L",
        icon: <Wind size={28} />,
        status: getSensorStatus(
          liveData.dissolvedOxygen,
          sensorConfiguration?.dissolvedOxygen,
          isOffline,
        ),
      },

      {
        key: "waterTemp",
        name: "Water Temperature",
        value: liveData.waterTemp,
        unit: "°C",
        icon: <Thermometer size={28} />,
        status: getSensorStatus(
          liveData.waterTemp,
          sensorConfiguration?.waterTemp,
          isOffline,
        ),
      },

      {
        key: "ammonia",
        name: "Ammonia",
        value: liveData.ammonia,
        unit: "mg/L",
        icon: <Activity size={28} />,
        status: getSensorStatus(
          liveData.ammonia,
          sensorConfiguration?.ammonia,
          isOffline,
        ),
      },

      {
        key: "waterPercent",
        name: "Water Level",
        value: liveData.waterPercent,
        unit: "%",
        icon: <Droplets size={28} />,
        status: getSensorStatus(
          liveData.waterPercent,
          sensorConfiguration?.waterPercent,
          isOffline,
        ),
      },

      {
        key: "distance",
        name: "Distance",
        value: liveData.distance,
        unit: "cm",
        icon: <Ruler size={28} />,
        status: getSensorStatus(
          liveData.distance,
          sensorConfiguration?.distance,
          isOffline,
        ),
      },

      {
        key: "batteryVoltage",
        name: "Battery",
        value: liveData.batteryVoltage,
        unit: "V",
        icon: <Battery size={28} />,
        status: getSensorStatus(
          liveData.batteryVoltage,
          {
            low: MIN_BATTERY_VOLTAGE,
            high: MAX_BATTERY_VOLTAGE,
            unit: "V",
          },
          isOffline,
        ),
        displayValue:
          batteryPercent === null ? "--" : `${batteryPercent.toFixed(0)}%`,
        secondary:
          liveData.batteryVoltage === null
            ? "Voltage: --"
            : `Voltage: ${liveData.batteryVoltage.toFixed(2)} V`,
      },

      {
        key: "currentDraw",
        name: "Current Draw",
        value: liveData.currentDraw,
        unit: "A",
        icon: <Zap size={28} />,
        status: getSensorStatus(
          liveData.currentDraw,
          sensorConfiguration?.currentDraw,
          isOffline,
        ),
      },

      {
        key: "waterLevel",
        name: "Water Distance / Level",
        value: liveData.waterLevel,
        unit: "cm",
        icon: <Gauge size={28} />,
        status: getSensorStatus(
          liveData.waterLevel,
          sensorConfiguration?.waterLevel,
          isOffline,
        ),
      },
    ],
    [liveData, sensorConfiguration, isOffline, batteryPercent],
  );

  /*
  ==================================================
  LOADING
  ==================================================
  */

  if (loading) {
    return (
      <div className="min-h-full flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3">
          <div className="p-4 rounded-2xl bg-emerald-50">
            <Activity size={30} className="text-emerald-600 animate-pulse" />
          </div>

          <p className="text-sm font-semibold text-slate-500">
            Loading live sensor data...
          </p>
        </div>
      </div>
    );
  }

  /*
  ==================================================
  RENDER
  ==================================================
  */

  return (
    <div className="space-y-8">
      {/* ==================================================
          HEADER
      ================================================== */}

      <div>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 min-w-0">
              <h1 className="text-3xl font-display font-bold text-slate-900 tracking-tight">
                Sensor Readings
                <span className="text-emerald-500">.</span>
              </h1>

              <div
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-full border",
                  isOffline
                    ? "bg-slate-100 border-slate-200"
                    : "bg-emerald-50 border-emerald-100",
                )}
              >
                <span
                  className={cn(
                    "relative inline-flex rounded-full h-2.5 w-2.5",
                    isOffline ? "bg-slate-400" : "bg-emerald-500",
                  )}
                >
                  {!isOffline && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  )}
                </span>

                <span
                  className={cn(
                    "text-xs font-bold",
                    isOffline ? "text-slate-600" : "text-emerald-700",
                  )}
                >
                  {isOffline ? "OFFLINE" : "LIVE"}
                </span>
              </div>
            </div>

            <p className="text-slate-500 font-medium mt-1">
              Real-time sensor readings from Tank 1
            </p>
          </div>

          {/* BUTTONS */}

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => {
                setConfigurationMessage("");
                setConfigurationOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold text-xs shadow-sm hover:bg-slate-50 transition"
            >
              <Settings size={16} />
              Configuration
            </button>

            <button
              onClick={() => {
                setPhMessage("");
                setUltrasonicMessage("");
                setCalibrationOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 text-white font-bold text-xs shadow-md shadow-emerald-200 hover:bg-emerald-700 transition"
            >
              <SlidersHorizontal size={16} />
              Calibration
            </button>
          </div>
        </div>

        {(error || sensorConfigurationError) && (
          <div className="mt-4 flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-100">
            <AlertTriangle size={20} className="text-red-500" />

            <div>
              <p className="text-sm font-bold text-red-700">
                Firebase connection error
              </p>

              <p className="text-xs text-red-500 mt-1">
                {error ?? `Sensor thresholds: ${sensorConfigurationError}`}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ==================================================
          SENSOR CARDS
      ================================================== */}

      <div className="grid grid-cols-2 gap-1.5 sm:gap-2 lg:gap-5">
        {sensors.map((sensor) => {
          const value = sensor.value;
          const styles = SENSOR_STATUS_PRESENTATION[sensor.status];
          const configuredRange = sensorConfiguration?.[sensor.key];

          const percentage =
            sensor.key === "batteryVoltage"
              ? batteryPercent
              : sensor.key === "waterPercent"
                ? value
                : null;

          return (
            <div
              key={sensor.key}
              className={cn(
                "relative overflow-hidden p-3 sm:p-4 lg:p-5 rounded-xl sm:rounded-3xl",
                "border shadow-xl shadow-slate-200/50",
                "transition-all duration-300",
                "hover:-translate-y-1 hover:shadow-2xl",
                "min-w-0",
                styles.card,
              )}
            >
              {/* DECORATIVE ICON */}

              <div
                className={cn(
                  "absolute -right-5 -top-5 opacity-[0.06]",
                  styles.iconColor,
                )}
              >
                {sensor.icon}
              </div>

              <div className="relative z-10">
                {/* TITLE */}

                <div className="flex items-start justify-between gap-2 mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "p-2 sm:p-2.5 rounded-lg sm:rounded-xl shrink-0",
                        styles.icon,
                      )}
                    >
                      {sensor.icon}
                    </div>

                    <div>
                      <h3 className="font-display font-bold text-slate-800 text-[10px] sm:text-xs leading-tight truncate">
                        {sensor.name}
                      </h3>

                      <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 truncate">
                        Firebase sensor
                      </p>
                    </div>
                  </div>

                  <span
                    className={cn(
                      "px-2 py-0.5 rounded-full text-[8px] sm:text-[9px] font-bold uppercase border shrink-0",
                      styles.badge,
                    )}
                  >
                    {styles.label}
                  </span>
                </div>

                {/* VALUE */}

                <div className="flex items-baseline gap-2">
                  <span
                    className={cn(
                      "text-xl sm:text-lg font-display font-bold tracking-tighter leading-none",
                      styles.value,
                    )}
                  >
                    {sensor.displayValue ?? formatValue(sensor.key, value)}
                  </span>

                  {sensor.key !== "batteryVoltage" && (
                    <span className="text-slate-500 font-bold text-[10px] sm:text-xs">
                      {sensor.unit}
                    </span>
                  )}
                </div>

                {/* BATTERY */}

                {sensor.key === "batteryVoltage" && (
                  <div className="mt-2">
                    <span className="text-sm font-semibold text-slate-500">
                      {sensor.secondary}
                    </span>
                  </div>
                )}

                {/* PROGRESS */}

                {percentage !== null && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        {sensor.key === "batteryVoltage"
                          ? "Battery Level"
                          : "Water Level"}
                      </span>

                      <span className="text-xs font-bold text-slate-600">
                        {percentage.toFixed(0)}%
                      </span>
                    </div>

                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-700",
                          styles.progress,
                        )}
                        style={{
                          width: `${Math.max(0, Math.min(100, percentage))}%`,
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* NORMAL INFO */}

                {percentage === null && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Current Reading
                      </span>

                      <span
                        className={cn(
                          "text-xs font-bold",
                          styles.labelText,
                        )}
                      >
                        {styles.label}
                      </span>
                    </div>
                  </div>
                )}

                {/* CONFIGURED RANGE */}

                {configuredRange && sensor.key !== "batteryVoltage" && (
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400 font-medium">
                        Configured range
                      </span>

                      <span className="text-xs font-bold text-slate-600">
                        {String(configuredRange.low ?? "—")}
                        {" – "}
                        {String(configuredRange.high ?? "—")}{" "}
                        {configuredRange.unit ?? ""}
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 gap-2">
                  <span className="text-xs text-slate-400 font-medium">
                    Live from Firebase
                  </span>

                  <span className="text-xs text-slate-400 font-medium">
                    Updates automatically
                  </span>
                </div>
              </div>

              <div
                className={cn(
                  "absolute bottom-0 left-0 right-0 h-1",
                  styles.dot,
                )}
              />
            </div>
          );
        })}
      </div>

      {/* ==================================================
          NO DATA
      ================================================== */}

      {sensors.every((sensor) => sensor.value === null) && (
        <div className="p-8 rounded-3xl bg-slate-50 border border-slate-200 text-center">
          <Activity size={32} className="mx-auto text-slate-400 mb-3" />

          <h3 className="font-bold text-slate-700">
            {isOffline ? "Sensor device is offline" : "Waiting for sensor data"}
          </h3>

          <p className="text-[10px] sm:text-xs text-slate-500 mt-1">
            {isOffline
              ? "The device has not updated its Firebase heartbeat within five minutes."
              : "Firebase is connected, but no sensor readings are currently available."}
          </p>
        </div>
      )}

      {/* ==================================================
          CONFIGURATION MODAL
      ================================================== */}

      {configurationOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => setConfigurationOpen(false)}
          />

          <div className="relative w-[calc(100vw-1.5rem)] sm:w-[calc(100vw-2rem)] max-w-[390px] sm:max-w-2xl lg:max-w-3xl max-h-[82vh] sm:max-h-[84vh] overflow-hidden bg-white rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col">
            {/* HEADER */}

            <div className="shrink-0 z-10 bg-white border-b border-slate-100 px-4 py-4 sm:px-5 sm:py-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                  Sensor Configuration
                </h2>

                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Set the acceptable low and high range for each sensor.
                </p>
              </div>

              <button
                onClick={() => setConfigurationOpen(false)}
                className="p-1.5 sm:p-2 rounded-lg hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="min-h-0 overflow-y-auto p-4 sm:p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {Object.entries(limits).map(([key, config]) => (
                  <div
                    key={key}
                    className="border border-slate-200 rounded-xl sm:rounded-2xl p-4 sm:p-5"
                  >
                    <div className="mb-4">
                      <h3 className="font-bold text-slate-800">
                        {key === "ph"
                          ? "pH Level"
                          : key === "dissolvedOxygen"
                            ? "Dissolved Oxygen"
                            : key === "waterTemp"
                              ? "Water Temperature"
                              : key === "waterPercent"
                                ? "Water Level"
                                : key === "currentDraw"
                                  ? "Current Draw"
                                  : key === "waterLevel"
                                    ? "Water Level Distance"
                                    : key === "distance"
                                      ? "Ultrasonic Distance"
                                      : key === "ammonia"
                                        ? "Ammonia"
                                        : key}
                      </h3>

                      <p className="text-xs text-slate-400">
                        Unit: {config.unit}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">
                          Low
                        </label>

                        <input
                          type="number"
                          step="0.01"
                          value={config.low}
                          onChange={(e) =>
                            setLimits((prev) => ({
                              ...prev,

                              [key]: {
                                ...prev[key],
                                low: Number(e.target.value),
                              },
                            }))
                          }
                          className="mt-1.5 w-full px-3 py-2.5 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">
                          High
                        </label>

                        <input
                          type="number"
                          step="0.01"
                          value={config.high}
                          onChange={(e) =>
                            setLimits((prev) => ({
                              ...prev,

                              [key]: {
                                ...prev[key],
                                high: Number(e.target.value),
                              },
                            }))
                          }
                          className="mt-1.5 w-full px-3 py-2.5 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* BATTERY NOTE */}

              <div className="mt-5 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex gap-3">
                  <Battery size={20} className="text-slate-400 shrink-0" />

                  <div>
                    <p className="text-sm font-bold text-slate-700">
                      Battery excluded
                    </p>

                    <p className="text-xs text-slate-500 mt-1">
                      Battery voltage is displayed separately and does not use
                      this sensor configuration.
                    </p>
                  </div>
                </div>
              </div>

              {configurationMessage && (
                <div className="mt-5 flex items-center gap-2 p-4 rounded-xl bg-emerald-50 text-emerald-700">
                  <CheckCircle2 size={18} />

                  <span className="text-sm font-semibold">
                    {configurationMessage}
                  </span>
                </div>
              )}

              <div className="flex justify-between gap-3 mt-6">
                <button
                  onClick={resetConfiguration}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg border border-slate-200 text-slate-600 font-bold text-xs sm:text-sm hover:bg-slate-50"
                >
                  <RotateCcw size={17} />
                  Reset Defaults
                </button>

                <button
                  onClick={saveConfiguration}
                  disabled={savingConfiguration}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-emerald-600 text-white font-bold text-xs sm:text-sm hover:bg-emerald-700 disabled:opacity-50"
                >
                  <Save size={17} />

                  {savingConfiguration ? "Saving..." : "Save Configuration"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================
          CALIBRATION MODAL
      ================================================== */}

      {calibrationOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => setCalibrationOpen(false)}
          />

          <div className="relative w-[calc(100vw-1.5rem)] sm:w-[calc(100vw-2rem)] max-w-[390px] sm:max-w-2xl lg:max-w-3xl max-h-[82vh] sm:max-h-[84vh] overflow-hidden bg-white rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col">
            {/* HEADER */}

            <div className="shrink-0 z-10 bg-white border-b border-slate-100 px-4 py-4 sm:px-5 sm:py-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                  Sensor Calibration
                </h2>

                <p className="text-sm text-slate-500 mt-1">
                  Calibrate pH, water level, and feeder open duration.
                </p>
              </div>

              <button
                onClick={() => setCalibrationOpen(false)}
                className="p-1.5 sm:p-2 rounded-lg hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            {/* TABS */}

            <div className="shrink-0 p-4 sm:p-5 pb-0">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-1 bg-slate-100 rounded-xl">
                <button
                  onClick={() => setCalibrationTab("ph")}
                  className={cn(
                    "py-3 rounded-lg font-bold text-sm transition",

                    calibrationTab === "ph"
                      ? "bg-white text-emerald-700 shadow-sm"
                      : "text-slate-500",
                  )}
                >
                  3-Point pH Calibration
                </button>

                <button
                  onClick={() => setCalibrationTab("ultrasonic")}
                  className={cn(
                    "py-3 rounded-lg font-bold text-sm transition",

                    calibrationTab === "ultrasonic"
                      ? "bg-white text-blue-700 shadow-sm"
                      : "text-slate-500",
                  )}
                >
                  Water Level Calibration
                </button>

                <button
                  onClick={() => {
                    setFeederCalibrationMessage("");
                    setFeederCalibrationSeconds(feederOpenSeconds.toFixed(1));
                    setCalibrationTab("feeder");
                  }}
                  className={cn(
                    "py-3 rounded-lg font-bold text-sm transition",

                    calibrationTab === "feeder"
                      ? "bg-white text-amber-700 shadow-sm"
                      : "text-slate-500",
                  )}
                >
                  Feeder Calibration
                </button>
              </div>
            </div>

            {/* ==================================================
                3-POINT PH CALIBRATION
            ================================================== */}

            {calibrationTab === "ph" && (
              <div className="min-h-0 overflow-y-auto p-4 sm:p-5">
                {/* LIVE ESP32 */}

                <div className="rounded-xl sm:rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5 mb-4 sm:mb-6">
                  <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
                    <div>
                      <h3 className="text-base font-bold text-slate-800">
                        Live ESP32 Reading
                      </h3>

                      <p className="text-xs text-slate-500 mt-1">
                        Current values being received from the ESP32.
                      </p>
                    </div>

                    <div
                      className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-full border",

                        phVoltage !== null && liveData.ph !== null
                          ? "bg-emerald-50 border-emerald-100"
                          : "bg-amber-50 border-amber-100",
                      )}
                    >
                      <span
                        className={cn(
                          "relative flex h-2.5 w-2.5 rounded-full",

                          phVoltage !== null && liveData.ph !== null
                            ? "bg-emerald-500"
                            : "bg-amber-500",
                        )}
                      />

                      <span
                        className={cn(
                          "text-xs font-bold",

                          phVoltage !== null && liveData.ph !== null
                            ? "text-emerald-700"
                            : "text-amber-700",
                        )}
                      >
                        {phVoltage !== null && liveData.ph !== null
                          ? "ESP32 Connected"
                          : "Waiting for ESP32"}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* PH */}

                    <div className="bg-white rounded-2xl border border-slate-200 p-5 text-center">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        pH
                      </p>

                      <p className="text-4xl font-display font-bold text-slate-900 mt-2">
                        {liveData.ph === null ? "--" : liveData.ph.toFixed(2)}
                      </p>

                      <p className="text-xs text-slate-400 mt-2">
                        Current pH reading
                      </p>
                    </div>

                    {/* VOLTAGE */}

                    <div className="bg-white rounded-2xl border border-slate-200 p-5 text-center">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Probe Voltage
                      </p>

                      <div className="flex items-baseline justify-center gap-1 mt-2">
                        <p className="text-4xl font-display font-bold text-slate-900">
                          {phVoltage === null ? "--" : phVoltage.toFixed(2)}
                        </p>

                        {phVoltage !== null && (
                          <span className="text-lg font-bold text-slate-500">
                            V
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-400 mt-2">
                        Raw ESP32 pH output
                      </p>
                    </div>
                  </div>
                </div>

                {/* INSTRUCTIONS */}

                <div className="p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-emerald-50 border border-emerald-100 mb-4 sm:mb-6">
                  <div className="flex gap-3">
                    <Droplets size={24} className="text-emerald-600 shrink-0" />

                    <div>
                      <h3 className="font-bold text-emerald-800">
                        Three-Point pH Calibration
                      </h3>

                      <p className="text-sm text-emerald-700 mt-1">
                        Calibrate the probe using pH 4.00, pH 7.00, and pH 10.01
                        buffer solutions. Wait for the voltage to stabilize
                        before saving each point.
                      </p>

                      <p className="text-xs text-emerald-600 mt-2 font-semibold">
                        Recommended order: pH 4.00 → pH 7.00 → pH 10.01
                      </p>
                    </div>
                  </div>
                </div>

                {/* CURRENT SAVED POINTS */}

                <div className="grid grid-cols-3 gap-3 mb-6">
                  <div className="rounded-2xl bg-blue-50 border border-blue-100 p-4 text-center">
                    <p className="text-xs font-bold text-blue-500 uppercase">
                      pH 4.00
                    </p>

                    <p className="text-xl font-bold text-blue-800 mt-1">
                      {phCalibration.ph4Voltage === null
                        ? "--"
                        : `${phCalibration.ph4Voltage.toFixed(3)} V`}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-4 text-center">
                    <p className="text-xs font-bold text-emerald-500 uppercase">
                      pH 7.00
                    </p>

                    <p className="text-xl font-bold text-emerald-800 mt-1">
                      {phCalibration.ph7Voltage === null
                        ? "--"
                        : `${phCalibration.ph7Voltage.toFixed(3)} V`}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-purple-50 border border-purple-100 p-4 text-center">
                    <p className="text-xs font-bold text-purple-500 uppercase">
                      pH 10.01
                    </p>

                    <p className="text-xl font-bold text-purple-800 mt-1">
                      {phCalibration.ph10Voltage === null
                        ? "--"
                        : `${phCalibration.ph10Voltage.toFixed(3)} V`}
                    </p>
                  </div>
                </div>

                {/* ==================================================
                    STEP 1 — PH 4
                ================================================== */}

                <div className="border border-slate-200 rounded-2xl p-5 mb-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-700 shrink-0">
                        1
                      </div>

                      <div>
                        <h3 className="font-bold text-slate-800">
                          Step 1 — pH 4.00 Buffer
                        </h3>

                        <p className="text-xs text-slate-500 mt-1">
                          Place probe in pH 4.00 solution and wait for
                          stabilization.
                        </p>
                      </div>
                    </div>

                    {phCalibration.ph4Voltage !== null && (
                      <CheckCircle2
                        size={22}
                        className="text-blue-500 shrink-0"
                      />
                    )}
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-4">
                    <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
                      <p className="text-xs font-bold text-slate-400 uppercase">
                        Current Voltage
                      </p>

                      <p className="text-2xl font-bold text-slate-900 mt-1">
                        {phVoltage === null
                          ? "--"
                          : `${phVoltage.toFixed(3)} V`}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
                      <p className="text-xs font-bold text-slate-400 uppercase">
                        Target
                      </p>

                      <p className="text-2xl font-bold text-blue-600 mt-1">
                        pH 4.00
                      </p>
                    </div>
                  </div>

                  {phCalibration.ph4Voltage !== null && (
                    <div className="mt-3 p-3 rounded-xl bg-blue-50 border border-blue-100">
                      <p className="text-xs text-blue-700 font-semibold">
                        Saved calibration voltage
                      </p>

                      <p className="text-sm font-bold text-blue-800 mt-1">
                        {phCalibration.ph4Voltage.toFixed(3)} V
                      </p>
                    </div>
                  )}

                  <button
                    onClick={savePH4Calibration}
                    disabled={savingPH4 || phVoltage === null}
                    className="mt-5 w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    <Save size={17} />

                    {savingPH4 ? "Saving..." : "Save pH 4.00 Calibration"}
                  </button>
                </div>

                {/* ==================================================
                    STEP 2 — PH 7
                ================================================== */}

                <div className="border border-slate-200 rounded-2xl p-5 mb-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center font-bold text-emerald-700 shrink-0">
                        2
                      </div>

                      <div>
                        <h3 className="font-bold text-slate-800">
                          Step 2 — pH 7.00 Buffer
                        </h3>

                        <p className="text-xs text-slate-500 mt-1">
                          Rinse the probe, place it in pH 7.00 solution, and
                          wait for stabilization.
                        </p>
                      </div>
                    </div>

                    {phCalibration.ph7Voltage !== null && (
                      <CheckCircle2
                        size={22}
                        className="text-emerald-500 shrink-0"
                      />
                    )}
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-4">
                    <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
                      <p className="text-xs font-bold text-slate-400 uppercase">
                        Current Voltage
                      </p>

                      <p className="text-2xl font-bold text-slate-900 mt-1">
                        {phVoltage === null
                          ? "--"
                          : `${phVoltage.toFixed(3)} V`}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
                      <p className="text-xs font-bold text-slate-400 uppercase">
                        Target
                      </p>

                      <p className="text-2xl font-bold text-emerald-600 mt-1">
                        pH 7.00
                      </p>
                    </div>
                  </div>

                  {phCalibration.ph7Voltage !== null && (
                    <div className="mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                      <p className="text-xs text-emerald-700 font-semibold">
                        Saved calibration voltage
                      </p>

                      <p className="text-sm font-bold text-emerald-800 mt-1">
                        {phCalibration.ph7Voltage.toFixed(3)} V
                      </p>
                    </div>
                  )}

                  <button
                    onClick={savePH7Calibration}
                    disabled={savingPH7 || phVoltage === null}
                    className="mt-5 w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    <Save size={17} />

                    {savingPH7 ? "Saving..." : "Save pH 7.00 Calibration"}
                  </button>
                </div>

                {/* ==================================================
                    STEP 3 — PH 10.01
                ================================================== */}

                <div className="border border-slate-200 rounded-2xl p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center font-bold text-purple-700 shrink-0">
                        3
                      </div>

                      <div>
                        <h3 className="font-bold text-slate-800">
                          Step 3 — pH 10.01 Buffer
                        </h3>

                        <p className="text-xs text-slate-500 mt-1">
                          Rinse the probe, place it in pH 10.01 solution, and
                          wait for stabilization.
                        </p>
                      </div>
                    </div>

                    {phCalibration.ph10Voltage !== null && (
                      <CheckCircle2
                        size={22}
                        className="text-purple-500 shrink-0"
                      />
                    )}
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-4">
                    <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
                      <p className="text-xs font-bold text-slate-400 uppercase">
                        Current Voltage
                      </p>

                      <p className="text-2xl font-bold text-slate-900 mt-1">
                        {phVoltage === null
                          ? "--"
                          : `${phVoltage.toFixed(3)} V`}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
                      <p className="text-xs font-bold text-slate-400 uppercase">
                        Target
                      </p>

                      <p className="text-2xl font-bold text-purple-600 mt-1">
                        pH 10.01
                      </p>
                    </div>
                  </div>

                  {phCalibration.ph10Voltage !== null && (
                    <div className="mt-3 p-3 rounded-xl bg-purple-50 border border-purple-100">
                      <p className="text-xs text-purple-700 font-semibold">
                        Saved calibration voltage
                      </p>

                      <p className="text-sm font-bold text-purple-800 mt-1">
                        {phCalibration.ph10Voltage.toFixed(3)} V
                      </p>
                    </div>
                  )}

                  <button
                    onClick={savePH10Calibration}
                    disabled={savingPH10 || phVoltage === null}
                    className="mt-5 w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-purple-600 text-white font-bold text-sm hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    <Save size={17} />

                    {savingPH10 ? "Saving..." : "Save pH 10.01 Calibration"}
                  </button>
                </div>

                {/* ==================================================
                    CALIBRATION STATUS
                ================================================== */}

                <div className="mt-5 p-5 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Calibration Status
                      </p>

                      <p className="text-sm font-bold text-slate-700 mt-1">
                        {phCalibration.ph4Voltage !== null &&
                        phCalibration.ph7Voltage !== null &&
                        phCalibration.ph10Voltage !== null
                          ? "3-Point Calibrated"
                          : "Incomplete Calibration"}
                      </p>
                    </div>

                    {phCalibration.ph4Voltage !== null &&
                    phCalibration.ph7Voltage !== null &&
                    phCalibration.ph10Voltage !== null ? (
                      <CheckCircle2 size={24} className="text-emerald-500" />
                    ) : (
                      <AlertTriangle size={24} className="text-amber-500" />
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-4 mt-4">
                    <div>
                      <p className="text-xs text-slate-400">pH 4.00</p>

                      <p className="font-bold text-slate-800 mt-1">
                        {phCalibration.ph4Voltage === null
                          ? "--"
                          : `${phCalibration.ph4Voltage.toFixed(3)} V`}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-400">pH 7.00</p>

                      <p className="font-bold text-slate-800 mt-1">
                        {phCalibration.ph7Voltage === null
                          ? "--"
                          : `${phCalibration.ph7Voltage.toFixed(3)} V`}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-400">pH 10.01</p>

                      <p className="font-bold text-slate-800 mt-1">
                        {phCalibration.ph10Voltage === null
                          ? "--"
                          : `${phCalibration.ph10Voltage.toFixed(3)} V`}
                      </p>
                    </div>
                  </div>

                  {/* SEGMENTS */}

                  {phCalibration.ph4Voltage !== null &&
                    phCalibration.ph7Voltage !== null &&
                    phCalibration.ph10Voltage !== null && (
                      <div className="mt-4 pt-4 border-t border-slate-200">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                          Calibration Segments
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="p-4 rounded-xl bg-white border border-slate-200">
                            <p className="text-xs text-slate-400">Segment 1</p>

                            <p className="font-bold text-slate-800 mt-1">
                              pH 4.00 → 7.00
                            </p>

                            <p className="text-xs text-slate-500 mt-1">
                              {phCalibration.ph4Voltage.toFixed(3)} V →{" "}
                              {phCalibration.ph7Voltage.toFixed(3)} V
                            </p>
                          </div>

                          <div className="p-4 rounded-xl bg-white border border-slate-200">
                            <p className="text-xs text-slate-400">Segment 2</p>

                            <p className="font-bold text-slate-800 mt-1">
                              pH 7.00 → 10.01
                            </p>

                            <p className="text-xs text-slate-500 mt-1">
                              {phCalibration.ph7Voltage.toFixed(3)} V →{" "}
                              {phCalibration.ph10Voltage.toFixed(3)} V
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                          <p className="text-xs text-emerald-600 font-semibold">
                            3-point calibration ready
                          </p>

                          <p className="text-sm text-emerald-800 mt-1">
                            The ESP32 can interpolate between pH 4.00–7.00 and
                            pH 7.00–10.01 for improved accuracy.
                          </p>
                        </div>
                      </div>
                    )}
                </div>

                {phMessage && (
                  <div className="mt-5 p-4 rounded-xl bg-emerald-50 text-emerald-700 text-sm font-semibold flex items-center gap-2">
                    <CheckCircle2 size={18} />

                    {phMessage}
                  </div>
                )}

                {phCalibration.calibratedAt && (
                  <p className="text-xs text-slate-400 mt-4">
                    Last calibrated:{" "}
                    {new Date(phCalibration.calibratedAt).toLocaleString()}
                  </p>
                )}
              </div>
            )}

            {/* ==================================================
                ULTRASONIC CALIBRATION
            ================================================== */}

            {calibrationTab === "ultrasonic" && (
              <div className="min-h-0 overflow-y-auto p-4 sm:p-5">
                <div className="p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-blue-50 border border-blue-100 mb-6">
                  <div className="flex gap-3">
                    <Waves size={24} className="text-blue-600 shrink-0" />

                    <div>
                      <h3 className="font-bold text-blue-800">
                        Water-Level Calibration
                      </h3>

                      <p className="text-sm text-blue-700 mt-1">
                        Use this when the ultrasonic sensor is moved or the tank
                        dimensions change.
                      </p>
                    </div>
                  </div>
                </div>

                {/* CURRENT READING */}

                <div className="mb-6 p-5 rounded-2xl bg-slate-50 border border-slate-200">
                  <h3 className="font-bold text-slate-700">
                    Current ESP32 Reading
                  </h3>

                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <p className="text-xs text-slate-400">Distance</p>

                      <p className="text-2xl font-bold text-slate-800 mt-1">
                        {liveData.distance === null
                          ? "--"
                          : `${liveData.distance.toFixed(1)} cm`}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-400">Water Level</p>

                      <p className="text-2xl font-bold text-slate-800 mt-1">
                        {liveData.waterLevel === null
                          ? "--"
                          : `${liveData.waterLevel.toFixed(1)} cm`}
                      </p>
                    </div>
                  </div>
                </div>

                {/* CALIBRATION VALUES */}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">
                      Tank Depth
                    </label>

                    <input
                      type="number"
                      step="0.1"
                      value={tankDepthInput}
                      onChange={(e) => setTankDepthInput(e.target.value)}
                      className="mt-2 w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    <p className="text-xs text-slate-400 mt-1">cm</p>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">
                      Empty Tank Distance
                    </label>

                    <input
                      type="number"
                      step="0.1"
                      value={emptyDistanceInput}
                      onChange={(e) => setEmptyDistanceInput(e.target.value)}
                      placeholder="Example: 60"
                      className="mt-2 w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    <p className="text-xs text-slate-400 mt-1">
                      cm from sensor
                    </p>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">
                      Full Tank Distance
                    </label>

                    <input
                      type="number"
                      step="0.1"
                      value={fullDistanceInput}
                      onChange={(e) => setFullDistanceInput(e.target.value)}
                      placeholder="Example: 10"
                      className="mt-2 w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    <p className="text-xs text-slate-400 mt-1">
                      cm from sensor
                    </p>
                  </div>
                </div>

                {/* EXPLANATION */}

                <div className="mt-5 p-4 rounded-2xl bg-blue-50 border border-blue-100">
                  <p className="text-sm text-blue-700">
                    <strong>Empty tank:</strong> sensor-to-water distance is
                    largest.
                    <br />
                    <strong>Full tank:</strong> sensor-to-water distance is
                    smallest.
                  </p>
                </div>

                {ultrasonicCalibration.calibratedAt && (
                  <p className="text-xs text-slate-400 mt-4">
                    Last calibrated:{" "}
                    {new Date(
                      ultrasonicCalibration.calibratedAt,
                    ).toLocaleString()}
                  </p>
                )}

                {ultrasonicMessage && (
                  <div className="mt-5 p-4 rounded-xl bg-blue-50 text-blue-700 text-sm font-semibold flex gap-2">
                    <CheckCircle2 size={18} />

                    {ultrasonicMessage}
                  </div>
                )}

                <button
                  onClick={saveUltrasonicCalibration}
                  disabled={savingUltrasonic}
                  className="mt-6 w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 disabled:opacity-50"
                >
                  <Save size={18} />

                  {savingUltrasonic
                    ? "Saving Calibration..."
                    : "Save Water-Level Calibration"}
                </button>
              </div>
            )}

            {/* ==================================================
                FEEDER CALIBRATION
            ================================================== */}

            {calibrationTab === "feeder" && (
              <div className="min-h-0 overflow-y-auto p-4 sm:p-5">
                <div className="p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-amber-50 border border-amber-100 mb-6">
                  <div className="flex gap-3">
                    <SlidersHorizontal
                      size={24}
                      className="text-amber-600 shrink-0"
                    />

                    <div>
                      <h3 className="font-bold text-amber-800">
                        Feeder Duration Calibration
                      </h3>

                      <p className="text-sm text-amber-700 mt-1">
                        Set how long the feeder servo remains open before
                        automatically returning to the closed position.
                      </p>

                      <p className="text-xs text-amber-600 mt-2 font-semibold">
                        Servo position: 60° open → wait → 100° closed
                      </p>
                    </div>
                  </div>
                </div>

                {/* CURRENT FIREBASE SETTING */}

                <div className="mb-6 p-5 rounded-2xl bg-slate-50 border border-slate-200">
                  <h3 className="font-bold text-slate-700">
                    Current Firebase Setting
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                    <div className="rounded-xl bg-white border border-slate-200 p-5 text-center">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Open Duration
                      </p>

                      <p className="text-4xl font-display font-bold text-amber-600 mt-2">
                        {feederOpenSeconds.toFixed(1)}
                      </p>

                      <p className="text-sm font-bold text-slate-500 mt-1">
                        seconds
                      </p>
                    </div>
                  </div>
                </div>

                {/* CALIBRATION INPUT */}

                <div className="border border-slate-200 rounded-2xl p-5">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center font-bold text-amber-700 shrink-0">
                      1
                    </div>

                    <div>
                      <h3 className="font-bold text-slate-800">
                        Set Feeder Open Time
                      </h3>

                      <p className="text-xs text-slate-500 mt-1">
                        Adjust the duration based on how much feed is released
                        during one feeding cycle.
                      </p>
                    </div>
                  </div>

                  <div className="mt-5">
                    <label className="text-xs font-bold text-slate-500 uppercase">
                      Open Duration
                    </label>

                    <div className="relative mt-2">
                      <input
                        type="number"
                        min="0.1"
                        max="10"
                        step="0.1"
                        value={feederCalibrationSeconds}
                        onChange={(e) => {
                          setFeederCalibrationSeconds(e.target.value);
                          setFeederCalibrationMessage("");
                        }}
                        className="w-full px-4 pr-20 py-4 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-amber-500 text-lg font-bold"
                      />

                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                        seconds
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 mt-2">
                      Allowed range: 0.1–10 seconds.
                    </p>
                  </div>

                  <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-amber-50 border border-amber-100">
                      <p className="text-xs text-amber-600 font-semibold">
                        Calibration Result
                      </p>

                      <p className="text-2xl font-bold text-amber-800 mt-1">
                        {Number.isFinite(Number(feederCalibrationSeconds))
                          ? Number(feederCalibrationSeconds).toFixed(1)
                          : "--"}{" "}
                        seconds
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                      <p className="text-xs text-slate-400 font-semibold">
                        Feeding Sequence
                      </p>

                      <p className="text-sm font-bold text-slate-700 mt-1">
                        100° closed → 60° open → wait → 100° closed
                      </p>
                    </div>
                  </div>

                  {feederCalibrationMessage && (
                    <div
                      className={cn(
                        "mt-5 p-4 rounded-xl text-sm font-semibold flex items-center gap-2",
                        feederCalibrationMessage.includes("Failed") ||
                          feederCalibrationMessage.includes("Please")
                          ? "bg-red-50 text-red-700"
                          : "bg-emerald-50 text-emerald-700",
                      )}
                    >
                      {feederCalibrationMessage.includes("Failed") ||
                      feederCalibrationMessage.includes("Please") ? (
                        <AlertTriangle size={18} />
                      ) : (
                        <CheckCircle2 size={18} />
                      )}

                      {feederCalibrationMessage}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
                    <button
                      onClick={resetFeederCalibration}
                      className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50"
                    >
                      <RotateCcw size={17} />
                      Reset to 0.5 Seconds
                    </button>

                    <button
                      onClick={saveFeederCalibration}
                      disabled={savingFeederCalibration}
                      className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-amber-500 text-white font-bold text-sm hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Save size={17} />
                      {savingFeederCalibration
                        ? "Saving..."
                        : "Save Feeder Calibration"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
