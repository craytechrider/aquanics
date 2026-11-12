import { useEffect, useState } from "react";
import { onValue, ref } from "firebase/database";

import { db } from "../firebase";
import type { SensorConfiguration } from "../app/lib/sensorStatus";

function isConfiguration(value: unknown): value is SensorConfiguration {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function useSensorConfiguration() {
  const [configuration, setConfiguration] =
    useState<SensorConfiguration | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onValue(
      ref(db, "configuration/sensors"),
      (snapshot) => {
        const value: unknown = snapshot.val();
        setConfiguration(isConfiguration(value) ? value : {});
        setError(null);
        setLoading(false);
      },
      (firebaseError) => {
        console.error("Firebase sensor configuration error:", firebaseError);
        setConfiguration(null);
        setError(firebaseError.message);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, []);

  return { configuration, loading, error };
}
