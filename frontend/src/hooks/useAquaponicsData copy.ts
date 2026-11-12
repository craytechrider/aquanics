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

/*
==================================================
SENSOR HISTORY
==================================================
*/

interface SensorHistory {
  [date: string]: {
    [time: string]: number;
  };
}

/*
==================================================
GET LATEST HISTORY VALUE
==================================================
*/

function getLatestValue(sensor: SensorHistory | undefined): number | null {
  if (!sensor) {
    return null;
  }

  const dates = Object.keys(sensor);

  if (dates.length === 0) {
    return null;
  }

  /*
  YYYY-MM-DD sorts correctly alphabetically.
  */

  dates.sort();

  const latestDate = dates[dates.length - 1];

  if (!latestDate) {
    return null;
  }

  const readings = sensor[latestDate];

  if (!readings) {
    return null;
  }

  const times = Object.keys(readings);

  if (times.length === 0) {
    return null;
  }

  /*
  HH-MM-SS sorts correctly alphabetically.
  */

  times.sort();

  const latestTime = times[times.length - 1];

  if (!latestTime) {
    return null;
  }

  const value = readings[latestTime];

  return typeof value === "number" ? value : null;
}

/*
==================================================
GET NUMBER
==================================================
*/

function getNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);

    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

/*
==================================================
HOOK
==================================================
*/

export function useAquaponicsData() {
  const [data, setData] = useState<AquaponicsData>({
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
  });

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  /*
  ==================================================
  FIREBASE LISTENERS
  ==================================================
  */

  useEffect(() => {
    /*
    Main sensor history/current paths.
    */

    const sensorsRef = ref(db, "sensors");

    const currentRef = ref(db, "current");

    let sensorsData: any = null;

    let currentData: any = null;

    /*
    ==================================================
    UPDATE LOCAL DATA
    ==================================================
    */

    const updateData = () => {
      try {
        const sensors = sensorsData || {};

        const current = currentData || {};

        const newData: AquaponicsData = {
          /*
          ============================================
          pH
          ============================================

          Current value first.

          If /current/ph doesn't exist,
          use the latest value from /sensors/ph.
          */

          ph: getNumber(current.ph) ?? getLatestValue(sensors.ph),

          /*
          ============================================
          pH VOLTAGE
          ============================================

          IMPORTANT FOR CALIBRATION

          This allows Sensors.tsx to receive:

          data.phVoltage

          Priority:

          /current/phVoltage

          then:

          latest /sensors/phVoltage
          */

          phVoltage:
            getNumber(current.phVoltage) ?? getLatestValue(sensors.phVoltage),

          /*
          ============================================
          WATER TEMPERATURE
          ============================================
          */

          waterTemp:
            getNumber(current.waterTemp) ?? getLatestValue(sensors.waterTemp),

          /*
          ============================================
          WATER PERCENT
          ============================================
          */

          waterPercent:
            getNumber(current.waterPercent) ??
            getLatestValue(sensors.waterPercent),

          /*
          ============================================
          WATER LEVEL
          ============================================
          */

          waterLevel:
            getNumber(current.waterLevel) ?? getLatestValue(sensors.waterLevel),

          /*
          ============================================
          DISTANCE
          ============================================
          */

          distance:
            getNumber(current.distance) ?? getLatestValue(sensors.distance),

          /*
          ============================================
          BATTERY
          ============================================
          */

          batteryVoltage:
            getNumber(current.batteryVoltage) ??
            getLatestValue(sensors.batteryVoltage),

          /*
          ============================================
          CURRENT DRAW
          ============================================
          */

          currentDraw:
            getNumber(current.currentDraw) ??
            getLatestValue(sensors.currentDraw),

          /*
          ============================================
          DISSOLVED OXYGEN
          ============================================
          
          Kept for future ESP32 implementation.
          */

          dissolvedOxygen:
            getNumber(current.dissolvedOxygen) ??
            getLatestValue(sensors.dissolvedOxygen),

          /*
          ============================================
          AMMONIA
          ============================================

          Kept for future ESP32 implementation.
          */

          ammonia:
            getNumber(current.ammonia) ?? getLatestValue(sensors.ammonia),
        };

        setData(newData);

        setError(null);

        setLoading(false);
      } catch (err) {
        console.error("Error processing Firebase data:", err);

        setError("Unable to process sensor data.");

        setLoading(false);
      }
    };

    /*
    ==================================================
    SENSOR HISTORY LISTENER
    ==================================================
    */

    const unsubscribeSensors = onValue(
      sensorsRef,
      (snapshot) => {
        sensorsData = snapshot.val();

        updateData();
      },
      (firebaseError) => {
        console.error("Firebase sensors error:", firebaseError);

        setError(firebaseError.message);

        setLoading(false);
      },
    );

    /*
    ==================================================
    CURRENT SENSOR LISTENER
    ==================================================
    */

    const unsubscribeCurrent = onValue(
      currentRef,
      (snapshot) => {
        currentData = snapshot.val();

        updateData();
      },
      (firebaseError) => {
        console.error("Firebase current error:", firebaseError);

        setError(firebaseError.message);

        setLoading(false);
      },
    );

    /*
    ==================================================
    CLEANUP
    ==================================================
    */

    return () => {
      unsubscribeSensors();

      unsubscribeCurrent();
    };
  }, []);

  /*
  ==================================================
  RETURN
  ==================================================
  */

  return {
    data,
    loading,
    error,
  };
}
