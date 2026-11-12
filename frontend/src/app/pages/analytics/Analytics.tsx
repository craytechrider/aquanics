import { useEffect, useMemo, useState } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  Sprout,
  Calendar,
  AlertCircle,
  Fish,
  RefreshCw,
  Scale,
  Target,
  Droplets,
} from "lucide-react";
import { onValue, ref } from "firebase/database";
import { useNavigate } from "react-router";

import { db } from "../../../firebase";

/* =========================================================
   TYPES
========================================================= */

interface CropConfiguration {
  type: string;
  plantingDate: string;
  ageDays: number;
  targetYield: number;
}

interface FishConfiguration {
  species: string;
  ageWeeks: number;
  startingWeight: number;
  targetWeight: number;
}

interface FishMeasurement {
  id: string;
  date: string;
  averageWeight: number;
  notes?: string;
  createdAt?: string;
}

interface CropMeasurement {
  id: string;
  date: string;
  heightCm: number;
  leafCount?: number;
  notes?: string;
  createdAt?: string;
}

interface SensorData {
  ph?: number | null;
  waterTemp?: number | null;
  ammonia?: number | null;
  dissolvedOxygen?: number | null;
}

interface ForestTree {
  left: number[];
  right: number[];
  feature: number[];
  threshold: number[];
  value: number[];
}

interface ForestModel {
  modelType: string;
  trainingData: string;
  trainedThrough: string;
  featureNames: string[];
  models: Record<string, { trees: ForestTree[]; maeHoldout: number | null; testSamples: number; trainingSamples: number }>;
}

interface ForecastPoint {
  date: string;
  day: number;
  fishWeight: number;
  cropHeight: number;
}

function averageOfDayData(value: unknown): number | null {
  if (!value || typeof value !== "object") return null;
  const readings = Object.values(value as Record<string, unknown>)
    .map((item) => Number(item))
    .filter((item) => Number.isFinite(item));
  if (!readings.length) return null;
  return readings.reduce((sum, item) => sum + item, 0) / readings.length;
}

function latestSensorMean(value: unknown): number | null {
  if (!value || typeof value !== "object") return null;
  const days = Object.keys(value as Record<string, unknown>).sort();
  for (let i = days.length - 1; i >= 0; i -= 1) {
    const mean = averageOfDayData((value as Record<string, unknown>)[days[i]]);
    if (mean !== null) return mean;
  }
  return null;
}

function predictWithForest(model: ForestModel, key: string, features: number[]): number | null {
  const forest = model.models[key];
  if (!forest?.trees?.length) return null;
  const predictions = forest.trees.map((tree) => {
    let node = 0;
    let guard = 0;
    while (tree.left[node] !== -1 && tree.right[node] !== -1 && guard < tree.left.length) {
      const featureIndex = tree.feature[node];
      node = features[featureIndex] <= tree.threshold[node] ? tree.left[node] : tree.right[node];
      guard += 1;
    }
    return tree.value[node] ?? 0;
  });
  return predictions.reduce((sum, value) => sum + value, 0) / predictions.length;
}

function averageDailySlope(measurements: Array<{ date: string; value: number }>, windowDays: number): number {
  if (measurements.length < 2) return 0;
  const last = measurements[measurements.length - 1];
  const lastTime = new Date(last.date).getTime();
  let prior = measurements[0];
  for (let i = measurements.length - 2; i >= 0; i -= 1) {
    const elapsed = (lastTime - new Date(measurements[i].date).getTime()) / 86400000;
    if (elapsed >= windowDays) {
      prior = measurements[i];
      break;
    }
  }
  const days = Math.max((lastTime - new Date(prior.date).getTime()) / 86400000, 1);
  return (last.value - prior.value) / days;
}

interface CropPrediction {
  cropType: string;
  ageDays: number;
  targetYield: number;
  estimatedYield: number;
  yieldProgress: number;
  estimatedDaysToHarvest: number;
  status: "Healthy" | "Caution" | "Needs Attention";
  recommendation: string;
}

interface FishAnalysis {
  currentWeight: number;
  growthRatePerWeek: number;
  remainingWeight: number;
  estimatedDaysToTarget: number;
  progress: number;
  status: string;
}

/* =========================================================
   HELPERS
========================================================= */

function calculateCropAge(plantingDate: string): number {
  if (!plantingDate) return 0;

  const planted = new Date(plantingDate);
  const today = new Date();

  if (Number.isNaN(planted.getTime())) {
    return 0;
  }

  const difference = today.getTime() - planted.getTime();

  const days = Math.floor(difference / (1000 * 60 * 60 * 24));

  return Math.max(days, 0);
}

