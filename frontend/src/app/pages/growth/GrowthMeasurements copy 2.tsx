import { useEffect, useState } from "react";
import {
  Save,
  Loader2,
  Sprout,
  Fish,
  Calendar,
  Scale,
  Plus,
  Trash2,
  RefreshCw,
  TrendingUp,
  CheckCircle2,
  RotateCcw,
  History,
} from "lucide-react";

import { onValue, push, ref, remove, set } from "firebase/database";

import { db } from "../../../firebase";
import { cn } from "../../lib/utils";

/* =========================================================
   TYPES
========================================================= */

interface CropConfig {
  type: string;
  plantingDate: string;
  ageDays: number;
  targetYield: number;
  targetHarvestDays: number;

  // Date information
  date?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface FishConfig {
  species: string;
  ageWeeks: number;
  startingWeight: number;
  targetWeight: number;
  numberOfFish: number;

  // Date information
  date?: string;
  createdAt?: string;
  updatedAt?: string;
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
  height: number;
  notes?: string;
  createdAt?: string;
}

/* =========================================================
   LOCAL DATE HELPER
========================================================= */

/*
 * IMPORTANT:
 * Do not use:
 *
 * new Date().toISOString().split("T")[0]
 *
 * because toISOString() converts to UTC and can cause
 * the displayed date to be one day earlier/later.
 *
 * This returns the actual local date.
 */

const getLocalDate = (): string => {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

/* =========================================================
   DEFAULT VALUES
========================================================= */

const DEFAULT_CROP: CropConfig = {
  type: "Romaine Lettuce",
  plantingDate: getLocalDate(),
  ageDays: 0,
  targetYield: 8,
  targetHarvestDays: 45,
};

const DEFAULT_FISH: FishConfig = {
  species: "Tilapia",
  ageWeeks: 12,
  startingWeight: 100,
  targetWeight: 500,
  numberOfFish: 1,
};

/* =========================================================
   COMPONENT
========================================================= */

export default function GrowthManagement() {
  /* =======================================================
     CONFIGURATION STATE
  ======================================================= */

  const [crop, setCrop] = useState<CropConfig>(DEFAULT_CROP);

  const [fish, setFish] = useState<FishConfig>(DEFAULT_FISH);

  /* =======================================================
     MEASUREMENT STATE
  ======================================================= */

  const [fishMeasurements, setFishMeasurements] = useState<FishMeasurement[]>(
    [],
  );

  const [cropMeasurements, setCropMeasurements] = useState<CropMeasurement[]>(
    [],
  );

  /* =======================================================
     LOADING / SAVING STATE
  ======================================================= */

  const [loading, setLoading] = useState(true);

  const [savingCrop, setSavingCrop] = useState(false);

  const [savingFish, setSavingFish] = useState(false);

  const [cropSaved, setCropSaved] = useState(false);

  const [fishSaved, setFishSaved] = useState(false);

  /* =======================================================
     TABS
  ======================================================= */

  const [activeTab, setActiveTab] = useState<"overview" | "fish" | "crop">(
    "overview",
  );

  /* =======================================================
     NEW FISH MEASUREMENT
  ======================================================= */

  const [newFishDate, setNewFishDate] = useState(getLocalDate());

  const [newFishWeight, setNewFishWeight] = useState("");

  const [newFishNotes, setNewFishNotes] = useState("");

  const [savingFishMeasurement, setSavingFishMeasurement] = useState(false);

  /* =======================================================
     NEW CROP MEASUREMENT
  ======================================================= */

  const [newCropDate, setNewCropDate] = useState(getLocalDate());

  const [newCropHeight, setNewCropHeight] = useState("");

  const [newCropNotes, setNewCropNotes] = useState("");

  const [savingCropMeasurement, setSavingCropMeasurement] = useState(false);

  /* =======================================================
     CROP HARVEST / CYCLE STATE
  ======================================================= */

  const [harvestingCrop, setHarvestingCrop] = useState(false);
  const [startingCropCycle, setStartingCropCycle] = useState(false);
  const [harvestQuantity, setHarvestQuantity] = useState("");
  const [harvestNotes, setHarvestNotes] = useState("");
  const [harvestDate, setHarvestDate] = useState(getLocalDate());
  const [newCycleDate, setNewCycleDate] = useState(getLocalDate());
  const [initialCropHeight, setInitialCropHeight] = useState("");
  const [newCycleNotes, setNewCycleNotes] = useState("");
  const [cropCycleStatus, setCropCycleStatus] = useState<"active" | "harvested">("active");
  const [cropHarvests, setCropHarvests] = useState<any[]>([]);

  /* =========================================================
     LOAD FIREBASE DATA
  ========================================================= */

  useEffect(() => {
    const cropRef = ref(db, "configuration/crop");

    const fishRef = ref(db, "configuration/fish");

    const fishMeasurementsRef = ref(db, "growthMeasurements/fish");

    const cropMeasurementsRef = ref(db, "growthMeasurements/crop");
    const cropCycleStatusRef = ref(db, "configuration/crop/status");
    const cropHarvestsRef = ref(db, "cropHarvests");

    let cropLoaded = false;

    let fishLoaded = false;

    const checkLoading = () => {
      if (cropLoaded && fishLoaded) {
        setLoading(false);
      }
    };

    /* =======================================================
       LOAD CROP CONFIGURATION
    ======================================================= */

    const unsubscribeCrop = onValue(
      cropRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();

          setCrop({
            ...DEFAULT_CROP,
            ...data,
          });
        }

        cropLoaded = true;

        checkLoading();
      },
      (error) => {
        console.error("Failed to load crop configuration:", error);

        cropLoaded = true;

        checkLoading();
      },
    );

    /* =======================================================
       LOAD FISH CONFIGURATION
    ======================================================= */

    const unsubscribeFish = onValue(
      fishRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();

          setFish({
            ...DEFAULT_FISH,
            ...data,
          });
        }

        fishLoaded = true;

        checkLoading();
      },
      (error) => {
        console.error("Failed to load fish configuration:", error);

        fishLoaded = true;

        checkLoading();
      },
    );

