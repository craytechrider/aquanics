const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
const CACHE_DURATION_MS = 12 * 60 * 1000;

interface GeocodingLocation {
  name: string;
  latitude: number;
  longitude: number;
  country_code: string;
  admin1?: string;
  admin2?: string;
  admin3?: string;
}

interface GeocodingResponse {
  results?: GeocodingLocation[];
}

interface ForecastResponse {
  current?: {
    temperature_2m?: number;
    relative_humidity_2m?: number;
    apparent_temperature?: number;
    precipitation?: number;
    weather_code?: number;
    wind_speed_10m?: number;
    is_day?: number;
  };
  daily?: {
    temperature_2m_max?: number[];
    temperature_2m_min?: number[];
    precipitation_probability_max?: Array<number | null>;
    weather_code?: number[];
  };
}

export interface LiveWeather {
  temperature: number;
  humidity: number;
  apparentTemperature: number;
  precipitation: number;
  weatherCode: number;
  windSpeed: number;
  isDay: boolean;
  high: number;
  low: number;
  rainProbability: number | null;
  dailyWeatherCode: number;
}

export interface WeatherSnapshot {
  weather: LiveWeather;
  fetchedAt: number;
  stale: boolean;
}

let locationPromise: Promise<GeocodingLocation> | null = null;
let weatherPromise: Promise<WeatherSnapshot> | null = null;
let cachedSnapshot: WeatherSnapshot | null = null;

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Weather service returned HTTP ${response.status}.`);
  }
  return (await response.json()) as T;
}

async function resolveVictoriaLocation(): Promise<GeocodingLocation> {
  if (!locationPromise) {
    const query = new URLSearchParams({
      name: "Victoria",
      countryCode: "PH",
      count: "20",
      language: "en",
      format: "json",
    });

    locationPromise = fetchJson<GeocodingResponse>(
      `${GEOCODING_URL}?${query.toString()}`,
    )
      .then((response) => {
        const location = response.results?.find(
          (result) =>
            result.name.toLowerCase() === "victoria" &&
            result.country_code === "PH" &&
            result.admin2 === "Oriental Mindoro" &&
            result.admin1 === "Mimaropa",
        );

        if (!location) {
          throw new Error(
            "Open-Meteo could not verify Victoria, Oriental Mindoro.",
          );
        }

        return location;
      })
      .catch((error: unknown) => {
        locationPromise = null;
        throw error;
      });
  }

  return locationPromise;
}

function requireNumber(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`Weather data is missing ${label}.`);
  }
  return value;
}

async function loadWeather(): Promise<WeatherSnapshot> {
  const location = await resolveVictoriaLocation();
  const query = new URLSearchParams({
    latitude: String(location.latitude),
    longitude: String(location.longitude),
    current:
      "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,is_day",
    daily:
      "temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code",
    timezone: "Asia/Manila",
    forecast_days: "1",
  });
  const response = await fetchJson<ForecastResponse>(
    `${FORECAST_URL}?${query.toString()}`,
  );
  const current = response.current;
  const daily = response.daily;

  if (!current || !daily) {
    throw new Error("Open-Meteo returned an incomplete forecast.");
  }

  const snapshot: WeatherSnapshot = {
    weather: {
      temperature: requireNumber(current.temperature_2m, "current temperature"),
      humidity: requireNumber(current.relative_humidity_2m, "humidity"),
      apparentTemperature: requireNumber(
        current.apparent_temperature,
        "apparent temperature",
      ),
      precipitation: requireNumber(current.precipitation, "precipitation"),
      weatherCode: requireNumber(current.weather_code, "weather condition"),
      windSpeed: requireNumber(current.wind_speed_10m, "wind speed"),
      isDay: requireNumber(current.is_day, "day/night status") === 1,
      high: requireNumber(daily.temperature_2m_max?.[0], "today's high"),
      low: requireNumber(daily.temperature_2m_min?.[0], "today's low"),
      rainProbability:
        typeof daily.precipitation_probability_max?.[0] === "number"
          ? daily.precipitation_probability_max[0]
          : null,
      dailyWeatherCode: requireNumber(
        daily.weather_code?.[0],
        "today's forecast condition",
      ),
    },
    fetchedAt: Date.now(),
    stale: false,
  };

  cachedSnapshot = snapshot;
  return snapshot;
}

export async function getLiveWeather(
  forceRefresh = false,
): Promise<WeatherSnapshot> {
  if (
    !forceRefresh &&
    cachedSnapshot &&
    Date.now() - cachedSnapshot.fetchedAt < CACHE_DURATION_MS
  ) {
    return cachedSnapshot;
  }

  if (weatherPromise) return weatherPromise;

  weatherPromise = loadWeather()
    .catch((error: unknown) => {
      if (cachedSnapshot) return { ...cachedSnapshot, stale: true };
      throw error;
    })
    .finally(() => {
      weatherPromise = null;
    });

  return weatherPromise;
}

export function getWeatherCondition(code: number): string {
  if (code === 0) return "Clear sky";
  if (code === 1) return "Mainly clear";
  if (code === 2) return "Partly cloudy";
  if (code === 3) return "Overcast";
  if (code === 45 || code === 48) return "Fog";
  if ([51, 53, 55, 56, 57].includes(code)) return "Drizzle";
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "Rain";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "Snow";
  if ([95, 96, 99].includes(code)) return "Thunderstorm";
  return "Conditions unavailable";
}
