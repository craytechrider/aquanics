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
     CROP PREDICTION
  ========================================================= */

  const cropPrediction = useMemo(() => {
    if (!cropConfig) return null;

    /*
      Sensor values are currently not being loaded
      on this Analytics page, so the prediction
      uses the base crop growth calculation.
    */

    return predictCropGrowth(cropConfig, {});
  }, [cropConfig]);

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
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-0 space-y-5 sm:space-y-6 pb-8 sm:pb-10">
      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="w-[94%] sm:w-[92%] lg:w-full mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 leading-tight">
              Predictive Forecasting
            </h1>

            <span className="px-2.5 py-1 rounded-full bg-violet-50 text-violet-700 border border-violet-100 text-[10px] sm:text-xs font-bold">
              Rule-Based Prediction
            </span>
          </div>

          <p className="text-sm sm:text-base text-slate-500 mt-1 leading-relaxed">
            Predictions based on your actual Firebase growth measurements.
          </p>
        </div>

        <button
          onClick={() => window.location.reload()}
          className="self-start md:self-auto flex items-center justify-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition font-semibold text-xs sm:text-sm"
        >
          <RefreshCw size={17} />
          Refresh
        </button>
      </div>

      {/* =====================================================
          IMPORTANT NOTICE
      ===================================================== */}

      <div className="w-[94%] sm:w-[92%] lg:w-full mx-auto bg-violet-50 border border-violet-100 rounded-2xl p-3 sm:p-4 flex items-start gap-2.5 sm:gap-3">
        <AlertCircle size={20} className="text-violet-600 mt-0.5 shrink-0" />

        <div>
          <p className="text-sm font-bold text-violet-900">
            Prediction model status
          </p>

          <p className="text-xs text-violet-700 mt-1 leading-relaxed">
            AQUANICS is currently using rule-based calculations from your real
            growth records. Once enough historical measurements are collected,
            this can be replaced with a trained machine-learning model and
            genuine accuracy metrics.
          </p>
        </div>
      </div>

      {/* =====================================================
          SUMMARY CARDS
      ===================================================== */}

      <div className="w-[94%] sm:w-[92%] lg:w-full mx-auto grid grid-cols-2 md:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-3 sm:p-4 lg:p-5">
        {/* Fish Current Weight */}

        <div className="bg-white rounded-2xl border border-slate-100 shadow-lg shadow-slate-200/50 p-3 sm:p-4 lg:p-5">
          <div className="flex items-center justify-between">
            <div className="p-2 sm:p-2.5 rounded-xl bg-cyan-50 text-cyan-600">
              <Fish size={19} className="sm:w-[21px] sm:h-[21px]" />
            </div>

            <span className="text-[9px] sm:text-[10px] lg:text-xs font-bold text-slate-400">
              CURRENT
            </span>
          </div>

          <p className="text-xs sm:text-sm text-slate-500 mt-3 sm:mt-4 leading-snug">
            {fishConfig?.species || "Fish"}
          </p>

          <div className="flex items-baseline gap-2 mt-1">
            <p className="text-xl sm:text-2xl lg:text-3xl font-display font-bold text-slate-900">
              {fishAnalysis.currentWeight}
            </p>

            <span className="text-xs sm:text-sm text-slate-400">g</span>
          </div>
        </div>

        {/* Fish Target */}

        <div className="bg-white rounded-2xl border border-slate-100 shadow-lg shadow-slate-200/50 p-3 sm:p-4 lg:p-5">
          <div className="flex items-center justify-between">
            <div className="p-2 sm:p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
              <Target size={19} className="sm:w-[21px] sm:h-[21px]" />
            </div>

            <span className="text-[9px] sm:text-[10px] lg:text-xs font-bold text-slate-400">
              TARGET
            </span>
          </div>

          <p className="text-xs sm:text-sm text-slate-500 mt-3 sm:mt-4 leading-snug">
            Target Weight
          </p>

          <div className="flex items-baseline gap-2 mt-1">
            <p className="text-xl sm:text-2xl lg:text-3xl font-display font-bold text-slate-900">
              {fishConfig?.targetWeight || 0}
            </p>

            <span className="text-xs sm:text-sm text-slate-400">g</span>
          </div>
        </div>

        {/* Fish ETA */}

        <div className="bg-white rounded-2xl border border-slate-100 shadow-lg shadow-slate-200/50 p-3 sm:p-4 lg:p-5">
          <div className="flex items-center justify-between">
            <div className="p-2 sm:p-2.5 rounded-xl bg-amber-50 text-amber-600">
              <Calendar size={19} className="sm:w-[21px] sm:h-[21px]" />
            </div>

            <span className="text-[9px] sm:text-[10px] lg:text-xs font-bold text-slate-400">
              FORECAST
            </span>
          </div>

          <p className="text-xs sm:text-sm text-slate-500 mt-3 sm:mt-4 leading-snug">
            Estimated Target
          </p>

          <div className="flex items-baseline gap-2 mt-1">
            <p className="text-xl sm:text-2xl lg:text-3xl font-display font-bold text-slate-900">
              {fishAnalysis.estimatedDaysToTarget}
            </p>

            <span className="text-xs sm:text-sm text-slate-400">days</span>
          </div>
        </div>

        {/* Crop Yield */}

        <div className="bg-white rounded-2xl border border-slate-100 shadow-lg shadow-slate-200/50 p-3 sm:p-4 lg:p-5">
          <div className="flex items-center justify-between">
            <div className="p-2 sm:p-2.5 rounded-xl bg-green-50 text-green-600">
              <Sprout size={19} className="sm:w-[21px] sm:h-[21px]" />
            </div>

            <span className="text-[9px] sm:text-[10px] lg:text-xs font-bold text-slate-400">
              CROP
            </span>
          </div>

          <p className="text-xs sm:text-sm text-slate-500 mt-3 sm:mt-4 leading-snug">
            Estimated Yield
          </p>

          <div className="flex items-baseline gap-2 mt-1">
            <p className="text-xl sm:text-2xl lg:text-3xl font-display font-bold text-slate-900">
              {cropPrediction?.estimatedYield ?? 0}
            </p>

            <span className="text-xs sm:text-sm text-slate-400">kg</span>
          </div>
        </div>
      </div>

      {/* =====================================================
          FISH GROWTH INSIGHT
      ===================================================== */}

      <div className="bg-gradient-to-r from-cyan-600 to-blue-600 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-7 text-white shadow-xl shadow-cyan-200 relative overflow-hidden">
        <div className="absolute right-0 top-0 opacity-10">
          <Fish
            size={120}
            className="sm:w-[160px] sm:h-[160px] lg:w-[180px] lg:h-[180px]"
          />
        </div>

        <div className="relative z-10">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <span className="bg-white/20 px-2.5 sm:px-3 py-1 rounded-lg text-[10px] sm:text-xs font-bold uppercase tracking-wider">
              Growth Prediction
            </span>

            <span className="text-cyan-100 text-sm">
              Based on Firebase measurements
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            <div>
              <p className="text-cyan-100 text-sm">Current Weight</p>

              <p className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold mt-1">
                {fishAnalysis.currentWeight} g
              </p>
            </div>

            <div>
              <p className="text-cyan-100 text-sm">Growth Rate</p>

              <p className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold mt-1">
                {fishAnalysis.growthRatePerWeek}
                <span className="text-lg ml-1">g/week</span>
              </p>
            </div>

            <div>
              <p className="text-cyan-100 text-sm">Estimated Target</p>

              <p className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold mt-1">
                {fishAnalysis.estimatedDaysToTarget}
                <span className="text-lg ml-1">days</span>
              </p>
            </div>
          </div>

          <div className="mt-5 sm:mt-6">
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

          <p className="mt-4 sm:mt-5 text-xs sm:text-sm text-cyan-50 max-w-3xl leading-relaxed">
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

      <div className="w-[94%] sm:w-[92%] lg:w-full mx-auto grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        {/* ===================================================
            FISH GROWTH
        =================================================== */}

        <div className="bg-white p-4 sm:p-5 lg:p-6 rounded-2xl sm:rounded-3xl border border-slate-100 shadow-lg shadow-slate-200/50">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div>
              <h3 className="font-display font-bold text-slate-800 text-base sm:text-lg">
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

          <div className="h-[250px] sm:h-[290px] lg:h-[320px] w-full">
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
                      fontSize: 9,
                    }}
                  />

                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fill: "#94a3b8",
                      fontSize: 9,
                    }}
                    unit=" g"
                  />

                  <Tooltip />

                  <Legend wrapperStyle={{ fontSize: "10px" }} />

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

        <div className="bg-white p-4 sm:p-5 lg:p-6 rounded-2xl sm:rounded-3xl border border-slate-100 shadow-lg shadow-slate-200/50">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div>
              <h3 className="font-display font-bold text-slate-800 text-base sm:text-lg">
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

          <div className="h-[250px] sm:h-[290px] lg:h-[320px] w-full">
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
                      fontSize: 9,
                    }}
                  />

                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fill: "#94a3b8",
                      fontSize: 9,
                    }}
                    unit=" cm"
                  />

                  <Tooltip />

                  <Legend wrapperStyle={{ fontSize: "10px" }} />

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
          CROP PREDICTION
      ===================================================== */}

      {cropPrediction && (
        <div className="bg-white w-[94%] sm:w-[92%] lg:w-full mx-auto rounded-2xl sm:rounded-3xl border border-slate-100 shadow-lg shadow-slate-200/50 p-4 sm:p-6 lg:p-7">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-4">
              <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-emerald-50 text-emerald-600">
                <Sprout size={22} className="sm:w-7 sm:h-7" />
              </div>

              <div>
                <h3 className="font-display font-bold text-lg sm:text-xl text-slate-900">
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

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-5 mt-5 sm:mt-7">
            <div className="p-3 sm:p-5 rounded-xl sm:rounded-2xl bg-slate-50">
              <p className="text-xs text-slate-400 uppercase font-bold">
                Crop Age
              </p>

              <p className="text-2xl sm:text-3xl font-display font-bold text-slate-900 mt-1">
                {cropPrediction.ageDays}

                <span className="text-sm text-slate-400 ml-1">days</span>
              </p>
            </div>

            <div className="p-3 sm:p-5 rounded-xl sm:rounded-2xl bg-slate-50">
              <p className="text-xs text-slate-400 uppercase font-bold">
                Estimated Yield
              </p>

              <p className="text-2xl sm:text-3xl font-display font-bold text-slate-900 mt-1">
                {cropPrediction.estimatedYield}

                <span className="text-sm text-slate-400 ml-1">kg</span>
              </p>
            </div>

            <div className="p-3 sm:p-5 rounded-xl sm:rounded-2xl bg-slate-50">
              <p className="text-xs text-slate-400 uppercase font-bold">
                Harvest Estimate
              </p>

              <p className="text-2xl sm:text-3xl font-display font-bold text-slate-900 mt-1">
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

      <div className="w-[94%] sm:w-[92%] lg:w-full mx-auto grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-3 sm:p-4 lg:p-5">
        <div className="bg-white rounded-2xl border border-slate-100 p-3 sm:p-4 lg:p-5">
          <p className="text-xs uppercase font-bold text-slate-400">
            Fish Measurements
          </p>

          <p className="text-xl sm:text-2xl lg:text-3xl font-display font-bold text-slate-900 mt-1">
            {fishMeasurements.length}
          </p>

          <p className="text-xs text-slate-500 mt-1">records from Firebase</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-3 sm:p-4 lg:p-5">
          <p className="text-xs uppercase font-bold text-slate-400">
            Crop Measurements
          </p>

          <p className="text-xl sm:text-2xl lg:text-3xl font-display font-bold text-slate-900 mt-1">
            {cropMeasurements.length}
          </p>

          <p className="text-xs text-slate-500 mt-1">records from Firebase</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-3 sm:p-4 lg:p-5">
          <p className="text-xs uppercase font-bold text-slate-400">
            Prediction Method
          </p>

          <p className="text-base sm:text-xl font-display font-bold text-slate-900 mt-2">
            Rule-Based
          </p>

          <p className="text-xs text-slate-500 mt-1">
            ML training will come after enough historical data
          </p>
        </div>
      </div>

      {/* =====================================================
          ACTION
      ===================================================== */}

      <div className="w-[94%] sm:w-auto mx-auto flex justify-center">
        <button
          onClick={() => navigate("/growth")}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl bg-slate-900 text-white font-bold text-xs sm:text-sm hover:bg-slate-800 transition"
        >
          <TrendingUp size={18} />
          Manage Growth Measurements
        </button>
      </div>
    </div>
  );
}
