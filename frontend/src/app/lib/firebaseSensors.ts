import { get, ref } from "firebase/database";
import { db } from "../../firebase";

export interface CurrentSensors {
  ph?: number;
  ammonia?: number;
  waterTemp?: number;
  waterPercent?: number;
  batteryVoltage?: number;
  currentDraw?: number;
  distance?: number;
  waterLevel?: number;
}

export interface SensorLimit {
  low: number;
  high: number;
}

export interface SensorConfiguration {
  ph?: SensorLimit;
  ammonia?: SensorLimit;
  waterTemp?: SensorLimit;
  waterPercent?: SensorLimit;
}

export async function getCurrentSensors(): Promise<CurrentSensors> {
  const snapshot = await get(ref(db, "current"));

  if (!snapshot.exists()) {
    return {};
  }

  return snapshot.val();
}

export async function getSensorConfiguration(): Promise<SensorConfiguration> {
  const snapshot = await get(ref(db, "configuration/sensors"));

  if (!snapshot.exists()) {
    return {};
  }

  return snapshot.val();
}
