export interface SensorHistoryPoint {
  time: string;
  value: number;
}

export function readSensorHistory(
  history: unknown,
  rangeHours: number,
  limit = 500,
  now = Date.now(),
): SensorHistoryPoint[] {
  if (!history || typeof history !== "object" || limit <= 0) return [];

  const cutoff = now - rangeHours * 60 * 60 * 1000;
  const points: SensorHistoryPoint[] = [];

  for (const date of Object.keys(history).sort()) {
    const readings = (history as Record<string, unknown>)[date];
    if (!readings || typeof readings !== "object") continue;

    for (const time of Object.keys(readings).sort()) {
      const rawValue = (readings as Record<string, unknown>)[time];
      const value =
        typeof rawValue === "number"
          ? rawValue
          : typeof rawValue === "string" && rawValue.trim()
            ? Number(rawValue)
            : Number.NaN;
      if (!Number.isFinite(value)) continue;

      const normalizedTime = time.replace(/-/g, ":");
      const timestamp = new Date(`${date}T${normalizedTime}`).getTime();
      if (!Number.isFinite(timestamp) || timestamp < cutoff || timestamp > now) {
        continue;
      }

      points.push({ time: `${date} ${normalizedTime}`, value });
    }
  }

  if (rangeHours <= 24 * 7) return points.slice(-limit);

  const dailyValues = new Map<string, { total: number; count: number }>();
  for (const point of points) {
    const date = point.time.slice(0, 10);
    const aggregate = dailyValues.get(date) ?? { total: 0, count: 0 };
    aggregate.total += point.value;
    aggregate.count += 1;
    dailyValues.set(date, aggregate);
  }

  return Array.from(dailyValues, ([date, aggregate]) => ({
    time: date,
    value: aggregate.total / aggregate.count,
  })).slice(-limit);
}

export function formatSensorHistoryLabel(value: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const parts = value.split(" ");
    return parts.length > 1 ? parts[1].slice(0, 5) : value;
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(new Date(`${value}T12:00:00`));
}