/*
  Rule-based crop prediction.

  IMPORTANT:
  This is NOT machine learning yet.
  It is a temporary prediction model until
  enough real crop measurements exist.
*/

function predictCropGrowth(
  config: CropConfiguration,
  sensors: SensorData = {},
): CropPrediction {
  const ageDays = config.plantingDate
    ? calculateCropAge(config.plantingDate)
    : Number(config.ageDays) || 0;

  const targetYield = Number(config.targetYield) || 0;

  // Initial assumed crop cycle.
  const expectedCropDays = 30;

  const progress = Math.min(ageDays / expectedCropDays, 1);

  let estimatedYield = targetYield * progress;

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

  estimatedYield *= conditionScore;

  estimatedYield = Number(estimatedYield.toFixed(2));

  const yieldProgress =
    targetYield > 0 ? Math.min((estimatedYield / targetYield) * 100, 100) : 0;

  const estimatedDaysToHarvest = Math.max(expectedCropDays - ageDays, 0);

  let status: CropPrediction["status"];

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

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function Analytics() {
  const navigate = useNavigate();

  const [cropConfig, setCropConfig] = useState<CropConfiguration | null>(null);

  const [fishConfig, setFishConfig] = useState<FishConfiguration | null>(null);

  const [fishMeasurements, setFishMeasurements] = useState<FishMeasurement[]>(
    [],
  );

  const [cropMeasurements, setCropMeasurements] = useState<CropMeasurement[]>(
    [],
  );
  const [sensorData, setSensorData] = useState<SensorData>({});
  const [forestModel, setForestModel] = useState<ForestModel | null>(null);
  const [modelLoadError, setModelLoadError] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const [showGrowthInfo, setShowGrowthInfo] = useState(false);

  const [showYieldInfo, setShowYieldInfo] = useState(false);

  /* =========================================================
     LOAD FIREBASE DATA
  ========================================================= */

  useEffect(() => {
    setLoading(true);
    setError(null);

    const cropConfigRef = ref(db, "configuration/crop");

    const fishConfigRef = ref(db, "configuration/fish");

    const fishMeasurementsRef = ref(db, "growthMeasurements/fish");

    const cropMeasurementsRef = ref(db, "growthMeasurements/crop");

    let cropLoaded = false;
    let fishLoaded = false;
    let fishMeasurementsLoaded = false;
    let cropMeasurementsLoaded = false;

    const checkLoaded = () => {
      if (
        cropLoaded &&
        fishLoaded &&
        fishMeasurementsLoaded &&
        cropMeasurementsLoaded
      ) {
        setLoading(false);
      }
    };

    /* ---------------------------------------------------------
       CROP CONFIGURATION
    --------------------------------------------------------- */

    const unsubscribeCropConfig = onValue(
      cropConfigRef,
      (snapshot) => {
        const data = snapshot.val();

        if (data) {
          setCropConfig({
            type: data.type || "Unknown Crop",
            plantingDate: data.plantingDate || "",
            ageDays: Number(data.ageDays) || 0,
            targetYield: Number(data.targetYield) || 0,
          });
        } else {
          setCropConfig(null);
        }

        cropLoaded = true;
        checkLoaded();
      },
      () => {
        setError("Failed to load crop configuration.");

        cropLoaded = true;
        checkLoaded();
      },
    );

    /* ---------------------------------------------------------
       FISH CONFIGURATION
    --------------------------------------------------------- */

    const unsubscribeFishConfig = onValue(
      fishConfigRef,
      (snapshot) => {
        const data = snapshot.val();

        if (data) {
          setFishConfig({
            species: data.species || "Unknown Species",
            ageWeeks: Number(data.ageWeeks) || 0,
            startingWeight: Number(data.startingWeight) || 0,
            targetWeight: Number(data.targetWeight) || 0,
          });
        } else {
          setFishConfig(null);
        }

        fishLoaded = true;
        checkLoaded();
      },
      () => {
        setError("Failed to load fish configuration.");

        fishLoaded = true;
        checkLoaded();
      },
    );

    /* ---------------------------------------------------------
       FISH MEASUREMENTS
    --------------------------------------------------------- */

    const unsubscribeFishMeasurements = onValue(
      fishMeasurementsRef,
      (snapshot) => {
        const data = snapshot.val();

        if (!data) {
          setFishMeasurements([]);
        } else {
          const measurements: FishMeasurement[] = Object.entries(
            data as Record<
              string,
              {
                date?: string;
                averageWeight?: number | string;
                notes?: string;
                createdAt?: string;
              }
            >,
          ).map(([id, value]) => ({
            id,
            date: value.date || "",
            averageWeight: Number(value.averageWeight) || 0,
            notes: value.notes || "",
            createdAt: value.createdAt || "",
          }));

          measurements.sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
          );

          setFishMeasurements(measurements);
        }

        fishMeasurementsLoaded = true;
        checkLoaded();
      },
      () => {
        setError("Failed to load fish measurements.");

        fishMeasurementsLoaded = true;
        checkLoaded();
      },
    );

    /* ---------------------------------------------------------
       CROP MEASUREMENTS
    --------------------------------------------------------- */

    const unsubscribeCropMeasurements = onValue(
      cropMeasurementsRef,
      (snapshot) => {
        const data = snapshot.val();

        if (!data) {
          setCropMeasurements([]);
        } else {
          const measurements: CropMeasurement[] = Object.entries(
            data as Record<
              string,
              {
                date?: string;
                heightCm?: number | string;
                height?: number | string;
                leafCount?: number | string;
                notes?: string;
                createdAt?: string;
              }
            >,
          ).map(([id, value]) => ({
            id,
            date: value.date || "",
            heightCm: Number(value.heightCm ?? value.height) || 0,
            leafCount:
              value.leafCount !== undefined
                ? Number(value.leafCount)
                : undefined,
            notes: value.notes || "",
            createdAt: value.createdAt || "",
          }));

          measurements.sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
          );

          setCropMeasurements(measurements);
        }

        cropMeasurementsLoaded = true;
        checkLoaded();
      },
      () => {
        setError("Failed to load crop measurements.");

        cropMeasurementsLoaded = true;
        checkLoaded();
      },
    );

    return () => {
      unsubscribeCropConfig();
      unsubscribeFishConfig();
      unsubscribeFishMeasurements();
      unsubscribeCropMeasurements();
    };
  }, []);

  /* =========================================================
     LOAD RANDOM FOREST MODEL + LATEST SENSOR SUMMARIES
     The bundled model was trained on simulated demonstration data.
  ========================================================= */

  useEffect(() => {
    let active = true;
    fetch(`${import.meta.env.BASE_URL}randomForestModel.json`)
      .then((response) => {
        if (!response.ok) throw new Error("Could not load the Random Forest model file.");
        return response.json();
      })
      .then((data: ForestModel) => {
        if (active) setForestModel(data);
      })
      .catch((loadError: unknown) => {
        if (active) setModelLoadError(loadError instanceof Error ? loadError.message : "Model could not be loaded.");
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const channels: Array<[keyof SensorData, string]> = [
      ["ph", "sensors/ph"],
      ["waterTemp", "sensors/waterTemp"],
      ["ammonia", "sensors/ammonia"],
      ["dissolvedOxygen", "sensors/do"],
    ];
    const unsubscribers = channels.map(([field, path]) =>
      onValue(ref(db, path), (snapshot) => {
        const mean = latestSensorMean(snapshot.val());
        setSensorData((current) => ({ ...current, [field]: mean }));
      }, () => {
        setSensorData((current) => ({ ...current, [field]: null }));
      }),
    );
    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  }, []);

  /* =========================================================
     FISH CALCULATIONS
  ========================================================= */

  const fishAnalysis = useMemo<FishAnalysis>(() => {
    if (!fishConfig) {
      return {
        currentWeight: 0,
        growthRatePerWeek: 0,
        remainingWeight: 0,
        estimatedDaysToTarget: 0,
        progress: 0,
        status: "No Data",
      };
    }

    const sorted = [...fishMeasurements].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    const currentWeight =
      sorted.length > 0
        ? sorted[sorted.length - 1].averageWeight
        : fishConfig.startingWeight;

    /*
      Calculate growth rate.

      If measurements exist:
      use first measurement -> latest measurement.

      If there is only one measurement:
      use starting weight -> current measurement.
    */

    let growthRatePerWeek = 0;

    if (sorted.length >= 2) {
      const first = sorted[0];
      const last = sorted[sorted.length - 1];

      const days =
        (new Date(last.date).getTime() - new Date(first.date).getTime()) /
        (1000 * 60 * 60 * 24);

      const weeks = Math.max(days / 7, 1 / 7);

      const weightDifference = last.averageWeight - first.averageWeight;

      growthRatePerWeek = weightDifference / weeks;
    } else if (fishConfig.ageWeeks > 0) {
      growthRatePerWeek =
        (currentWeight - fishConfig.startingWeight) / fishConfig.ageWeeks;
    }

    growthRatePerWeek = Math.max(growthRatePerWeek, 0);

    const remainingWeight = Math.max(
      fishConfig.targetWeight - currentWeight,
      0,
    );

    let estimatedDaysToTarget = 0;

    if (growthRatePerWeek > 0) {
      const weeks = remainingWeight / growthRatePerWeek;

      estimatedDaysToTarget = Math.ceil(weeks * 7);
    }

    const progress =
      fishConfig.targetWeight > 0
        ? Math.min((currentWeight / fishConfig.targetWeight) * 100, 100)
        : 0;

    let status = "Healthy";

    if (progress >= 100) {
      status = "Target Reached";
    } else if (growthRatePerWeek <= 0) {
      status = "Needs Attention";
    } else if (progress < 50) {
      status = "Growing";
    }

    return {
      currentWeight,
      growthRatePerWeek: Number(growthRatePerWeek.toFixed(1)),
      remainingWeight,
      estimatedDaysToTarget,
      progress: Number(progress.toFixed(1)),
      status,
    };
  }, [fishConfig, fishMeasurements]);

  /* =========================================================
     FISH CHART DATA
  ========================================================= */

  const fishChartData = useMemo(() => {
    if (!fishConfig) return [];

    const sorted = [...fishMeasurements].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    return sorted.map((measurement) => {
      const measurementDate = new Date(measurement.date);

      const firstDate =
        sorted.length > 0 ? new Date(sorted[0].date) : measurementDate;

      const elapsedDays = Math.max(
        (measurementDate.getTime() - firstDate.getTime()) /
          (1000 * 60 * 60 * 24),
        0,
      );

      /*
        The ideal trajectory starts from the
        configured starting weight and moves
        toward the target weight.
      */

      const idealWeight =
        fishConfig.startingWeight +
        (fishConfig.targetWeight - fishConfig.startingWeight) *
          Math.min(elapsedDays / Math.max(fishConfig.ageWeeks * 7, 1), 1);

      return {
        date: measurement.date,
        actual: measurement.averageWeight,
        ideal: Number(idealWeight.toFixed(1)),
      };
    });
  }, [fishConfig, fishMeasurements]);

  /* =========================================================
     SEVEN-DAY RANDOM FOREST FORECAST
  ========================================================= */

  const sevenDayForecast = useMemo<ForecastPoint[]>(() => {
    if (!forestModel || !fishMeasurements.length || !cropMeasurements.length) return [];
    const fishHistory = [...fishMeasurements]
      .filter((item) => item.date && Number.isFinite(item.averageWeight))
      .sort((a, b) => a.date.localeCompare(b.date));
    const cropHistory = [...cropMeasurements]
      .filter((item) => item.date && Number.isFinite(item.heightCm))
      .sort((a, b) => a.date.localeCompare(b.date));
    if (!fishHistory.length || !cropHistory.length) return [];

    const fishLast = fishHistory[fishHistory.length - 1];
    const cropLast = cropHistory[cropHistory.length - 1];
    const fishValues = fishHistory.map((item) => ({ date: item.date, value: item.averageWeight }));
    const cropValues = cropHistory.map((item) => ({ date: item.date, value: item.heightCm }));
    const today = new Date();
    const startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const firstDate = new Date(`${fishHistory[0].date}T00:00:00`);
    const dayIndex = Math.max(0, Math.floor((startDate.getTime() - firstDate.getTime()) / 86400000));
    const features = [
      fishLast.averageWeight,
      averageDailySlope(fishValues, 3),
      averageDailySlope(fishValues, 7),
      cropLast.heightCm,
      averageDailySlope(cropValues, 3),
      averageDailySlope(cropValues, 7),
      dayIndex,
      sensorData.ph ?? 7,
      sensorData.waterTemp ?? 25,
      sensorData.ammonia ?? 0.2,
      sensorData.dissolvedOxygen ?? 6,
    ];

    return Array.from({ length: 7 }, (_, index) => {
      const day = index + 1;
      const target = new Date(startDate);
      target.setDate(target.getDate() + day);
      const date = `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, "0")}-${String(target.getDate()).padStart(2, "0")}`;
      const predictedFish = predictWithForest(forestModel, `fish_${day}d`, features);
      const predictedCrop = predictWithForest(forestModel, `crop_${day}d`, features);
      return {
        date,
        day,
        fishWeight: Math.max(0, Number((predictedFish ?? fishLast.averageWeight).toFixed(1))),
        cropHeight: Math.max(0, Number((predictedCrop ?? cropLast.heightCm).toFixed(1))),
      };
    });
  }, [forestModel, fishMeasurements, cropMeasurements, sensorData]);

  /* =========================================================
     CROP PREDICTION
  ========================================================= */

  const cropPrediction = useMemo(() => {
    if (!cropConfig) return null;

    return predictCropGrowth(cropConfig, sensorData);
  }, [cropConfig, sensorData]);

  /* =========================================================
     CROP CHART
  ========================================================= */

  const cropChartData = useMemo(() => {
    return cropMeasurements.map((measurement) => ({
      date: measurement.date,
      height: measurement.heightCm,
      leaves: measurement.leafCount ?? null,
    }));
  }, [cropMeasurements]);

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-lg p-8 text-center">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-cyan-600 rounded-full animate-spin mx-auto mb-4" />

          <p className="text-sm text-slate-500">
            Loading Firebase analytics...
          </p>
        </div>
      </div>
    );
  }

  /* =========================================================
     ERROR
  ========================================================= */

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="bg-white rounded-2xl border border-red-100 shadow-lg p-8 text-center max-w-md">
          <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={25} />
          </div>

          <h2 className="text-lg font-bold text-slate-800">
            Unable to load Analytics
          </h2>

          <p className="text-sm text-slate-500 mt-2">{error}</p>

          <button
            onClick={() => window.location.reload()}
            className="mt-5 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  /* =========================================================
     PAGE
  ========================================================= */

  return (
    <div className="space-y-6 pb-10">
      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-display font-bold text-slate-900">
              AI & Predictive Analytics
            </h1>

            <span className="px-3 py-1 rounded-full bg-violet-50 text-violet-700 border border-violet-100 text-xs font-bold">
              Random Forest · 7-Day Forecast
            </span>
          </div>

          <p className="text-slate-500 mt-1">
            Historical charts and sensor inputs are loaded from Firebase. Seven-day fish-weight and crop-height forecasts use the trained Random Forest model.
          </p>
        </div>

        <button
          onClick={() => window.location.reload()}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition font-semibold text-sm"
        >
          <RefreshCw size={17} />
          Refresh
        </button>
      </div>

      {/* =====================================================
          SUMMARY CARDS
      ===================================================== */}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {/* Fish Current Weight */}

        <div className="bg-white rounded-2xl border border-slate-100 shadow-lg shadow-slate-200/50 p-5">
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-xl bg-cyan-50 text-cyan-600">
              <Fish size={23} />
            </div>

            <span className="text-xs font-bold text-slate-400">CURRENT</span>
          </div>

          <p className="text-sm text-slate-500 mt-4">
            {fishConfig?.species || "Fish"}
          </p>

          <div className="flex items-baseline gap-2 mt-1">
            <p className="text-3xl font-display font-bold text-slate-900">
              {fishAnalysis.currentWeight}
            </p>

            <span className="text-sm text-slate-400">g</span>
          </div>
        </div>

        {/* Fish Target */}

        <div className="bg-white rounded-2xl border border-slate-100 shadow-lg shadow-slate-200/50 p-5">
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
              <Target size={23} />
            </div>

            <span className="text-xs font-bold text-slate-400">TARGET</span>
          </div>

          <p className="text-sm text-slate-500 mt-4">Target Weight</p>

          <div className="flex items-baseline gap-2 mt-1">
            <p className="text-3xl font-display font-bold text-slate-900">
              {fishConfig?.targetWeight || 0}
            </p>

            <span className="text-sm text-slate-400">g</span>
          </div>
        </div>

        {/* Fish ETA */}

        <div className="bg-white rounded-2xl border border-slate-100 shadow-lg shadow-slate-200/50 p-5">
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-xl bg-amber-50 text-amber-600">
              <Calendar size={23} />
            </div>

            <span className="text-xs font-bold text-slate-400">FORECAST</span>
          </div>

          <p className="text-sm text-slate-500 mt-4">Estimated Target</p>

          <div className="flex items-baseline gap-2 mt-1">
            <p className="text-3xl font-display font-bold text-slate-900">
              {fishAnalysis.estimatedDaysToTarget}
            </p>

            <span className="text-sm text-slate-400">days</span>
          </div>
        </div>

        {/* Crop Yield */}

        <div className="bg-white rounded-2xl border border-slate-100 shadow-lg shadow-slate-200/50 p-5">
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-xl bg-green-50 text-green-600">
              <Sprout size={23} />
            </div>

            <span className="text-xs font-bold text-slate-400">CROP</span>
          </div>

          <p className="text-sm text-slate-500 mt-4">Estimated Yield</p>

          <div className="flex items-baseline gap-2 mt-1">
            <p className="text-3xl font-display font-bold text-slate-900">
              {cropPrediction?.estimatedYield ?? 0}
            </p>

            <span className="text-sm text-slate-400">kg</span>
          </div>
        </div>
      </div>

      {/* =====================================================
          FISH GROWTH INSIGHT
      ===================================================== */}

      <div className="bg-gradient-to-r from-cyan-600 to-blue-600 rounded-3xl p-7 text-white shadow-xl shadow-cyan-200 relative overflow-hidden">
        <div className="absolute right-0 top-0 opacity-10">
          <Fish size={180} />
        </div>

        <div className="relative z-10">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="bg-white/20 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider">
              Growth Prediction
            </span>

            <span className="text-cyan-100 text-sm">
              Based on Firebase measurements
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-cyan-100 text-sm">Current Weight</p>

              <p className="text-4xl font-display font-bold mt-1">
                {fishAnalysis.currentWeight} g
              </p>
            </div>

            <div>
              <p className="text-cyan-100 text-sm">Growth Rate</p>

              <p className="text-4xl font-display font-bold mt-1">
                {fishAnalysis.growthRatePerWeek}
                <span className="text-lg ml-1">g/week</span>
              </p>
            </div>

            <div>
              <p className="text-cyan-100 text-sm">Estimated Target</p>

              <p className="text-4xl font-display font-bold mt-1">
                {fishAnalysis.estimatedDaysToTarget}
                <span className="text-lg ml-1">days</span>
              </p>
            </div>
          </div>

          <div className="mt-6">
            <div className="flex justify-between text-sm mb-2">
              <span>Progress to {fishConfig?.targetWeight || 0}g</span>

              <span className="font-bold">{fishAnalysis.progress}%</span>
            </div>

            <div className="h-2.5 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all"
                style={{
                  width: `${fishAnalysis.progress}%`,
                }}
              />
            </div>
          </div>

          <p className="mt-5 text-sm text-cyan-50 max-w-3xl">
            {fishAnalysis.status === "Target Reached"
              ? "The current fish weight has reached the configured target weight."
              : fishAnalysis.status === "Needs Attention"
                ? "No positive growth rate can currently be calculated. Add more fish measurements to improve the prediction."
                : `Based on the recorded measurements, the fish are currently growing at approximately ${fishAnalysis.growthRatePerWeek} g per week.`}
          </p>
        </div>
      </div>

      {/* =====================================================
          CHARTS
      ===================================================== */}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* ===================================================
            FISH GROWTH
        =================================================== */}

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-lg shadow-slate-200/50">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-display font-bold text-slate-800 text-lg">
                Fish Growth Trajectory
              </h3>

              <p className="text-xs text-slate-400 mt-1">
                Actual measurements vs ideal trajectory
              </p>
            </div>

            <button
              onClick={() => setShowGrowthInfo(!showGrowthInfo)}
              className="text-slate-400 hover:text-cyan-600 transition-colors"
              aria-label="Show fish growth information"
            >
              <AlertCircle size={18} />
            </button>
          </div>

          {showGrowthInfo && (
            <div className="mb-5 bg-cyan-50 border border-cyan-100 rounded-xl p-4">
              <p className="text-xs text-cyan-800 leading-relaxed">
                The blue line represents actual fish weights entered through
                Growth Measurements. The dashed line represents an ideal path
                from the configured starting weight toward the target weight.
              </p>

              <button
                onClick={() => setShowGrowthInfo(false)}
                className="text-xs text-cyan-700 font-bold mt-2"
              >
                Got it
              </button>
            </div>
          )}

          <div className="h-[320px] w-full">
            {fishChartData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <Scale size={38} className="text-slate-300 mb-3" />

                <p className="font-semibold text-slate-600">
                  No fish measurements yet
                </p>

                <p className="text-xs text-slate-400 mt-1 max-w-xs">
                  Add measurements from the Growth Measurements page to create
                  the growth trajectory.
                </p>

                <button
                  onClick={() => navigate("/growth-measurements")}
                  className="mt-4 px-4 py-2 rounded-lg bg-cyan-600 text-white text-xs font-bold hover:bg-cyan-700"
                >
                  Add Fish Measurement
                </button>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={fishChartData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f1f5f9"
                  />

                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fill: "#94a3b8",
                      fontSize: 11,
                    }}
                  />

                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fill: "#94a3b8",
                      fontSize: 11,
                    }}
                    unit=" g"
                  />

                  <Tooltip />

                  <Legend />

                  <Line
                    type="monotone"
                    dataKey="actual"
                    name="Actual Weight"
                    stroke="#06b6d4"
                    strokeWidth={3}
                    dot={{
                      r: 5,
                    }}
                  />

                  <Line
                    type="monotone"
                    dataKey="ideal"
                    name="Ideal Growth"
                    stroke="#94a3b8"
                    strokeWidth={2}
                    strokeDasharray="6 6"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* ===================================================
            CROP GROWTH
        =================================================== */}

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-lg shadow-slate-200/50">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-display font-bold text-slate-800 text-lg">
                Crop Growth
              </h3>

              <p className="text-xs text-slate-400 mt-1">
                Actual plant height measurements
              </p>
            </div>

            <button
              onClick={() => setShowYieldInfo(!showYieldInfo)}
              className="text-slate-400 hover:text-emerald-600 transition-colors"
              aria-label="Show crop growth information"
            >
              <AlertCircle size={18} />
            </button>
          </div>

          {showYieldInfo && (
            <div className="mb-5 bg-emerald-50 border border-emerald-100 rounded-xl p-4">
              <p className="text-xs text-emerald-800 leading-relaxed">
                Crop growth is currently based on the measurements recorded in
                Firebase. The estimated yield uses the crop configuration and
                current growth stage.
              </p>

              <button
                onClick={() => setShowYieldInfo(false)}
                className="text-xs text-emerald-700 font-bold mt-2"
              >
                Got it
              </button>
            </div>
          )}

          <div className="h-[320px] w-full">
            {cropChartData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <Sprout size={38} className="text-slate-300 mb-3" />

                <p className="font-semibold text-slate-600">
                  No crop measurements yet
                </p>

                <p className="text-xs text-slate-400 mt-1 max-w-xs">
                  Add crop height measurements to build your crop growth
                  history.
                </p>

                <button
                  onClick={() => navigate("/growth-measurements")}
                  className="mt-4 px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700"
                >
                  Add Crop Measurement
                </button>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cropChartData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f1f5f9"
                  />

                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fill: "#94a3b8",
                      fontSize: 11,
                    }}
                  />

                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fill: "#94a3b8",
                      fontSize: 11,
                    }}
                    unit=" cm"
                  />

                  <Tooltip />

                  <Legend />

                  <Bar
                    dataKey="height"
                    name="Plant Height"
                    fill="#10b981"
                    radius={[6, 6, 0, 0]}
                    barSize={28}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* =====================================================
          7-DAY RANDOM FOREST FORECAST
      ===================================================== */}
      <section className="w-[94%] sm:w-[92%] lg:w-full mx-auto bg-white rounded-2xl sm:rounded-3xl border border-amber-200 shadow-lg shadow-slate-200/40 p-4 sm:p-6 lg:p-7">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-5">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display text-lg sm:text-xl font-bold text-slate-900">7-Day Growth Forecast</h2>
              <span className="px-2.5 py-1 rounded-full bg-cyan-50 text-cyan-800 text-[10px] sm:text-xs font-bold">RANDOM FOREST</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">Random Forest estimates for fish average weight and crop height.</p>
          </div>
          <span className="text-xs text-slate-500">Model trained through {forestModel?.trainedThrough || "demo dataset"}</span>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 sm:p-4 mb-5 flex items-start gap-2.5">
          <AlertCircle size={19} className="text-slate-600 mt-0.5 shrink-0" />
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
            The model uses the imported Firebase dataset, which includes simulated readings. Forecast accuracy has not yet been validated against observed farm outcomes.
          </p>
        </div>

        {modelLoadError ? (
          <p className="text-sm text-red-600">{modelLoadError} Check that public/randomForestModel.json exists in the frontend project.</p>
        ) : sevenDayForecast.length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-500">Loading the model or waiting for fish and crop measurements...</div>
        ) : (
          <>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              <div>
                <h3 className="font-bold text-slate-800 mb-3">Predicted Fish Average Weight</h3>
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={sevenDayForecast}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                      <YAxis unit=" g" tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="fishWeight" name="Predicted weight" stroke="#0891b2" strokeWidth={3} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div>
                <h3 className="font-bold text-slate-800 mb-3">Predicted Crop Height</h3>
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={sevenDayForecast}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                      <YAxis unit=" cm" tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="cropHeight" name="Predicted height" stroke="#059669" strokeWidth={3} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto mt-5">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase text-slate-500 bg-slate-50">
                  <tr><th className="px-3 py-3 rounded-l-lg">Forecast date</th><th className="px-3 py-3">Day</th><th className="px-3 py-3">Fish weight (g)</th><th className="px-3 py-3 rounded-r-lg">Crop height (cm)</th></tr>
                </thead>
                <tbody>
                  {sevenDayForecast.map((point) => (
                    <tr key={point.date} className="border-b border-slate-100 last:border-0">
                      <td className="px-3 py-3 font-medium text-slate-700">{point.date}</td>
                      <td className="px-3 py-3 text-slate-600">Day {point.day}</td>
                      <td className="px-3 py-3 font-semibold text-cyan-700">{point.fishWeight.toFixed(1)}</td>
                      <td className="px-3 py-3 font-semibold text-emerald-700">{point.cropHeight.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-[11px] text-slate-400 mt-3">Daily sensor inputs: pH, water temperature, ammonia, and dissolved oxygen. If a sensor channel has no stored readings, a neutral fallback value is used.</p>
          </>
        )}
      </section>

      {/* =====================================================
          CROP PREDICTION
      ===================================================== */}

      {cropPrediction && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-lg shadow-slate-200/50 p-7">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600">
                <Sprout size={28} />
              </div>

              <div>
                <h3 className="font-display font-bold text-xl text-slate-900">
                  {cropPrediction.cropType}
                </h3>

                <p className="text-sm text-slate-500">Crop Yield Prediction</p>
              </div>
            </div>

            <span
              className={
                cropPrediction.status === "Healthy"
                  ? "px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold"
                  : cropPrediction.status === "Caution"
                    ? "px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 text-xs font-bold"
                    : "px-3 py-1.5 rounded-full bg-red-50 text-red-700 text-xs font-bold"
              }
            >
              {cropPrediction.status}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-7">
            <div className="p-5 rounded-2xl bg-slate-50">
              <p className="text-xs text-slate-400 uppercase font-bold">
                Crop Age
              </p>

              <p className="text-3xl font-display font-bold text-slate-900 mt-1">
                {cropPrediction.ageDays}

                <span className="text-sm text-slate-400 ml-1">days</span>
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50">
              <p className="text-xs text-slate-400 uppercase font-bold">
                Estimated Yield
              </p>

              <p className="text-3xl font-display font-bold text-slate-900 mt-1">
                {cropPrediction.estimatedYield}

                <span className="text-sm text-slate-400 ml-1">kg</span>
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50">
              <p className="text-xs text-slate-400 uppercase font-bold">
                Harvest Estimate
              </p>

              <p className="text-3xl font-display font-bold text-slate-900 mt-1">
                {cropPrediction.estimatedDaysToHarvest}

                <span className="text-sm text-slate-400 ml-1">days</span>
              </p>
            </div>
          </div>

          <div className="mt-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="font-semibold text-slate-600">
                Yield Progress
              </span>

              <span className="font-bold text-emerald-600">
                {cropPrediction.yieldProgress}%
              </span>
            </div>

            <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full transition-all"
                style={{
                  width: `${cropPrediction.yieldProgress}%`,
                }}
              />
            </div>
          </div>

          <div className="mt-6 flex items-start gap-3 p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
            <Droplets size={20} className="text-emerald-600 mt-0.5 shrink-0" />

            <div>
              <p className="text-sm font-bold text-emerald-900">
                Recommendation
              </p>

              <p className="text-xs text-emerald-700 mt-1">
                {cropPrediction.recommendation}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          DATA SOURCES
      ===================================================== */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <p className="text-xs uppercase font-bold text-slate-400">
            Fish Measurements
          </p>

          <p className="text-3xl font-display font-bold text-slate-900 mt-1">
            {fishMeasurements.length}
          </p>

          <p className="text-xs text-slate-500 mt-1">records from Firebase</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <p className="text-xs uppercase font-bold text-slate-400">
            Crop Measurements
          </p>

          <p className="text-3xl font-display font-bold text-slate-900 mt-1">
            {cropMeasurements.length}
          </p>

          <p className="text-xs text-slate-500 mt-1">records from Firebase</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <p className="text-xs uppercase font-bold text-slate-400">
            Prediction Method
          </p>

          <p className="text-xl font-display font-bold text-slate-900 mt-2">
            Random Forest
          </p>

          <p className="text-xs text-slate-500 mt-1">
            Seven-day fish-weight and crop-height forecasts
          </p>
        </div>
      </div>

      {/* =====================================================
          ACTION
      ===================================================== */}

      <div className="flex justify-center">
        <button
          onClick={() => navigate("/growth")}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 transition"
        >
          <TrendingUp size={18} />
          Manage Growth Measurements
        </button>
      </div>
    </div>
  );
}
