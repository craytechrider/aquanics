import { useEffect, useState } from "react";
import { onValue, ref } from "firebase/database";
import { db } from "../firebase";

/*
==================================================
AQUAPONICS DATA
==================================================
*/

export interface AquaponicsData {
  ph: number | null;
  phVoltage: number | null;
  dissolvedOxygen: number | null;
  ammonia: number | null;
  waterTemp: number | null;
  waterPercent: number | null;
  batteryVoltage: number | null;
  currentDraw: number | null;
  distance: number | null;
  waterLevel: number | null;
}

interface SensorHistory {
  [date: string]: {
    [time: string]: number;
  };
}

const DEVICE_OFFLINE_AFTER_MS = 5 * 60 * 1000;

function parseDeviceTimestamp(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value < 1_000_000_000_000 ? value * 1000 : value;
  }

  if (typeof value !== "string" || value.trim() === "") {
    return null;
  }

  const formatted = value.match(
    /^(\d{4}-\d{2}-\d{2})[ T](\d{2})[:-](\d{2})[:-](\d{2})$/,
  );
  if (formatted) {
    const [, date, hours, minutes, seconds] = formatted;
    const timestamp = Date.parse(
      `${date}T${hours}:${minutes}:${seconds}+08:00`,
    );
    return Number.isFinite(timestamp) ? timestamp : null;
  }

  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : null;
}

function getLastUpdatedTimestamp(current: Record<string, unknown>): number | null {
  const candidates = [
    parseDeviceTimestamp(current.lastUpdated),
    parseDeviceTimestamp(current.lastUpdate),
    parseDeviceTimestamp(
      current.date && current.time
        ? `${String(current.date)} ${String(current.time)}`
        : null,
    ),
  ].filter((value): value is number => value !== null);

  return candidates.length > 0 ? Math.max(...candidates) : null;
}

/*
==================================================
GET LATEST HISTORY VALUE
==================================================
*/

function getLatestValue(sensor: SensorHistory | undefined): number | null {
  if (!sensor) return null;

  const dates = Object.keys(sensor).sort();
  const latestDate = dates[dates.length - 1];
  if (!latestDate) return null;

  const readings = sensor[latestDate];
  if (!readings) return null;

  const times = Object.keys(readings).sort();
  const latestTime = times[times.length - 1];
  if (!latestTime) return null;

  const value = readings[latestTime];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function getNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }

  return null;
}

const EMPTY_DATA: AquaponicsData = {
  ph: null,
  phVoltage: null,
  dissolvedOxygen: null,
  ammonia: null,
  waterTemp: null,
  waterPercent: null,
  batteryVoltage: null,
  currentDraw: null,
  distance: null,
  waterLevel: null,
};

/*
==================================================
HOOK
==================================================
*/

export function useAquaponicsData() {
  const [data, setData] = useState<AquaponicsData>(EMPTY_DATA);
  const [liveData, setLiveData] = useState<AquaponicsData>(EMPTY_DATA);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);
  const [clock, setClock] = useState(() => Date.now());

  useEffect(() => {
    const sensorsRef = ref(db, "sensors");
    const currentRef = ref(db, "current");

    let sensorsData: any = null;
    let currentData: any = null;
    let sensorsReceived = false;
    let currentReceived = false;
    let settled = false;

    /*
      If Firebase has not delivered either initial snapshot after 10 seconds,
      stop blocking the whole dashboard. The listeners remain active, so data
      can still appear later if the connection recovers.
    */
    const loadingTimeout = window.setTimeout(() => {
      if (!settled) {
        settled = true;
        setError(
          "Sensor data is taking too long to load. Check your internet connection and Firebase Realtime Database rules."
        );
        setLoading(false);
      }
    }, 10000);

    const finishInitialLoadIfReady = () => {
      if (sensorsReceived && currentReceived && !settled) {
        settled = true;
        window.clearTimeout(loadingTimeout);
        setLoading(false);
      }
    };

    const updateData = () => {
      try {
        const sensors = sensorsData || {};
        const current: Record<string, unknown> = currentData || {};
        setLastUpdatedAt(getLastUpdatedTimestamp(current));

        const currentReadings: AquaponicsData = {
          ph: getNumber(current.ph),
          phVoltage: getNumber(current.phVoltage),
          dissolvedOxygen: getNumber(current.dissolvedOxygen),
          ammonia: getNumber(current.ammonia),
          waterTemp: getNumber(current.waterTemp),
          waterPercent: getNumber(current.waterPercent),
          batteryVoltage: getNumber(current.batteryVoltage),
          currentDraw: getNumber(current.currentDraw),
          distance: getNumber(current.distance),
          waterLevel: getNumber(current.waterLevel),
        };
        setLiveData(currentReadings);

        const newData: AquaponicsData = {
          ph: currentReadings.ph ?? getLatestValue(sensors.ph),
          phVoltage:
            currentReadings.phVoltage ?? getLatestValue(sensors.phVoltage),
          waterTemp:
            currentReadings.waterTemp ?? getLatestValue(sensors.waterTemp),
          waterPercent:
            currentReadings.waterPercent ?? getLatestValue(sensors.waterPercent),
          waterLevel:
            currentReadings.waterLevel ?? getLatestValue(sensors.waterLevel),
          distance:
            currentReadings.distance ?? getLatestValue(sensors.distance),
          batteryVoltage:
            currentReadings.batteryVoltage ??
            getLatestValue(sensors.batteryVoltage),
          currentDraw:
            currentReadings.currentDraw ?? getLatestValue(sensors.currentDraw),
          dissolvedOxygen:
            currentReadings.dissolvedOxygen ??
            getLatestValue(sensors.dissolvedOxygen),
          ammonia:
            currentReadings.ammonia ?? getLatestValue(sensors.ammonia),
        };

        setData(newData);
        setError(null);
      } catch (err) {
        console.error("Error processing Firebase data:", err);
        setError("Unable to process sensor data.");
      }
    };

    const unsubscribeSensors = onValue(
      sensorsRef,
      (snapshot) => {
        sensorsReceived = true;
        sensorsData = snapshot.val();
        updateData();
        finishInitialLoadIfReady();
      },
      (firebaseError) => {
        console.error("Firebase sensors error:", firebaseError);
        setError(`Sensors: ${firebaseError.message}`);
        sensorsReceived = true;
        finishInitialLoadIfReady();
        if (!settled) {
          settled = true;
          window.clearTimeout(loadingTimeout);
          setLoading(false);
        }
      }
    );

    const unsubscribeCurrent = onValue(
      currentRef,
      (snapshot) => {
        currentReceived = true;
        currentData = snapshot.val();
        updateData();
        finishInitialLoadIfReady();
      },
      (firebaseError) => {
        console.error("Firebase current error:", firebaseError);
        setError(`Current readings: ${firebaseError.message}`);
        currentReceived = true;
        finishInitialLoadIfReady();
        if (!settled) {
          settled = true;
          window.clearTimeout(loadingTimeout);
          setLoading(false);
        }
      }
    );

    return () => {
      window.clearTimeout(loadingTimeout);
      unsubscribeSensors();
      unsubscribeCurrent();
    };
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => setClock(Date.now()), 15000);
    return () => window.clearInterval(interval);
  }, []);

  const isOffline =
    lastUpdatedAt !== null && clock - lastUpdatedAt > DEVICE_OFFLINE_AFTER_MS;

  return { data, liveData, loading, error, isOffline, lastUpdatedAt };
}
