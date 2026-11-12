export interface CropConfiguration {
  type: string;
  plantingDate: string;
  ageDays: number;
  targetYield: number;
}

export interface CropPrediction {
  cropType: string;
  ageDays: number;
  targetYield: number;

  estimatedYield: number;
  yieldProgress: number;

  estimatedDaysToHarvest: number;

  status: "Healthy" | "Caution" | "Needs Attention";

  recommendation: string;
}

interface SensorData {
  ph?: number | null;
  waterTemp?: number | null;
  ammonia?: number | null;
  dissolvedOxygen?: number | null;
}

/**
 * Calculates the current crop age.
 */
export function calculateCropAge(plantingDate: string): number {
  if (!plantingDate) return 0;

  const planted = new Date(plantingDate);
  const today = new Date();

  const difference = today.getTime() - planted.getTime();

  const days = Math.floor(difference / (1000 * 60 * 60 * 24));

  return Math.max(days, 0);
}

/**
 * Initial rule-based crop prediction.
 *
 * This is NOT an ML model yet.
 * It provides a reasonable starting point until
 * enough real crop measurements exist.
 */
export function predictCropGrowth(
  config: CropConfiguration,
  sensors: SensorData = {},
): CropPrediction {
  const ageDays = config.plantingDate
    ? calculateCropAge(config.plantingDate)
    : config.ageDays || 0;

  const targetYield = Number(config.targetYield) || 0;

  /*
   * Basic expected growth model.
   *
   * We assume a crop cycle of approximately 30 days
   * for the initial prediction.
   *
   * Later this should be replaced by a trained model
   * using actual crop measurements.
   */
  const expectedCropDays = 30;

  const progress = Math.min(ageDays / expectedCropDays, 1);

  /*
   * Estimate yield based on growth progress.
   */
  let estimatedYield = targetYield * progress;

  /*
   * Adjust prediction slightly based on
   * water conditions.
   */

  let conditionScore = 1;

  if (sensors.ph !== null && sensors.ph !== undefined) {
    if (sensors.ph < 5.5 || sensors.ph > 8) {
      conditionScore -= 0.1;
    }
  }

  if (sensors.waterTemp !== null && sensors.waterTemp !== undefined) {
    if (sensors.waterTemp < 20 || sensors.waterTemp > 30) {
      conditionScore -= 0.1;
    }
  }

  if (sensors.ammonia !== null && sensors.ammonia !== undefined) {
    if (sensors.ammonia > 1) {
      conditionScore -= 0.15;
    }
  }

  if (
    sensors.dissolvedOxygen !== null &&
    sensors.dissolvedOxygen !== undefined
  ) {
    if (sensors.dissolvedOxygen < 4) {
      conditionScore -= 0.1;
    }
  }

  conditionScore = Math.max(conditionScore, 0.5);

  estimatedYield = estimatedYield * conditionScore;

  estimatedYield = Number(estimatedYield.toFixed(2));

  const yieldProgress =
    targetYield > 0 ? Math.min((estimatedYield / targetYield) * 100, 100) : 0;

  /*
   * Estimate remaining days.
   */
  const estimatedDaysToHarvest = Math.max(expectedCropDays - ageDays, 0);

  let status: "Healthy" | "Caution" | "Needs Attention";

  if (conditionScore >= 0.9) {
    status = "Healthy";
  } else if (conditionScore >= 0.7) {
    status = "Caution";
  } else {
    status = "Needs Attention";
  }

  let recommendation = "Maintain current water and nutrient conditions.";

  if (status === "Caution") {
    recommendation =
      "Monitor water quality closely and maintain stable growing conditions.";
  }

  if (status === "Needs Attention") {
    recommendation =
      "Check water quality and crop conditions. Correct abnormal sensor readings.";
  }

  return {
    cropType: config.type,
    ageDays,
    targetYield,
    estimatedYield,
    yieldProgress: Number(yieldProgress.toFixed(1)),
    estimatedDaysToHarvest,
    status,
    recommendation,
  };
}
