import { ref, push, set, onValue, remove } from "firebase/database";

import { db } from "../firebase";

// ===============================
// TYPES
// ===============================

export interface FishGrowthMeasurement {
  id?: string;
  date: string;
  averageWeight: number;
  notes?: string;
}

export interface CropGrowthMeasurement {
  id?: string;
  date: string;
  heightCm: number;
  leafCount: number;
  notes?: string;
}

// ===============================
// FISH GROWTH
// ===============================

export const addFishMeasurement = async (
  measurement: Omit<FishGrowthMeasurement, "id">,
) => {
  const measurementsRef = ref(db, "growthMeasurements/fish");

  const newMeasurement = push(measurementsRef);

  await set(newMeasurement, measurement);

  return {
    id: newMeasurement.key,
    ...measurement,
  };
};

export const getFishMeasurements = (
  callback: (data: FishGrowthMeasurement[]) => void,
) => {
  const measurementsRef = ref(db, "growthMeasurements/fish");

  return onValue(measurementsRef, (snapshot) => {
    const data = snapshot.val();

    if (!data) {
      callback([]);
      return;
    }

    const measurements: FishGrowthMeasurement[] = Object.entries(data).map(
      ([id, value]: [string, any]) => ({
        id,
        ...value,
      }),
    );

    measurements.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    callback(measurements);
  });
};

export const deleteFishMeasurement = async (id: string) => {
  await remove(ref(db, `growthMeasurements/fish/${id}`));
};

// ===============================
// CROP GROWTH
// ===============================

export const addCropMeasurement = async (
  measurement: Omit<CropGrowthMeasurement, "id">,
) => {
  const measurementsRef = ref(db, "growthMeasurements/crop");

  const newMeasurement = push(measurementsRef);

  await set(newMeasurement, measurement);

  return {
    id: newMeasurement.key,
    ...measurement,
  };
};

export const getCropMeasurements = (
  callback: (data: CropGrowthMeasurement[]) => void,
) => {
  const measurementsRef = ref(db, "growthMeasurements/crop");

  return onValue(measurementsRef, (snapshot) => {
    const data = snapshot.val();

    if (!data) {
      callback([]);
      return;
    }

    const measurements: CropGrowthMeasurement[] = Object.entries(data).map(
      ([id, value]: [string, any]) => ({
        id,
        ...value,
      }),
    );

    measurements.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    callback(measurements);
  });
};

export const deleteCropMeasurement = async (id: string) => {
  await remove(ref(db, `growthMeasurements/crop/${id}`));
};