    /* =======================================================
       LOAD FISH MEASUREMENTS
    ======================================================= */

    const unsubscribeFishMeasurements = onValue(
      fishMeasurementsRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          setFishMeasurements([]);
          return;
        }

        const data = snapshot.val();

        const measurements: FishMeasurement[] = Object.entries(data).map(
          ([id, value]: [string, any]) => ({
            id,
            ...value,
          }),
        );

        measurements.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        );

        setFishMeasurements(measurements);
      },
      (error) => {
        console.error("Failed to load fish measurements:", error);

        setFishMeasurements([]);
      },
    );

    /* =======================================================
       LOAD CROP MEASUREMENTS
    ======================================================= */

    const unsubscribeCropMeasurements = onValue(
      cropMeasurementsRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          setCropMeasurements([]);
          return;
        }

        const data = snapshot.val();

        const measurements: CropMeasurement[] = Object.entries(data).map(
          ([id, value]: [string, any]) => ({
            id,
            ...value,
          }),
        );

        measurements.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        );

        setCropMeasurements(measurements);
      },
      (error) => {
        console.error("Failed to load crop measurements:", error);

        setCropMeasurements([]);
      },
    );

    const unsubscribeCropStatus = onValue(cropCycleStatusRef, (snapshot) => {
      setCropCycleStatus(snapshot.val() === "harvested" ? "harvested" : "active");
    });

    const unsubscribeCropHarvests = onValue(cropHarvestsRef, (snapshot) => {
      if (!snapshot.exists()) {
        setCropHarvests([]);
        return;
      }
      const data = snapshot.val();
      const items = Object.entries(data).map(([id, value]: [string, any]) => ({
        id,
        ...value,
      }));
      items.sort((a, b) => String(b.harvestDate || "").localeCompare(String(a.harvestDate || "")));
      setCropHarvests(items);
    });

    /* =======================================================
       CLEANUP
    ======================================================= */

    return () => {
      unsubscribeCrop();
      unsubscribeFish();
      unsubscribeFishMeasurements();
      unsubscribeCropMeasurements();
      unsubscribeCropStatus();
      unsubscribeCropHarvests();
    };
  }, []);

  /* =========================================================
     CALCULATE CROP AGE
  ========================================================= */

  const calculateCropAge = () => {
    if (!crop.plantingDate) {
      return 0;
    }

    const plantingDate = new Date(`${crop.plantingDate}T00:00:00`);

    const today = new Date();

    const todayStart = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );

    const difference = todayStart.getTime() - plantingDate.getTime();

    const days = Math.floor(difference / (1000 * 60 * 60 * 24));

    return Math.max(days, 0);
  };

  const cropAge = calculateCropAge();

  /* =========================================================
     DAYS UNTIL HARVEST
  ========================================================= */

  const daysUntilHarvest = Math.max(crop.targetHarvestDays - cropAge, 0);

  /* =========================================================
     CURRENT FISH WEIGHT
  ========================================================= */

  const latestFishMeasurement =
    fishMeasurements.length > 0 ? fishMeasurements[0] : null;

  const currentFishWeight =
    latestFishMeasurement?.averageWeight ?? fish.startingWeight;

  /* =========================================================
     FISH GROWTH PROGRESS
  ========================================================= */

  const fishWeightRange = fish.targetWeight - fish.startingWeight;

  const fishWeightProgress =
    fishWeightRange > 0
      ? Math.min(
          Math.max(
            ((currentFishWeight - fish.startingWeight) / fishWeightRange) * 100,
            0,
          ),
          100,
        )
      : 0;

  /* =========================================================
     CROP HARVEST PROGRESS
  ========================================================= */

  const cropProgress =
    crop.targetHarvestDays > 0
      ? Math.min((cropAge / crop.targetHarvestDays) * 100, 100)
      : 0;

  /* =========================================================
     SAVE CROP CONFIGURATION
  ========================================================= */

  const handleSaveCrop = async () => {
    setSavingCrop(true);

    setCropSaved(false);

    try {
      const now = new Date().toISOString();

      const today = getLocalDate();

      const updatedCrop: CropConfig = {
        ...crop,

        ageDays: calculateCropAge(),

        /*
         * Date the configuration was saved.
         */
        date: today,

        /*
         * Keep createdAt if it already exists.
         * Otherwise create it now.
         */
        createdAt: crop.createdAt || now,

        /*
         * Always update this whenever configuration
         * is saved.
         */
        updatedAt: now,
      };

      await set(ref(db, "configuration/crop"), updatedCrop);

      setCrop(updatedCrop);

      setCropSaved(true);

      setTimeout(() => {
        setCropSaved(false);
      }, 2500);
    } catch (error) {
      console.error("Failed to save crop configuration:", error);

      alert("Failed to save crop configuration.");
    } finally {
      setSavingCrop(false);
    }
  };

  /* =========================================================
     SAVE FISH CONFIGURATION
  ========================================================= */

  const handleSaveFish = async () => {
    setSavingFish(true);

    setFishSaved(false);

    try {
      const now = new Date().toISOString();

      const today = getLocalDate();

      const updatedFish: FishConfig = {
        ...fish,

        /*
         * Date the configuration was saved.
         */
        date: today,

        /*
         * Preserve original creation date.
         */
        createdAt: fish.createdAt || now,

        /*
         * Update every time configuration changes.
         */
        updatedAt: now,
      };

      await set(ref(db, "configuration/fish"), updatedFish);

      setFish(updatedFish);

      setFishSaved(true);

      setTimeout(() => {
        setFishSaved(false);
      }, 2500);
    } catch (error) {
      console.error("Failed to save fish configuration:", error);

      alert("Failed to save fish configuration.");
    } finally {
      setSavingFish(false);
    }
  };

  /* =========================================================
     ADD FISH MEASUREMENT
  ========================================================= */

  const handleAddFishMeasurement = async () => {
    if (!newFishWeight) {
      alert("Please enter the fish weight.");

      return;
    }

    const weight = Number(newFishWeight);

    if (!Number.isFinite(weight) || weight <= 0) {
      alert("Weight must be greater than zero.");

      return;
    }

    if (!newFishDate) {
      alert("Please select a date.");

      return;
    }

    setSavingFishMeasurement(true);

    try {
      const measurementsRef = ref(db, "growthMeasurements/fish");

      const newMeasurementRef = push(measurementsRef);

      const now = new Date().toISOString();

      const measurement = {
        date: newFishDate,

        averageWeight: weight,

        notes: newFishNotes.trim(),

        createdAt: now,
      };

      await set(newMeasurementRef, measurement);

      setNewFishWeight("");

      setNewFishNotes("");

      setNewFishDate(getLocalDate());

      alert("Fish measurement saved!");
    } catch (error) {
      console.error("Failed to save fish measurement:", error);

      alert("Failed to save fish measurement.");
    } finally {
      setSavingFishMeasurement(false);
    }
  };

  /* =========================================================
     DELETE FISH MEASUREMENT
  ========================================================= */

  const handleDeleteFishMeasurement = async (id: string) => {
    if (!window.confirm("Delete this fish measurement?")) {
      return;
    }

    try {
      await remove(ref(db, `growthMeasurements/fish/${id}`));
    } catch (error) {
      console.error("Failed to delete fish measurement:", error);

      alert("Failed to delete measurement.");
    }
  };

  /* =========================================================
     ADD CROP MEASUREMENT
  ========================================================= */

  const handleAddCropMeasurement = async () => {
    if (!newCropHeight) {
      alert("Please enter the crop height.");

      return;
    }

    const height = Number(newCropHeight);

    if (!Number.isFinite(height) || height <= 0) {
      alert("Height must be greater than zero.");

      return;
    }

    if (!newCropDate) {
      alert("Please select a date.");

      return;
    }

    setSavingCropMeasurement(true);

    try {
      const measurementsRef = ref(db, "growthMeasurements/crop");

      const newMeasurementRef = push(measurementsRef);

      const now = new Date().toISOString();

      const measurement = {
        date: newCropDate,

        height,

        notes: newCropNotes.trim(),

        createdAt: now,
      };

      await set(newMeasurementRef, measurement);

      setNewCropHeight("");

      setNewCropNotes("");

      setNewCropDate(getLocalDate());

      alert("Crop measurement saved!");
    } catch (error) {
      console.error("Failed to save crop measurement:", error);

      alert("Failed to save crop measurement.");
    } finally {
      setSavingCropMeasurement(false);
    }
  };

  /* =========================================================
     DELETE CROP MEASUREMENT
  ========================================================= */

  const handleDeleteCropMeasurement = async (id: string) => {
    if (!window.confirm("Delete this crop measurement?")) {
      return;
    }

    try {
      await remove(ref(db, `growthMeasurements/crop/${id}`));
    } catch (error) {
      console.error("Failed to delete crop measurement:", error);

      alert("Failed to delete measurement.");
    }
  };

  /* =========================================================
     HARVEST CURRENT CROP
  ========================================================= */

  const handleHarvestCrop = async () => {
    if (cropCycleStatus === "harvested") {
      alert("This crop cycle has already been marked as harvested. Start a new crop cycle to continue.");
      return;
    }

    const quantity = Number(harvestQuantity);
    if (!harvestDate) {
      alert("Please select the harvest date.");
      return;
    }
    if (!harvestQuantity || !Number.isFinite(quantity) || quantity <= 0) {
      alert("Enter the harvested quantity in kilograms.");
      return;
    }

    const confirmed = window.confirm(
      `Record harvest for ${crop.type} on ${harvestDate} with ${quantity} kg harvested? Previous growth measurements will be kept.`
    );
    if (!confirmed) return;

    setHarvestingCrop(true);
    try {
      const now = new Date().toISOString();
      const harvestRef = push(ref(db, "cropHarvests"));
      await set(harvestRef, {
        cropType: crop.type,
        plantingDate: crop.plantingDate,
        harvestDate,
        cropAgeDays: Math.max(
          0,
          Math.floor(
            (new Date(`${harvestDate}T00:00:00`).getTime() -
              new Date(`${crop.plantingDate}T00:00:00`).getTime()) /
              (1000 * 60 * 60 * 24)
          )
        ),
        quantityKg: quantity,
        targetYieldKg: crop.targetYield,
        notes: harvestNotes.trim(),
        createdAt: now,
      });

      await set(ref(db, "configuration/crop/status"), "harvested");
      await set(ref(db, "configuration/crop/lastHarvestDate"), harvestDate);
      await set(ref(db, "configuration/crop/updatedAt"), now);

      setCropCycleStatus("harvested");
      setHarvestQuantity("");
      setHarvestNotes("");
      alert("Harvest saved. Your previous crop measurements have been preserved. Start a new crop cycle when the next lettuce batch is planted.");
    } catch (error) {
      console.error("Failed to record crop harvest:", error);
      alert("Could not save the harvest. Please check your Firebase connection and try again.");
    } finally {
      setHarvestingCrop(false);
    }
  };

  /* =========================================================
     START A NEW CROP CYCLE
  ========================================================= */

  const handleStartNewCropCycle = async () => {
    if (!newCycleDate) {
      alert("Please select the new planting date.");
      return;
    }

    const initialHeight = initialCropHeight.trim() === "" ? null : Number(initialCropHeight);
    if (initialHeight !== null && (!Number.isFinite(initialHeight) || initialHeight < 0)) {
      alert("Initial plant height must be zero or greater.");
      return;
    }

    const confirmed = window.confirm(
      "Start a new crop cycle? The planting date and crop age will reset. Previous crop measurements and harvest records will not be deleted."
    );
    if (!confirmed) return;

    setStartingCropCycle(true);
    try {
      const now = new Date().toISOString();
      const updatedCrop: CropConfig = {
        ...crop,
        plantingDate: newCycleDate,
        ageDays: 0,
        date: newCycleDate,
        createdAt: now,
        updatedAt: now,
      };

      await set(ref(db, "configuration/crop"), updatedCrop);
      await set(ref(db, "configuration/crop/status"), "active");
      await set(ref(db, "configuration/crop/lastHarvestDate"), null);

      if (initialHeight !== null) {
        const measurementRef = push(ref(db, "growthMeasurements/crop"));
        await set(measurementRef, {
          date: newCycleDate,
          height: initialHeight,
          notes: newCycleNotes.trim()
            ? `New crop cycle: ${newCycleNotes.trim()}`
            : "Initial measurement for new crop cycle",
          cyclePlantingDate: newCycleDate,
          createdAt: now,
        });
      }

      setCrop(updatedCrop);
      setCropCycleStatus("active");
      setInitialCropHeight("");
      setNewCycleNotes("");
      setNewCycleDate(getLocalDate());
      setActiveTab("crop");
      alert("New crop cycle started. The crop age is now calculated from the new planting date.");
    } catch (error) {
      console.error("Failed to start new crop cycle:", error);
      alert("Could not start the new crop cycle. Please check your Firebase connection and try again.");
    } finally {
      setStartingCropCycle(false);
    }
  };

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="animate-spin text-emerald-600" />

          <p className="text-sm font-medium text-slate-500">
            Loading growth configuration...
          </p>
        </div>
      </div>
    );
  }

  /* =========================================================
     UI
  ========================================================= */

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-0 space-y-5 sm:space-y-7 lg:space-y-8 pb-8 sm:pb-10">
      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="w-[94%] sm:w-[92%] lg:w-full mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 tracking-tight leading-tight">
            Growth Management
          </h1>

          <p className="text-sm sm:text-base text-slate-500 font-medium mt-1 leading-relaxed">
            Manage your fish and crop growth information for analytics and AI
            predictions.
          </p>
        </div>

        <button
          onClick={() => window.location.reload()}
          className="self-start md:self-auto flex items-center justify-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 font-bold text-xs sm:text-sm hover:bg-slate-50 transition-colors"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* =====================================================
          TABS
      ===================================================== */}

      <div className="w-[94%] sm:w-[92%] lg:w-full mx-auto bg-white p-1.5 sm:p-2 rounded-2xl border border-slate-100 shadow-sm grid grid-cols-3 gap-1.5 sm:gap-2">
        <button
          onClick={() => setActiveTab("overview")}
          className={cn(
            "w-full px-2 sm:px-4 py-2.5 sm:py-3 rounded-xl text-[11px] sm:text-sm font-bold transition-all",
            activeTab === "overview"
              ? "bg-gradient-to-r from-emerald-600 to-cyan-600 text-white shadow-md"
              : "text-slate-500 hover:bg-slate-50",
          )}
        >
          Overview
        </button>

        <button
          onClick={() => setActiveTab("fish")}
          className={cn(
            "w-full px-2 sm:px-4 py-2.5 sm:py-3 rounded-xl text-[11px] sm:text-sm font-bold transition-all",
            activeTab === "fish"
              ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md"
              : "text-slate-500 hover:bg-slate-50",
          )}
        >
          Fish Growth
        </button>

        <button
          onClick={() => setActiveTab("crop")}
          className={cn(
            "w-full px-2 sm:px-4 py-2.5 sm:py-3 rounded-xl text-[11px] sm:text-sm font-bold transition-all",
            activeTab === "crop"
              ? "bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-md"
              : "text-slate-500 hover:bg-slate-50",
          )}
        >
          Crop Growth
        </button>
      </div>

      {/* =====================================================
          OVERVIEW
      ===================================================== */}

      {activeTab === "overview" && (
        <>
          <div className="w-[94%] sm:w-[92%] lg:w-full mx-auto grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* CROP OVERVIEW */}

            <div className="bg-white p-4 sm:p-5 lg:p-7 rounded-2xl sm:rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50">
              <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-emerald-50 text-emerald-600">
                  <Sprout size={21} className="sm:w-6 sm:h-6" />
                </div>

                <div>
                  <h2 className="font-display font-bold text-slate-800 text-base sm:text-base sm:text-lg">
                    {crop.type}
                  </h2>

                  <p className="text-xs text-slate-400 font-medium">
                    Crop Growth
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-50">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Age
                  </p>

                  <p className="text-xl sm:text-2xl font-bold text-slate-800 mt-1">
                    {cropAge}

                    <span className="text-sm font-medium text-slate-400 ml-1">
                      days
                    </span>
                  </p>
                </div>

                <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-50">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Harvest
                  </p>

                  <p className="text-xl sm:text-2xl font-bold text-slate-800 mt-1">
                    {daysUntilHarvest}

                    <span className="text-sm font-medium text-slate-400 ml-1">
                      days
                    </span>
                  </p>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-xs font-bold text-slate-500">
                    Growth Progress
                  </span>

                  <span className="text-xs font-bold text-emerald-600">
                    {Math.round(cropProgress)}%
                  </span>
                </div>

                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full transition-all"
                    style={{
                      width: `${cropProgress}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* FISH OVERVIEW */}

            <div className="bg-white p-4 sm:p-5 lg:p-7 rounded-2xl sm:rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50">
              <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-cyan-50 text-cyan-600">
                  <Fish size={21} className="sm:w-6 sm:h-6" />
                </div>

                <div>
                  <h2 className="font-display font-bold text-slate-800 text-base sm:text-base sm:text-lg">
                    {fish.species}
                  </h2>

                  <p className="text-xs text-slate-400 font-medium">
                    Fish Growth
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-50">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Age
                  </p>

                  <p className="text-xl sm:text-2xl font-bold text-slate-800 mt-1">
                    {fish.ageWeeks}

                    <span className="text-sm font-medium text-slate-400 ml-1">
                      weeks
                    </span>
                  </p>
                </div>

                <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-50">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Current
                  </p>

                  <p className="text-xl sm:text-2xl font-bold text-slate-800 mt-1">
                    {currentFishWeight}

                    <span className="text-sm font-medium text-slate-400 ml-1">
                      g
                    </span>
                  </p>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-xs font-bold text-slate-500">
                    Target Weight Progress
                  </span>

                  <span className="text-xs font-bold text-cyan-600">
                    {Math.round(fishWeightProgress)}%
                  </span>
                </div>

                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all"
                    style={{
                      width: `${fishWeightProgress}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* INFORMATION */}

          <div className="w-[94%] sm:w-[92%] lg:w-full mx-auto bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-7 text-white">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="p-2.5 sm:p-3 rounded-xl bg-white/10">
                <TrendingUp size={21} className="sm:w-6 sm:h-6" />
              </div>

              <div>
                <h3 className="font-display font-bold text-base sm:text-base sm:text-lg">
                  Why this information matters
                </h3>

                <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed max-w-3xl">
                  These growth records will become inputs for the Analytics
                  system. As more measurements are collected, the system can
                  compare actual growth with expected growth and eventually
                  generate fish growth, crop yield, and risk predictions.
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* =====================================================
          FISH TAB
      ===================================================== */}

      {activeTab === "fish" && (
        <>
          {/* FISH CONFIGURATION */}

          <div className="w-[94%] sm:w-[92%] lg:w-full mx-auto bg-white p-4 sm:p-6 lg:p-8 rounded-2xl sm:rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-5 sm:mb-7">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="p-2.5 sm:p-3 bg-cyan-50 text-cyan-600 rounded-xl">
                  <Fish size={21} className="sm:w-6 sm:h-6" />
                </div>

                <div>
                  <h2 className="font-display font-bold text-slate-800 text-base sm:text-lg">
                    Fish Configuration
                  </h2>

                  <p className="text-xs text-slate-400 mt-1">
                    Configure the fish batch used by analytics.
                  </p>
                </div>
              </div>

              <button
                onClick={handleSaveFish}
                disabled={savingFish}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-xl text-sm font-bold hover:shadow-lg disabled:opacity-50"
              >
                {savingFish ? (
                  <Loader2 size={17} className="animate-spin" />
                ) : (
                  <Save size={17} />
                )}

                {fishSaved ? "Saved!" : savingFish ? "Saving..." : "Save Fish"}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {/* SPECIES */}

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Fish Species
                </label>

                <select
                  value={fish.species}
                  onChange={(e) =>
                    setFish({
                      ...fish,
                      species: e.target.value,
                    })
                  }
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-cyan-500"
                >
                  <option value="Tilapia">Tilapia</option>

                  <option value="Catfish">Catfish</option>

                  <option value="Trout">Trout</option>

                  <option value="Koi">Koi</option>
                </select>
              </div>

              {/* AGE */}

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Fish Age (Weeks)
                </label>

                <input
                  type="number"
                  min="0"
                  value={fish.ageWeeks}
                  onChange={(e) =>
                    setFish({
                      ...fish,
                      ageWeeks: Number(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-cyan-500"
                />
              </div>

              {/* STARTING WEIGHT */}

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Starting Weight (g)
                </label>

                <input
                  type="number"
                  min="0"
                  value={fish.startingWeight}
                  onChange={(e) =>
                    setFish({
                      ...fish,
                      startingWeight: Number(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-cyan-500"
                />
              </div>

              {/* TARGET WEIGHT */}

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Target Weight (g)
                </label>

                <input
                  type="number"
                  min="0"
                  value={fish.targetWeight}
                  onChange={(e) =>
                    setFish({
                      ...fish,
                      targetWeight: Number(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-cyan-500"
                />
              </div>

              {/* NUMBER OF FISH */}

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Number of Fish
                </label>

                <input
                  type="number"
                  min="1"
                  value={fish.numberOfFish}
                  onChange={(e) =>
                    setFish({
                      ...fish,
                      numberOfFish: Number(e.target.value) || 1,
                    })
                  }
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            {/* CONFIGURATION DATE */}

            {fish.updatedAt && (
              <div className="mt-4 sm:mt-6 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-cyan-50 border border-cyan-100">
                <div className="flex items-center gap-3">
                  <Calendar size={19} className="text-cyan-600" />

                  <div>
                    <p className="text-sm font-bold text-cyan-800">
                      Last Updated
                    </p>

                    <p className="text-xs text-cyan-600 mt-1">
                      {fish.date || "No date"}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* FISH MEASUREMENTS */}

          <div className="w-[94%] sm:w-[92%] lg:w-full mx-auto bg-white p-4 sm:p-6 lg:p-8 rounded-2xl sm:rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50">
            <div className="flex items-center gap-3 sm:gap-4 mb-7">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <Scale size={24} />
              </div>

              <div>
                <h2 className="font-display font-bold text-slate-800 text-base sm:text-lg">
                  Fish Weight Measurements
                </h2>

                <p className="text-xs text-slate-400 mt-1">
                  Record actual fish weight so Analytics can learn the growth
                  trend.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-5 sm:mb-6">
              {/* DATE */}

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">
                  Date
                </label>

                <input
                  type="date"
                  value={newFishDate}
                  onChange={(e) => setNewFishDate(e.target.value)}
                  className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                />
              </div>

              {/* WEIGHT */}

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">
                  Average Weight (g)
                </label>

                <input
                  type="number"
                  min="0"
                  value={newFishWeight}
                  onChange={(e) => setNewFishWeight(e.target.value)}
                  placeholder="e.g. 280"
                  className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                />
              </div>

              {/* NOTES */}

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">
                  Notes
                </label>

                <input
                  type="text"
                  value={newFishNotes}
                  onChange={(e) => setNewFishNotes(e.target.value)}
                  placeholder="Optional"
                  className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                />
              </div>

              {/* BUTTON */}

              <div className="flex items-end">
                <button
                  onClick={handleAddFishMeasurement}
                  disabled={savingFishMeasurement}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-cyan-600 text-white rounded-xl text-sm font-bold hover:bg-cyan-700 disabled:opacity-50"
                >
                  {savingFishMeasurement ? (
                    <Loader2 size={17} className="animate-spin" />
                  ) : (
                    <Plus size={17} />
                  )}
                  Add Measurement
                </button>
              </div>
            </div>

            {/* FISH LIST */}

            <div className="space-y-3">
              {fishMeasurements.length === 0 ? (
                <div className="p-6 sm:p-8 text-center rounded-2xl bg-slate-50 border border-dashed border-slate-200">
                  <Scale size={30} className="mx-auto text-slate-300 mb-2" />

                  <p className="text-sm font-bold text-slate-500">
                    No fish measurements yet
                  </p>

                  <p className="text-xs text-slate-400 mt-1">
                    Add your first weight measurement above.
                  </p>
                </div>
              ) : (
                fishMeasurements.map((measurement) => (
                  <div
                    key={measurement.id}
                    className="flex items-center justify-between gap-3 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-50 border border-slate-100"
                  >
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="p-2.5 sm:p-3 bg-white rounded-xl shrink-0 border border-slate-200">
                        <Calendar size={18} className="text-slate-500" />
                      </div>

                      <div>
                        <p className="text-xs sm:text-sm font-bold text-slate-800">
                          {measurement.averageWeight} g
                        </p>

                        <p className="text-[11px] sm:text-xs text-slate-400 break-words">
                          {measurement.date}

                          {measurement.notes ? ` • ${measurement.notes}` : ""}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() =>
                        handleDeleteFishMeasurement(measurement.id)
                      }
                      className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}

      {/* =====================================================
          CROP TAB
      ===================================================== */}

      {activeTab === "crop" && (
        <>
          {/* CROP CONFIGURATION */}

          <div className="w-[94%] sm:w-[92%] lg:w-full mx-auto bg-white p-4 sm:p-6 lg:p-8 rounded-2xl sm:rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-5 sm:mb-7">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="p-2.5 sm:p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                  <Sprout size={21} className="sm:w-6 sm:h-6" />
                </div>

                <div>
                  <h2 className="font-display font-bold text-slate-800 text-base sm:text-lg">
                    Crop Configuration
                  </h2>

                  <p className="text-xs text-slate-400 mt-1">
                    Configure the crop used by Analytics.
                  </p>
                </div>
              </div>

              <button
                onClick={handleSaveCrop}
                disabled={savingCrop}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-xl text-sm font-bold hover:shadow-lg disabled:opacity-50"
              >
                {savingCrop ? (
                  <Loader2 size={17} className="animate-spin" />
                ) : (
                  <Save size={17} />
                )}

                {cropSaved ? "Saved!" : savingCrop ? "Saving..." : "Save Crop"}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {/* CROP TYPE */}

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Crop Type
                </label>

                <select
                  value={crop.type}
                  onChange={(e) =>
                    setCrop({
                      ...crop,
                      type: e.target.value,
                    })
                  }
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500"
                >
                  <option value="Romaine Lettuce">Romaine Lettuce</option>

                  <option value="Lettuce">Lettuce</option>

                  <option value="Basil">Basil</option>

                  <option value="Kang Kong">Kang Kong</option>

                  <option value="Spinach">Spinach</option>

                  <option value="Pak Choi">Pak Choi</option>
                </select>
              </div>

              {/* PLANTING DATE */}

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Planting Date
                </label>

                <input
                  type="date"
                  value={crop.plantingDate}
                  onChange={(e) =>
                    setCrop({
                      ...crop,
                      plantingDate: e.target.value,
                    })
                  }
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500"
                />
              </div>

              {/* TARGET HARVEST */}

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Target Harvest Time (Days)
                </label>

                <input
                  type="number"
                  min="1"
                  value={crop.targetHarvestDays}
                  onChange={(e) =>
                    setCrop({
                      ...crop,
                      targetHarvestDays: Number(e.target.value) || 1,
                    })
                  }
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500"
                />
              </div>

              {/* TARGET YIELD */}

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Target Yield (kg)
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={crop.targetYield}
                  onChange={(e) =>
                    setCrop({
                      ...crop,
                      targetYield: Number(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* CURRENT AGE */}

            <div className="mt-4 sm:mt-6 p-3 sm:p-5 rounded-xl sm:rounded-2xl bg-emerald-50 border border-emerald-100">
              <div className="flex items-center gap-3">
                <Calendar size={20} className="text-emerald-600" />

                <div>
                  <p className="text-sm font-bold text-emerald-800">
                    Current Crop Age
                  </p>

                  <p className="text-xs text-emerald-600 mt-1">
                    Your crop is currently <strong>{cropAge} days</strong> old.
                  </p>
                </div>
              </div>
            </div>

            {/* HARVEST AND NEW CROP CYCLE */}
            <div className="mt-4 grid grid-cols-1 xl:grid-cols-2 gap-4">
              <div className="p-4 sm:p-5 rounded-2xl border border-amber-200 bg-amber-50/70">
                <div className="flex items-start gap-3 mb-4">
                  <div className="p-2.5 rounded-xl bg-amber-100 text-amber-700">
                    <CheckCircle2 size={21} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">Harvest Lettuce</h3>
                    <p className="text-xs text-slate-600 mt-1">
                      Save the completed crop cycle without deleting its growth records.
                    </p>
                    <span className={cn(
                      "inline-flex mt-2 px-2.5 py-1 rounded-full text-xs font-bold",
                      cropCycleStatus === "harvested"
                        ? "bg-amber-200 text-amber-900"
                        : "bg-emerald-100 text-emerald-800"
                    )}>
                      {cropCycleStatus === "harvested" ? "Harvest recorded" : "Crop cycle active"}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-2">Harvest Date</label>
                    <input type="date" value={harvestDate} onChange={(e) => setHarvestDate(e.target.value)}
                      className="w-full px-3 py-3 bg-white border border-amber-200 rounded-xl text-sm outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-2">Harvest Quantity (kg)</label>
                    <input type="number" min="0.01" step="0.01" value={harvestQuantity}
                      onChange={(e) => setHarvestQuantity(e.target.value)} placeholder="e.g. 6.5"
                      className="w-full px-3 py-3 bg-white border border-amber-200 rounded-xl text-sm outline-none" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-600 mb-2">Harvest Notes (optional)</label>
                    <input type="text" value={harvestNotes} onChange={(e) => setHarvestNotes(e.target.value)}
                      placeholder="Quality, observations, or other notes"
                      className="w-full px-3 py-3 bg-white border border-amber-200 rounded-xl text-sm outline-none" />
                  </div>
                </div>
                <button onClick={handleHarvestCrop}
                  disabled={harvestingCrop || cropCycleStatus === "harvested"}
                  className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 bg-amber-600 text-white rounded-xl text-sm font-bold hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed">
                  {harvestingCrop ? <Loader2 size={17} className="animate-spin" /> : <CheckCircle2 size={17} />}
                  {cropCycleStatus === "harvested" ? "Harvest Already Recorded" : harvestingCrop ? "Saving Harvest..." : "Record Harvest"}
                </button>
              </div>

              <div className="p-4 sm:p-5 rounded-2xl border border-emerald-200 bg-emerald-50/70">
                <div className="flex items-start gap-3 mb-4">
                  <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-700">
                    <RotateCcw size={21} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">Start New Crop Cycle</h3>
                    <p className="text-xs text-slate-600 mt-1">
                      Use this when the next batch is actually planted. Previous records remain saved.
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-2">New Planting Date</label>
                    <input type="date" value={newCycleDate} onChange={(e) => setNewCycleDate(e.target.value)}
                      className="w-full px-3 py-3 bg-white border border-emerald-200 rounded-xl text-sm outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-2">Initial Height (cm, optional)</label>
                    <input type="number" min="0" step="0.1" value={initialCropHeight}
                      onChange={(e) => setInitialCropHeight(e.target.value)} placeholder="e.g. 0"
                      className="w-full px-3 py-3 bg-white border border-emerald-200 rounded-xl text-sm outline-none" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-600 mb-2">Planting Notes (optional)</label>
                    <input type="text" value={newCycleNotes} onChange={(e) => setNewCycleNotes(e.target.value)}
                      placeholder="Seedling or batch notes"
                      className="w-full px-3 py-3 bg-white border border-emerald-200 rounded-xl text-sm outline-none" />
                  </div>
                </div>
                <button onClick={handleStartNewCropCycle} disabled={startingCropCycle}
                  className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 disabled:opacity-50">
                  {startingCropCycle ? <Loader2 size={17} className="animate-spin" /> : <Sprout size={17} />}
                  {startingCropCycle ? "Starting Cycle..." : "Start New Crop Cycle"}
                </button>
              </div>
            </div>

            {/* HARVEST HISTORY */}
            <div className="mt-4 p-4 sm:p-5 bg-white border border-slate-100 rounded-2xl shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-slate-100 text-slate-700"><History size={20} /></div>
                <div>
                  <h3 className="font-bold text-slate-800">Harvest History</h3>
                  <p className="text-xs text-slate-500 mt-1">Previously recorded crop harvests.</p>
                </div>
              </div>
              {cropHarvests.length === 0 ? (
                <p className="text-sm text-slate-500 py-3">No harvests recorded yet.</p>
              ) : (
                <div className="space-y-3">
                  {cropHarvests.map((harvest) => (
                    <div key={harvest.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <div>
                        <p className="text-sm font-bold text-slate-800">{harvest.cropType || "Crop"} · {harvest.quantityKg} kg</p>
                        <p className="text-xs text-slate-500 mt-1">
                          Harvested {harvest.harvestDate} · {harvest.cropAgeDays} days old
                        </p>
                        {harvest.notes && <p className="text-xs text-slate-500 mt-1">{harvest.notes}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* LAST UPDATED */}

            <div className="mt-3 sm:mt-4 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-3">
                <Calendar size={19} className="text-slate-500" />

                <div>
                  <p className="text-sm font-bold text-slate-700">
                    Configuration Date
                  </p>

                  <p className="text-xs text-slate-500 mt-1">
                    {crop.date || "Not saved yet"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* CROP MEASUREMENTS */}

          <div className="w-[94%] sm:w-[92%] lg:w-full mx-auto bg-white p-4 sm:p-6 lg:p-8 rounded-2xl sm:rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50">
            <div className="flex items-center gap-3 sm:gap-4 mb-7">
              <div className="p-2.5 sm:p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <TrendingUp size={24} />
              </div>

              <div>
                <h2 className="font-display font-bold text-slate-800 text-base sm:text-lg">
                  Crop Growth Measurements
                </h2>

                <p className="text-xs text-slate-400 mt-1">
                  Record plant height to build historical growth data.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-5 sm:mb-6">
              {/* DATE */}

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">
                  Date
                </label>

                <input
                  type="date"
                  value={newCropDate}
                  onChange={(e) => setNewCropDate(e.target.value)}
                  className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                />
              </div>

              {/* HEIGHT */}

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">
                  Plant Height (cm)
                </label>

                <input
                  type="number"
                  min="0"
                  value={newCropHeight}
                  onChange={(e) => setNewCropHeight(e.target.value)}
                  placeholder="e.g. 14"
                  className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                />
              </div>

              {/* NOTES */}

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">
                  Notes
                </label>

                <input
                  type="text"
                  value={newCropNotes}
                  onChange={(e) => setNewCropNotes(e.target.value)}
                  placeholder="Optional"
                  className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                />
              </div>

              {/* BUTTON */}

              <div className="flex items-end">
                <button
                  onClick={handleAddCropMeasurement}
                  disabled={savingCropMeasurement}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 disabled:opacity-50"
                >
                  {savingCropMeasurement ? (
                    <Loader2 size={17} className="animate-spin" />
                  ) : (
                    <Plus size={17} />
                  )}
                  Add Measurement
                </button>
              </div>
            </div>

            {/* CROP LIST */}

            <div className="space-y-3">
              {cropMeasurements.length === 0 ? (
                <div className="p-6 sm:p-8 text-center rounded-2xl bg-slate-50 border border-dashed border-slate-200">
                  <Sprout size={30} className="mx-auto text-slate-300 mb-2" />

                  <p className="text-sm font-bold text-slate-500">
                    No crop measurements yet
                  </p>

                  <p className="text-xs text-slate-400 mt-1">
                    Add your first plant measurement above.
                  </p>
                </div>
              ) : (
                cropMeasurements.map((measurement) => (
                  <div
                    key={measurement.id}
                    className="flex items-center justify-between gap-3 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-50 border border-slate-100"
                  >
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="p-2.5 sm:p-3 bg-white rounded-xl shrink-0 border border-slate-200">
                        <Sprout size={18} className="text-emerald-500" />
                      </div>

                      <div>
                        <p className="text-xs sm:text-sm font-bold text-slate-800">
                          {measurement.height} cm
                        </p>

                        <p className="text-[11px] sm:text-xs text-slate-400 break-words">
                          {measurement.date}

                          {measurement.notes ? ` • ${measurement.notes}` : ""}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() =>
                        handleDeleteCropMeasurement(measurement.id)
                      }
                      className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
