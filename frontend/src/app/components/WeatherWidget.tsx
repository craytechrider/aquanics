import { useCallback, useEffect, useState } from "react";
import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  Droplets,
  LoaderCircle,
  MapPin,
  Moon,
  RefreshCw,
  Sun,
  Wind,
} from "lucide-react";
import {
  getLiveWeather,
  getWeatherCondition,
  type LiveWeather,
} from "../lib/weatherService";

const REFRESH_INTERVAL_MS = 12 * 60 * 1000;

function getWeatherIcon(weather: LiveWeather) {
  const code = weather.weatherCode;
  if (code === 0) return weather.isDay ? Sun : Moon;
  if (code === 1 || code === 2) return weather.isDay ? CloudSun : Cloud;
  if (code === 3) return Cloud;
  if (code === 45 || code === 48) return CloudFog;
  if ([51, 53, 55, 56, 57].includes(code)) return CloudDrizzle;
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return CloudRain;
  if ([71, 73, 75, 77, 85, 86].includes(code)) return CloudSnow;
  if ([95, 96, 99].includes(code)) return CloudLightning;
  return Cloud;
}

export default function WeatherWidget() {
  const [weather, setWeather] = useState<LiveWeather | null>(null);
  const [stale, setStale] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async (force = false) => {
    setError("");
    setLoading(true);
    try {
      const snapshot = await getLiveWeather(force);
      setWeather(snapshot.weather);
      setStale(snapshot.stale);
    } catch (requestError: unknown) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Weather information is unavailable.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const intervalId = window.setInterval(
      () => void refresh(true),
      REFRESH_INTERVAL_MS,
    );
    return () => window.clearInterval(intervalId);
  }, [refresh]);

  const WeatherIcon = weather ? getWeatherIcon(weather) : CloudSun;

  return (
    <section
      aria-label="Local weather"
      aria-live="polite"
      className="w-full rounded-2xl border border-emerald-100 bg-white/95 p-3 shadow-sm sm:p-4 md:w-auto md:min-w-[340px] md:max-w-[430px]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            {loading && !weather ? (
              <LoaderCircle size={20} className="animate-spin" />
            ) : (
              <WeatherIcon size={21} />
            )}
          </div>
          <div className="min-w-0">
            <p className="flex items-center gap-1 text-xs font-bold text-slate-800">
              <MapPin size={12} className="shrink-0 text-emerald-600" />
              <span className="truncate">Leido, Victoria</span>
            </p>
            <p className="mt-0.5 truncate text-[11px] text-slate-500">
              {weather ? getWeatherCondition(weather.weatherCode) : "Live weather"}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void refresh(true)}
          disabled={loading}
          aria-label="Refresh weather"
          className="rounded-lg p-1.5 text-slate-400 transition hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {weather ? (
        <div className="mt-2.5 flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold leading-none tracking-tight text-slate-900">
              {Math.round(weather.temperature)}°
            </span>
            <span className="text-xs font-semibold text-slate-500">C</span>
            <span className="text-[11px] text-slate-500">
              H {Math.round(weather.high)}° · L {Math.round(weather.low)}°
            </span>
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] font-medium text-slate-500">
            <span className="inline-flex items-center gap-1">
              <Droplets size={12} className="text-cyan-600" />
              {Math.round(weather.humidity)}%
            </span>
            <span className="inline-flex items-center gap-1">
              <Wind size={12} className="text-emerald-700" />
              {Math.round(weather.windSpeed)} km/h
            </span>
            {weather.rainProbability !== null && (
              <span className="inline-flex items-center gap-1">
                <CloudRain size={12} className="text-blue-600" />
                {Math.round(weather.rainProbability)}% rain
              </span>
            )}
          </div>
        </div>
      ) : loading ? (
        <p className="mt-2 text-xs text-slate-500">Loading current conditions...</p>
      ) : (
        <p role="status" className="mt-2 text-xs text-amber-700">
          {error || "Weather information is unavailable."}
        </p>
      )}

      {weather && stale && (
        <p className="mt-2 text-[10px] text-amber-700">
          Showing the last available weather update.
        </p>
      )}
      {weather && error && (
        <p className="mt-2 text-[10px] text-amber-700">
          Refresh failed; showing the last available update.
        </p>
      )}
    </section>
  );
}
