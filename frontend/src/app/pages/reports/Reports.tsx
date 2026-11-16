import { useEffect, useMemo, useRef, useState } from "react";
import {
  Download,
  FileText,
  Calendar,
  Filter,
  Loader2,
  X,
  BarChart3,
  RefreshCw,
  Sprout,
  Fish,
  Activity,
} from "lucide-react";
import { get, ref } from "firebase/database";

import { Modal } from "../../components/ui/Modal";
import { db } from "../../../firebase";
import { cn } from "../../lib/utils";

// ============================================================
// TYPES
// ============================================================

type ReportFormat = "PDF" | "CSV";
type DateMode = "single" | "range";
type ReportType = "Sensors" | "Crop" | "Fish";

// ============================================================
// SENSOR TYPES
// ============================================================

interface SensorReading {
  date: string;
  time: string;

  ph: number | null;
  phVoltage: number | null;

  waterTemp: number | null;

  waterLevel: number | null;
  waterPercent: number | null;

  distance: number | null;

  batteryVoltage: number | null;
  currentDraw: number | null;
}

interface SensorSummary {
  average: number | null;
  minimum: number | null;
  maximum: number | null;
}

interface SensorReportData {
  reportType: "Sensors";

  readings: SensorReading[];

  startDate: string;
  endDate: string;

  summaries: {
    ph: SensorSummary;
    phVoltage: SensorSummary;
    waterTemp: SensorSummary;
    waterLevel: SensorSummary;
    waterPercent: SensorSummary;
    distance: SensorSummary;
    batteryVoltage: SensorSummary;
    currentDraw: SensorSummary;
  };
}

// ============================================================
// CROP TYPES
// ============================================================

interface CropConfiguration {
  ageDays: number | null;
  plantingDate: string;
  targetYield: number | null;
  type: string;
}

interface CropGrowthMeasurement {
  id: string;
  date: string;
  height: number | null;
  notes: string;
  createdAt: string;
}

interface CropReportData {
  reportType: "Crop";

  startDate: string;
  endDate: string;

  configuration: CropConfiguration;

  measurements: CropGrowthMeasurement[];

  summary: {
    averageHeight: number | null;
    minimumHeight: number | null;
    maximumHeight: number | null;
  };
}

// ============================================================
// FISH TYPES
// ============================================================

interface FishConfiguration {
  ageWeeks: number | null;
  species: string;
  startingWeight: number | null;
  targetWeight: number | null;
}

interface FishGrowthMeasurement {
  id: string;
  date: string;
  averageWeight: number | null;
  notes: string;
  createdAt: string;
}

interface FishReportData {
  reportType: "Fish";

  startDate: string;
  endDate: string;

  configuration: FishConfiguration;

  measurements: FishGrowthMeasurement[];

  summary: {
    averageWeight: number | null;
    minimumWeight: number | null;
    maximumWeight: number | null;
  };
}

// ============================================================
// UNION REPORT TYPE
// ============================================================

type ReportData = SensorReportData | CropReportData | FishReportData;

interface GeneratedReport {
  id: number;
  name: string;
  type: ReportFormat;
  reportType: ReportType;
  date_label: string;
  data: ReportData;
}

// ============================================================
// FIREBASE SENSOR PATHS
// ============================================================

const SENSOR_NAMES = [
  "ph",
  "phVoltage",
  "waterTemp",
  "waterLevel",
  "waterPercent",
  "distance",
  "batteryVoltage",
  "currentDraw",
] as const;

// ============================================================
// HELPERS
// ============================================================

function sanitizeFileName(value: string) {
  const sanitized = value
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "")
    .trim()
    .replace(/\s+/g, "_");

  return sanitized || "aquanics_report";
}

function triggerFileDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 250);
}

function escapeCsvValue(value: string) {
  const escaped = value.replace(/"/g, '""');

  return /[",\r\n]/.test(value) ? `"${escaped}"` : escaped;
}

function formatNumber(value: number | null, decimals = 2) {
  if (value === null || !Number.isFinite(value)) {
    return "—";
  }

  return value.toFixed(decimals);
}

function parseFirebaseNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);

    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

function parseFirebaseString(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  if (value === null || value === undefined) {
    return "";
  }

  return String(value);
}

// ============================================================
// DATE HELPERS
// ============================================================

function getTodayString() {
  const dateParts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const parts = Object.fromEntries(
    dateParts.map(({ type, value }) => [type, value]),
  );

  return `${parts.year}-${parts.month}-${parts.day}`;
}

function addDays(dateString: string, amount: number) {
  const date = new Date(`${dateString}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
}

function isValidDateString(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const parsed = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function getDatesBetween(startDate: string, endDate: string) {
  const dates: string[] = [];

  let current = startDate;

  while (current <= endDate) {
    dates.push(current);

    current = addDays(current, 1);
  }

  return dates;
}

function formatDateForDisplay(date: string) {
  if (!date) {
    return "—";
  }

  const parts = date.split("-");

  if (parts.length !== 3) {
    return date;
  }

  const [year, month, day] = parts;

  const parsed = new Date(Number(year), Number(month) - 1, Number(day));

  return parsed.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// ============================================================
// GENERIC SUMMARY
// ============================================================

function calculateNumberSummary(values: Array<number | null>): SensorSummary {
  const validValues = values.filter(
    (value): value is number =>
      typeof value === "number" && Number.isFinite(value),
  );

  if (validValues.length === 0) {
    return {
      average: null,
      minimum: null,
      maximum: null,
    };
  }

  const total = validValues.reduce((sum, value) => sum + value, 0);

  return {
    average: total / validValues.length,
    minimum: Math.min(...validValues),
    maximum: Math.max(...validValues),
  };
}

// ============================================================
// FIREBASE SENSOR FETCH
// ============================================================

async function fetchSensorDataForDate(date: string): Promise<SensorReading[]> {
  const sensorResults: Record<string, Record<string, unknown>> = {};

  await Promise.all(
    SENSOR_NAMES.map(async (sensorName) => {
      const sensorRef = ref(db, `/sensors/${sensorName}/${date}`);

      const snapshot = await get(sensorRef);

      if (snapshot.exists()) {
        sensorResults[sensorName] = snapshot.val() || {};
      } else {
        sensorResults[sensorName] = {};
      }
    }),
  );

  const timestamps = new Set<string>();

  SENSOR_NAMES.forEach((sensorName) => {
    const sensorData = sensorResults[sensorName] || {};

    Object.keys(sensorData).forEach((time) => {
      timestamps.add(time);
    });
  });

  const sortedTimes = Array.from(timestamps).sort();

  return sortedTimes
    .map((time) => ({
      date,
      time,

      ph: parseFirebaseNumber(sensorResults.ph?.[time]),

      phVoltage: parseFirebaseNumber(sensorResults.phVoltage?.[time]),

      waterTemp: parseFirebaseNumber(sensorResults.waterTemp?.[time]),

      waterLevel: parseFirebaseNumber(sensorResults.waterLevel?.[time]),

      waterPercent: parseFirebaseNumber(sensorResults.waterPercent?.[time]),

      distance: parseFirebaseNumber(sensorResults.distance?.[time]),

      batteryVoltage: parseFirebaseNumber(sensorResults.batteryVoltage?.[time]),

      currentDraw: parseFirebaseNumber(sensorResults.currentDraw?.[time]),
    }))
    .filter((reading) =>
      SENSOR_NAMES.some((sensorName) => reading[sensorName] !== null),
    );
}

// ============================================================
// FETCH SENSOR REPORT
// ============================================================

async function fetchSensorReportData(
  startDate: string,
  endDate: string,
): Promise<SensorReportData> {
  const dates = getDatesBetween(startDate, endDate);

  const results = await Promise.all(
    dates.map((date) => fetchSensorDataForDate(date)),
  );

  const readings = results.flat().sort((a, b) => {
    const first = `${a.date} ${a.time}`;

    const second = `${b.date} ${b.time}`;

    return first.localeCompare(second);
  });

  return {
    reportType: "Sensors",

    readings,

    startDate,
    endDate,

    summaries: {
      ph: calculateNumberSummary(readings.map((item) => item.ph)),

      phVoltage: calculateNumberSummary(readings.map((item) => item.phVoltage)),

      waterTemp: calculateNumberSummary(readings.map((item) => item.waterTemp)),

      waterLevel: calculateNumberSummary(
        readings.map((item) => item.waterLevel),
      ),

      waterPercent: calculateNumberSummary(
        readings.map((item) => item.waterPercent),
      ),

      distance: calculateNumberSummary(readings.map((item) => item.distance)),

      batteryVoltage: calculateNumberSummary(
        readings.map((item) => item.batteryVoltage),
      ),

      currentDraw: calculateNumberSummary(
        readings.map((item) => item.currentDraw),
      ),
    },
  };
}

// ============================================================
// CROP CONFIGURATION
// ============================================================

async function fetchCropConfiguration(): Promise<CropConfiguration> {
  const snapshot = await get(ref(db, "/configuration/crop"));

  const value = snapshot.exists() ? snapshot.val() || {} : {};

  return {
    ageDays: parseFirebaseNumber(value.ageDays),

    plantingDate: parseFirebaseString(value.plantingDate),

    targetYield: parseFirebaseNumber(value.targetYield),

    type: parseFirebaseString(value.type),
  };
}

// ============================================================
// CROP GROWTH
// ============================================================

async function fetchCropGrowthMeasurements(
  startDate: string,
  endDate: string,
): Promise<CropGrowthMeasurement[]> {
  const snapshot = await get(ref(db, "/growthMeasurements/crop"));

  if (!snapshot.exists()) {
    return [];
  }

  const data = snapshot.val() || {};

  const measurements: CropGrowthMeasurement[] = [];

  Object.entries(data).forEach(([id, rawValue]) => {
    const value =
      rawValue && typeof rawValue === "object"
        ? (rawValue as Record<string, unknown>)
        : {};

    const date = parseFirebaseString(value.date);

    if (!date) {
      return;
    }

    if (date < startDate || date > endDate) {
      return;
    }

    measurements.push({
      id,

      date,

      height: parseFirebaseNumber(value.height ?? value.heightCm),

      notes: parseFirebaseString(value.notes),

      createdAt: parseFirebaseString(value.createdAt),
    });
  });

  measurements.sort((a, b) => {
    const first = `${a.date} ${a.createdAt}`;

    const second = `${b.date} ${b.createdAt}`;

    return first.localeCompare(second);
  });

  return measurements;
}

// ============================================================
// FETCH CROP REPORT
// ============================================================

async function fetchCropReportData(
  startDate: string,
  endDate: string,
): Promise<CropReportData> {
  const [configuration, measurements] = await Promise.all([
    fetchCropConfiguration(),

    fetchCropGrowthMeasurements(startDate, endDate),
  ]);

  const heights = measurements.map((item) => item.height);

  const summary = calculateNumberSummary(heights);

  return {
    reportType: "Crop",

    startDate,
    endDate,

    configuration,

    measurements,

    summary: {
      averageHeight: summary.average,
      minimumHeight: summary.minimum,
      maximumHeight: summary.maximum,
    },
  };
}

// ============================================================
// FISH CONFIGURATION
// ============================================================

async function fetchFishConfiguration(): Promise<FishConfiguration> {
  const snapshot = await get(ref(db, "/configuration/fish"));

  const value = snapshot.exists() ? snapshot.val() || {} : {};

  return {
    ageWeeks: parseFirebaseNumber(value.ageWeeks),

    species: parseFirebaseString(value.species),

    startingWeight: parseFirebaseNumber(value.startingWeight),

    targetWeight: parseFirebaseNumber(value.targetWeight),
  };
}

// ============================================================
// FISH GROWTH
// ============================================================

async function fetchFishGrowthMeasurements(
  startDate: string,
  endDate: string,
): Promise<FishGrowthMeasurement[]> {
  const snapshot = await get(ref(db, "/growthMeasurements/fish"));

  if (!snapshot.exists()) {
    return [];
  }

  const data = snapshot.val() || {};

  const measurements: FishGrowthMeasurement[] = [];

  Object.entries(data).forEach(([id, rawValue]) => {
    const value =
      rawValue && typeof rawValue === "object"
        ? (rawValue as Record<string, unknown>)
        : {};

    const date = parseFirebaseString(value.date);

    if (!date) {
      return;
    }

    if (date < startDate || date > endDate) {
      return;
    }

    measurements.push({
      id,

      date,

      averageWeight: parseFirebaseNumber(value.averageWeight),

      notes: parseFirebaseString(value.notes),

      createdAt: parseFirebaseString(value.createdAt),
    });
  });

  measurements.sort((a, b) => {
    const first = `${a.date} ${a.createdAt}`;

    const second = `${b.date} ${b.createdAt}`;

    return first.localeCompare(second);
  });

  return measurements;
}

// ============================================================
// FETCH FISH REPORT
// ============================================================

async function fetchFishReportData(
  startDate: string,
  endDate: string,
): Promise<FishReportData> {
  const [configuration, measurements] = await Promise.all([
    fetchFishConfiguration(),

    fetchFishGrowthMeasurements(startDate, endDate),
  ]);

  const weights = measurements.map((item) => item.averageWeight);

  const summary = calculateNumberSummary(weights);

  return {
    reportType: "Fish",

    startDate,
    endDate,

    configuration,

    measurements,

    summary: {
      averageWeight: summary.average,
      minimumWeight: summary.minimum,
      maximumWeight: summary.maximum,
    },
  };
}

// ============================================================
// LOAD REPORT BY TYPE
// ============================================================

async function fetchReportData(
  reportType: ReportType,
  startDate: string,
  endDate: string,
): Promise<ReportData> {
  if (reportType === "Sensors") {
    return fetchSensorReportData(startDate, endDate);
  }

  if (reportType === "Crop") {
    return fetchCropReportData(startDate, endDate);
  }

  return fetchFishReportData(startDate, endDate);
}

// ============================================================
// CSV - SENSOR
// ============================================================

function buildSensorCsvBlob(data: SensorReportData) {
  const generatedAt = new Date().toLocaleString();

  const rows: string[][] = [];

  rows.push(["Aquanics Sensor Monitoring Report"]);

  rows.push([]);

  rows.push(["Report Type", "Sensors"]);

  rows.push(["Start Date", data.startDate]);

  rows.push(["End Date", data.endDate]);

  rows.push(["Generated At", generatedAt]);

  rows.push(["Total Readings", String(data.readings.length)]);

  rows.push([]);

  rows.push(["SUMMARY"]);

  rows.push(["Sensor", "Average", "Minimum", "Maximum"]);

  const summaryRows: Array<[string, SensorSummary]> = [
    ["pH", data.summaries.ph],

    ["pH Voltage (V)", data.summaries.phVoltage],

    ["Water Temperature (°C)", data.summaries.waterTemp],

    ["Water Level (cm)", data.summaries.waterLevel],

    ["Water Percentage (%)", data.summaries.waterPercent],

    ["Distance (cm)", data.summaries.distance],

    ["Battery Voltage (V)", data.summaries.batteryVoltage],

    ["Current Draw (A)", data.summaries.currentDraw],
  ];

  summaryRows.forEach(([name, summary]) => {
    rows.push([
      name,

      formatNumber(summary.average),

      formatNumber(summary.minimum),

      formatNumber(summary.maximum),
    ]);
  });

  rows.push([]);

  rows.push(["READINGS"]);

  rows.push([
    "Date",
    "Time",
    "pH",
    "pH Voltage (V)",
    "Water Temperature (°C)",
    "Water Level (cm)",
    "Water Percentage (%)",
    "Distance (cm)",
    "Battery Voltage (V)",
    "Current Draw (A)",
  ]);

  data.readings.forEach((reading) => {
    rows.push([
      reading.date,

      reading.time,

      formatNumber(reading.ph),

      formatNumber(reading.phVoltage, 4),

      formatNumber(reading.waterTemp),

      formatNumber(reading.waterLevel),

      formatNumber(reading.waterPercent),

      formatNumber(reading.distance),

      formatNumber(reading.batteryVoltage),

      formatNumber(reading.currentDraw),
    ]);
  });

  const content = rows
    .map((row) => row.map((cell) => escapeCsvValue(String(cell))).join(","))
    .join("\r\n");

  return new Blob(["\uFEFF", content], {
    type: "text/csv;charset=utf-8;",
  });
}

// ============================================================
// CSV - CROP
// ============================================================

function buildCropCsvBlob(data: CropReportData) {
  const generatedAt = new Date().toLocaleString();

  const rows: string[][] = [];

  rows.push(["Aquanics Crop Growth Report"]);

  rows.push([]);

  rows.push(["Report Type", "Crop"]);

  rows.push(["Start Date", data.startDate]);

  rows.push(["End Date", data.endDate]);

  rows.push(["Generated At", generatedAt]);

  rows.push([]);

  rows.push(["CROP CONFIGURATION"]);

  rows.push(["Crop Type", data.configuration.type || "—"]);

  rows.push(["Age (Days)", formatNumber(data.configuration.ageDays, 0)]);

  rows.push(["Planting Date", data.configuration.plantingDate || "—"]);

  rows.push(["Target Yield", formatNumber(data.configuration.targetYield)]);

  rows.push([]);

  rows.push(["GROWTH SUMMARY"]);

  rows.push(["Average Height", formatNumber(data.summary.averageHeight)]);

  rows.push(["Minimum Height", formatNumber(data.summary.minimumHeight)]);

  rows.push(["Maximum Height", formatNumber(data.summary.maximumHeight)]);

  rows.push(["Total Measurements", String(data.measurements.length)]);

  rows.push([]);

  rows.push(["GROWTH MEASUREMENTS"]);

  rows.push(["Date", "Height", "Notes", "Created At"]);

  data.measurements.forEach((measurement) => {
    rows.push([
      measurement.date,

      formatNumber(measurement.height),

      measurement.notes,

      measurement.createdAt,
    ]);
  });

  const content = rows
    .map((row) => row.map((cell) => escapeCsvValue(String(cell))).join(","))
    .join("\r\n");

  return new Blob(["\uFEFF", content], {
    type: "text/csv;charset=utf-8;",
  });
}

// ============================================================
// CSV - FISH
// ============================================================

function buildFishCsvBlob(data: FishReportData) {
  const generatedAt = new Date().toLocaleString();

  const rows: string[][] = [];

  rows.push(["Aquanics Fish Growth Report"]);

  rows.push([]);

  rows.push(["Report Type", "Fish"]);

  rows.push(["Start Date", data.startDate]);

  rows.push(["End Date", data.endDate]);

  rows.push(["Generated At", generatedAt]);

  rows.push([]);

  rows.push(["FISH CONFIGURATION"]);

  rows.push(["Species", data.configuration.species || "—"]);

  rows.push(["Age (Weeks)", formatNumber(data.configuration.ageWeeks, 0)]);

  rows.push([
    "Starting Weight",
    formatNumber(data.configuration.startingWeight),
  ]);

  rows.push(["Target Weight", formatNumber(data.configuration.targetWeight)]);

  rows.push([]);

  rows.push(["GROWTH SUMMARY"]);

  rows.push(["Average Weight", formatNumber(data.summary.averageWeight)]);

  rows.push(["Minimum Weight", formatNumber(data.summary.minimumWeight)]);

  rows.push(["Maximum Weight", formatNumber(data.summary.maximumWeight)]);

  rows.push(["Total Measurements", String(data.measurements.length)]);

  rows.push([]);

  rows.push(["GROWTH MEASUREMENTS"]);

  rows.push(["Date", "Average Weight", "Notes", "Created At"]);

  data.measurements.forEach((measurement) => {
    rows.push([
      measurement.date,

      formatNumber(measurement.averageWeight),

      measurement.notes,

      measurement.createdAt,
    ]);
  });

  const content = rows
    .map((row) => row.map((cell) => escapeCsvValue(String(cell))).join(","))
    .join("\r\n");

  return new Blob(["\uFEFF", content], {
    type: "text/csv;charset=utf-8;",
  });
}

// ============================================================
// PDF HELPERS
// ============================================================

function pdfSafeText(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E]/g, "?")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function pdfEscapeLiteral(value: string) {
  return pdfSafeText(value);
}

function createPdfContent(lines: string[]) {
  const commands: string[] = [];

  commands.push("BT");

  commands.push("/F1 9 Tf");

  commands.push("12 TL");

  commands.push("40 760 Td");

  lines.forEach((line, index) => {
    if (index === 0) {
      commands.push(`(${pdfEscapeLiteral(line)}) Tj`);
    } else {
      commands.push("T*");

      commands.push(`(${pdfEscapeLiteral(line)}) Tj`);
    }
  });

  commands.push("ET");

  return commands.join("\n");
}

function createPdfDocument(pages: string[][]) {
  const encoder = new TextEncoder();

  const objects: string[] = [];

  objects.push(
    `1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
`,
  );

  const fontObjectNumber = 3;

  const firstPageObject = 4;

  const pageObjectNumbers = pages.map(
    (_, index) => firstPageObject + index * 2,
  );

  const pagesKids = pageObjectNumbers
    .map((number) => `${number} 0 R`)
    .join(" ");

  objects.push(
    `2 0 obj
<<
/Type /Pages
/Kids [${pagesKids}]
/Count ${pages.length}
>>
endobj
`,
  );

  objects.push(
    `3 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Courier
>>
endobj
`,
  );

  pages.forEach((lines, index) => {
    const pageObject = pageObjectNumbers[index];

    const contentObject = pageObject + 1;

    const content = createPdfContent(lines);

    const contentLength = encoder.encode(content).length;

    objects.push(
      `${pageObject} 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Resources <<
/Font <<
/F1 ${fontObjectNumber} 0 R
>>
>>
/Contents ${contentObject} 0 R
>>
endobj
`,
    );

    objects.push(
      `${contentObject} 0 obj
<<
/Length ${contentLength}
>>
stream
${content}
endstream
endobj
`,
    );
  });

  let body = "%PDF-1.4\n";

  const offsets: number[] = [];

  objects.forEach((object) => {
    offsets.push(encoder.encode(body).length);

    body += object;
  });

  const xrefOffset = encoder.encode(body).length;

  body += `xref\n` + `0 ${objects.length + 1}\n`;

  body += "0000000000 65535 f \n";

  offsets.forEach((offset) => {
    body += `${offset.toString().padStart(10, "0")} 00000 n \n`;
  });

  body +=
    `trailer\n` +
    `<<\n` +
    `/Size ${objects.length + 1}\n` +
    `/Root 1 0 R\n` +
    `>>\n` +
    `startxref\n` +
    `${xrefOffset}\n` +
    `%%EOF`;

  return new Blob([body], {
    type: "application/pdf",
  });
}

// ============================================================
// PDF - SENSORS
// ============================================================

function buildSensorPdfBlob(data: SensorReportData) {
  const generatedAt = new Date().toLocaleString();

  const pages: string[][] = [];

  const summaryLines: string[] = [];

  summaryLines.push("AQUANICS SENSOR MONITORING REPORT");

  summaryLines.push("==============================================");

  summaryLines.push(`Date range: ${data.startDate} to ${data.endDate}`);

  summaryLines.push(`Generated: ${generatedAt}`);

  summaryLines.push(`Total readings: ${data.readings.length}`);

  summaryLines.push("");

  summaryLines.push("SENSOR SUMMARY");

  summaryLines.push("----------------------------------------------");

  summaryLines.push(
    `pH Average       : ${formatNumber(data.summaries.ph.average)}`,
  );

  summaryLines.push(
    `pH Minimum       : ${formatNumber(data.summaries.ph.minimum)}`,
  );

  summaryLines.push(
    `pH Maximum       : ${formatNumber(data.summaries.ph.maximum)}`,
  );

  summaryLines.push("");

  summaryLines.push(
    `pH Voltage Avg   : ${formatNumber(data.summaries.phVoltage.average, 4)} V`,
  );

  summaryLines.push(
    `pH Voltage Min   : ${formatNumber(data.summaries.phVoltage.minimum, 4)} V`,
  );

  summaryLines.push(
    `pH Voltage Max   : ${formatNumber(data.summaries.phVoltage.maximum, 4)} V`,
  );

  summaryLines.push("");

  summaryLines.push(
    `Temperature Avg  : ${formatNumber(data.summaries.waterTemp.average)} C`,
  );

  summaryLines.push(
    `Temperature Min  : ${formatNumber(data.summaries.waterTemp.minimum)} C`,
  );

  summaryLines.push(
    `Temperature Max  : ${formatNumber(data.summaries.waterTemp.maximum)} C`,
  );

  summaryLines.push("");

  summaryLines.push(
    `Water Level Avg  : ${formatNumber(data.summaries.waterLevel.average)} cm`,
  );

  summaryLines.push(
    `Water Level Min  : ${formatNumber(data.summaries.waterLevel.minimum)} cm`,
  );

  summaryLines.push(
    `Water Level Max  : ${formatNumber(data.summaries.waterLevel.maximum)} cm`,
  );

  summaryLines.push("");

  summaryLines.push(
    `Water % Avg      : ${formatNumber(data.summaries.waterPercent.average)} %`,
  );

  summaryLines.push(
    `Water % Min      : ${formatNumber(data.summaries.waterPercent.minimum)} %`,
  );

  summaryLines.push(
    `Water % Max      : ${formatNumber(data.summaries.waterPercent.maximum)} %`,
  );

  summaryLines.push("");

  summaryLines.push(
    `Distance Avg     : ${formatNumber(data.summaries.distance.average)} cm`,
  );

  summaryLines.push(
    `Distance Min     : ${formatNumber(data.summaries.distance.minimum)} cm`,
  );

  summaryLines.push(
    `Distance Max     : ${formatNumber(data.summaries.distance.maximum)} cm`,
  );

  summaryLines.push("");

  summaryLines.push(
    `Battery Avg      : ${formatNumber(
      data.summaries.batteryVoltage.average,
    )} V`,
  );

  summaryLines.push(
    `Battery Min      : ${formatNumber(
      data.summaries.batteryVoltage.minimum,
    )} V`,
  );

  summaryLines.push(
    `Battery Max      : ${formatNumber(
      data.summaries.batteryVoltage.maximum,
    )} V`,
  );

  summaryLines.push("");

  summaryLines.push(
    `Current Avg      : ${formatNumber(data.summaries.currentDraw.average)} A`,
  );

  summaryLines.push(
    `Current Min      : ${formatNumber(data.summaries.currentDraw.minimum)} A`,
  );

  summaryLines.push(
    `Current Max      : ${formatNumber(data.summaries.currentDraw.maximum)} A`,
  );

  pages.push(summaryLines);

  const readingsPerPage = 40;

  for (let i = 0; i < data.readings.length; i += readingsPerPage) {
    const chunk = data.readings.slice(i, i + readingsPerPage);

    const lines: string[] = [];

    lines.push("AQUANICS SENSOR READINGS");

    lines.push("==============================================");

    lines.push(`Range: ${data.startDate} to ${data.endDate}`);

    lines.push("");

    lines.push("Date       Time       pH    Temp  Level  Water%");

    lines.push("---------- -------- ------ ------ ------ -------");

    chunk.forEach((reading) => {
      const date = reading.date.padEnd(10, " ");

      const time = reading.time.padEnd(8, " ");

      const ph = formatNumber(reading.ph).padStart(6, " ");

      const temp = formatNumber(reading.waterTemp).padStart(6, " ");

      const level = formatNumber(reading.waterLevel).padStart(6, " ");

      const percent = formatNumber(reading.waterPercent).padStart(7, " ");

      lines.push(`${date} ${time} ${ph} ${temp} ${level} ${percent}`);
    });

    pages.push(lines);
  }

  return createPdfDocument(pages);
}

// ============================================================
// PDF - CROP
// ============================================================

function buildCropPdfBlob(data: CropReportData) {
  const generatedAt = new Date().toLocaleString();

  const pages: string[][] = [];

  const summaryLines: string[] = [];

  summaryLines.push("AQUANICS CROP GROWTH REPORT");

  summaryLines.push("==============================================");

  summaryLines.push(`Date range: ${data.startDate} to ${data.endDate}`);

  summaryLines.push(`Generated: ${generatedAt}`);

  summaryLines.push("");

  summaryLines.push("CROP CONFIGURATION");

  summaryLines.push("----------------------------------------------");

  summaryLines.push(`Crop Type       : ${data.configuration.type || "—"}`);

  summaryLines.push(
    `Age (Days)      : ${formatNumber(data.configuration.ageDays, 0)}`,
  );

  summaryLines.push(
    `Planting Date   : ${data.configuration.plantingDate || "—"}`,
  );

  summaryLines.push(
    `Target Yield    : ${formatNumber(data.configuration.targetYield)}`,
  );

  summaryLines.push("");

  summaryLines.push("GROWTH SUMMARY");

  summaryLines.push("----------------------------------------------");

  summaryLines.push(
    `Average Height  : ${formatNumber(data.summary.averageHeight)}`,
  );

  summaryLines.push(
    `Minimum Height  : ${formatNumber(data.summary.minimumHeight)}`,
  );

  summaryLines.push(
    `Maximum Height  : ${formatNumber(data.summary.maximumHeight)}`,
  );

  summaryLines.push(`Measurements    : ${data.measurements.length}`);

  pages.push(summaryLines);

  const measurementsPerPage = 35;

  for (let i = 0; i < data.measurements.length; i += measurementsPerPage) {
    const chunk = data.measurements.slice(i, i + measurementsPerPage);

    const lines: string[] = [];

    lines.push("AQUANICS CROP GROWTH MEASUREMENTS");

    lines.push("==============================================");

    lines.push("");

    lines.push("Date       Height   Notes");

    lines.push("---------- -------- -------------------------");

    chunk.forEach((measurement) => {
      const date = measurement.date.padEnd(10, " ");

      const height = formatNumber(measurement.height).padStart(8, " ");

      const notes = measurement.notes.replace(/\r?\n/g, " ").slice(0, 25);

      lines.push(`${date} ${height} ${notes}`);
    });

    pages.push(lines);
  }

  return createPdfDocument(pages);
}

// ============================================================
// PDF - FISH
// ============================================================

function buildFishPdfBlob(data: FishReportData) {
  const generatedAt = new Date().toLocaleString();

  const pages: string[][] = [];

  const summaryLines: string[] = [];

  summaryLines.push("AQUANICS FISH GROWTH REPORT");

  summaryLines.push("==============================================");

  summaryLines.push(`Date range: ${data.startDate} to ${data.endDate}`);

  summaryLines.push(`Generated: ${generatedAt}`);

  summaryLines.push("");

  summaryLines.push("FISH CONFIGURATION");

  summaryLines.push("----------------------------------------------");

  summaryLines.push(`Species         : ${data.configuration.species || "—"}`);

  summaryLines.push(
    `Age (Weeks)     : ${formatNumber(data.configuration.ageWeeks, 0)}`,
  );

  summaryLines.push(
    `Starting Weight : ${formatNumber(data.configuration.startingWeight)}`,
  );

  summaryLines.push(
    `Target Weight   : ${formatNumber(data.configuration.targetWeight)}`,
  );

  summaryLines.push("");

  summaryLines.push("GROWTH SUMMARY");

  summaryLines.push("----------------------------------------------");

  summaryLines.push(
    `Average Weight  : ${formatNumber(data.summary.averageWeight)}`,
  );

  summaryLines.push(
    `Minimum Weight  : ${formatNumber(data.summary.minimumWeight)}`,
  );

  summaryLines.push(
    `Maximum Weight  : ${formatNumber(data.summary.maximumWeight)}`,
  );

  summaryLines.push(`Measurements    : ${data.measurements.length}`);

  pages.push(summaryLines);

  const measurementsPerPage = 35;

  for (let i = 0; i < data.measurements.length; i += measurementsPerPage) {
    const chunk = data.measurements.slice(i, i + measurementsPerPage);

    const lines: string[] = [];

    lines.push("AQUANICS FISH GROWTH MEASUREMENTS");

    lines.push("==============================================");

    lines.push("");

    lines.push("Date       Avg Weight   Notes");

    lines.push("---------- ------------ ---------------------");

    chunk.forEach((measurement) => {
      const date = measurement.date.padEnd(10, " ");

      const weight = formatNumber(measurement.averageWeight).padStart(12, " ");

      const notes = measurement.notes.replace(/\r?\n/g, " ").slice(0, 21);

      lines.push(`${date} ${weight} ${notes}`);
    });

    pages.push(lines);
  }

  return createPdfDocument(pages);
}

// ============================================================
// BUILD CSV
// ============================================================

function buildCsvBlob(report: GeneratedReport) {
  if (report.data.reportType === "Sensors") {
    return buildSensorCsvBlob(report.data);
  }

  if (report.data.reportType === "Crop") {
    return buildCropCsvBlob(report.data);
  }

  return buildFishCsvBlob(report.data);
}

// ============================================================
// BUILD PDF
// ============================================================

function buildPdfBlob(report: GeneratedReport) {
  if (report.data.reportType === "Sensors") {
    return buildSensorPdfBlob(report.data);
  }

  if (report.data.reportType === "Crop") {
    return buildCropPdfBlob(report.data);
  }

  return buildFishPdfBlob(report.data);
}

// ============================================================
// DOWNLOAD
// ============================================================

function downloadReportFile(report: GeneratedReport, format: ReportFormat) {
  const extension = format.toLowerCase();

  const fileName = `${sanitizeFileName(report.name)}.${extension}`;

  const blob = format === "CSV" ? buildCsvBlob(report) : buildPdfBlob(report);

  triggerFileDownload(blob, fileName);
}

// ============================================================
// COMPONENT
// ============================================================

export default function Reports() {
  const today = getTodayString();

  // ==========================================================
  // REPORT TYPE
  // ==========================================================

  const [reportType, setReportType] = useState<ReportType>("Sensors");

  // ==========================================================
  // DATE FILTER
  // ==========================================================

  const [dateMode, setDateMode] = useState<DateMode>("single");

  const [selectedDate, setSelectedDate] = useState(today);

  const [startDate, setStartDate] = useState(today);

  const [endDate, setEndDate] = useState(today);

  // ==========================================================
  // DATA
  // ==========================================================

  const [reportData, setReportData] = useState<ReportData | null>(null);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);

  // ==========================================================
  // FORMAT
  // ==========================================================

  const [generateFormat, setGenerateFormat] = useState<ReportFormat>("PDF");

  const [downloadFormat, setDownloadFormat] = useState<ReportFormat>("PDF");

  // ==========================================================
  // FILTER
  // ==========================================================

  const [filterType, setFilterType] = useState<ReportFormat | null>(null);

  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);

  // ==========================================================
  // DOWNLOAD MODAL
  // ==========================================================

  const [downloadTarget, setDownloadTarget] = useState<GeneratedReport | null>(
    null,
  );

  // ==========================================================
  // GENERATED REPORTS
  // ==========================================================

  const [reports, setReports] = useState<GeneratedReport[]>([]);
  const loadSequence = useRef(0);

  // ==========================================================
  // ACTIVE DATES
  // ==========================================================

  const activeStartDate = dateMode === "single" ? selectedDate : startDate;

  const activeEndDate = dateMode === "single" ? selectedDate : endDate;
  const hasCurrentReportData =
    reportData?.reportType === reportType &&
    reportData.startDate === activeStartDate &&
    reportData.endDate === activeEndDate;

  const selectRecentRange = (days: number) => {
    const end = getTodayString();
    setDateMode("range");
    setStartDate(addDays(end, 1 - days));
    setEndDate(end);
  };

  // ==========================================================
  // LOAD FIREBASE DATA
  // ==========================================================

  const loadReportData = async () => {
    const sequence = ++loadSequence.current;
    setError(null);
    setReportData(null);

    if (!isValidDateString(activeStartDate)) {
      setError("Please select a start date.");
      setLoading(false);
      return;
    }

    if (!isValidDateString(activeEndDate)) {
      setError("Please select an end date.");
      setLoading(false);
      return;
    }

    if (activeStartDate > activeEndDate) {
      setError("The end date cannot be earlier than the start date.");
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const data = await fetchReportData(
        reportType,
        activeStartDate,
        activeEndDate,
      );

      if (sequence === loadSequence.current) {
        setReportData(data);
      }
    } catch (err: any) {
      if (sequence === loadSequence.current) {
        console.error("Failed to fetch Firebase report data:", err);
        setError(err?.message || "Unable to fetch data from Firebase.");
      }
    } finally {
      if (sequence === loadSequence.current) {
        setLoading(false);
      }
    }
  };

  // ==========================================================
  // RELOAD WHEN REPORT SETTINGS CHANGE
  // ==========================================================

  useEffect(() => {
    void loadReportData();
    return () => {
      loadSequence.current += 1;
    };
  }, [reportType, dateMode, selectedDate, startDate, endDate]);

  // ==========================================================
  // GENERATE
  // ==========================================================

  const handleGenerate = () => {
    if (!reportData) {
      setError("There is no report data available for the selected period.");

      return;
    }
    if (!hasCurrentReportData) {
      setError("Wait for the selected report period to finish loading.");
      return;
    }

    const hasData =
      reportData.reportType === "Sensors"
        ? reportData.readings.length > 0
        : reportData.reportType === "Crop"
          ? reportData.measurements.length > 0
          : reportData.measurements.length > 0;

    if (!hasData) {
      setError(
        `No ${reportType.toLowerCase()} data was found for the selected date range.`,
      );

      return;
    }

    const dateLabel =
      dateMode === "single"
        ? formatDateForDisplay(selectedDate)
        : `${formatDateForDisplay(startDate)} - ${formatDateForDisplay(
            endDate,
          )}`;

    const report: GeneratedReport = {
      id: Date.now(),

      name:
        dateMode === "single"
          ? `Aquanics ${reportType} Report - ${selectedDate}`
          : `Aquanics ${reportType} Report - ${startDate} to ${endDate}`,

      type: generateFormat,

      reportType,

      date_label: dateLabel,

      data: reportData,
    };

    try {
      downloadReportFile(report, generateFormat);
      setReports((previous) => [report, ...previous]);
      setError(null);
    } catch (exportError: unknown) {
      console.error("Failed to generate report file:", exportError);
      setError(
        exportError instanceof Error
          ? `Unable to generate the ${generateFormat} report: ${exportError.message}`
          : `Unable to generate the ${generateFormat} report.`,
      );
    }
  };

  // ==========================================================
  // DOWNLOAD MODAL
  // ==========================================================

  const openDownloadModal = (report: GeneratedReport) => {
    setDownloadTarget(report);

    setDownloadFormat(report.type);
  };

  const handleDownload = () => {
    if (!downloadTarget) {
      return;
    }

    try {
      downloadReportFile(downloadTarget, downloadFormat);
      setDownloadTarget(null);
      setError(null);
    } catch (exportError: unknown) {
      console.error("Failed to download report file:", exportError);
      setError(
        exportError instanceof Error
          ? `Unable to download the ${downloadFormat} report: ${exportError.message}`
          : `Unable to download the ${downloadFormat} report.`,
      );
    }
  };

  // ==========================================================
  // FILTER
  // ==========================================================

  const filteredReports = filterType
    ? reports.filter((report) => report.type === filterType)
    : reports;

  // ==========================================================
  // RANGE LABEL
  // ==========================================================

  const rangeLabel =
    dateMode === "single"
      ? formatDateForDisplay(selectedDate)
      : `${formatDateForDisplay(startDate)} → ${formatDateForDisplay(endDate)}`;

  // ==========================================================
  // SUMMARY CARDS
  // ==========================================================

  const summaryCards = useMemo(() => {
    if (!reportData) {
      return [];
    }

    if (reportData.reportType === "Sensors") {
      return [
        {
          label: "Average pH",
          value: formatNumber(reportData.summaries.ph.average),
          unit: "",
        },

        {
          label: "Temperature",
          value: formatNumber(reportData.summaries.waterTemp.average),
          unit: "°C",
        },

        {
          label: "Water Level",
          value: formatNumber(reportData.summaries.waterLevel.average),
          unit: "cm",
        },

        {
          label: "Water %",
          value: formatNumber(reportData.summaries.waterPercent.average),
          unit: "%",
        },

        {
          label: "Distance",
          value: formatNumber(reportData.summaries.distance.average),
          unit: "cm",
        },

        {
          label: "Battery",
          value: formatNumber(reportData.summaries.batteryVoltage.average),
          unit: "V",
        },

        {
          label: "Current",
          value: formatNumber(reportData.summaries.currentDraw.average),
          unit: "A",
        },

        {
          label: "Readings",
          value: String(reportData.readings.length),
          unit: "",
        },
      ];
    }

    if (reportData.reportType === "Crop") {
      return [
        {
          label: "Crop Type",
          value: reportData.configuration.type || "—",
          unit: "",
        },

        {
          label: "Age",
          value: formatNumber(reportData.configuration.ageDays, 0),
          unit: "days",
        },

        {
          label: "Average Height",
          value: formatNumber(reportData.summary.averageHeight),
          unit: "",
        },

        {
          label: "Minimum Height",
          value: formatNumber(reportData.summary.minimumHeight),
          unit: "",
        },

        {
          label: "Maximum Height",
          value: formatNumber(reportData.summary.maximumHeight),
          unit: "",
        },

        {
          label: "Target Yield",
          value: formatNumber(reportData.configuration.targetYield),
          unit: "",
        },

        {
          label: "Planting Date",
          value: reportData.configuration.plantingDate || "—",
          unit: "",
        },

        {
          label: "Measurements",
          value: String(reportData.measurements.length),
          unit: "",
        },
      ];
    }

    return [
      {
        label: "Species",
        value: reportData.configuration.species || "—",
        unit: "",
      },

      {
        label: "Age",
        value: formatNumber(reportData.configuration.ageWeeks, 0),
        unit: "weeks",
      },

      {
        label: "Average Weight",
        value: formatNumber(reportData.summary.averageWeight),
        unit: "",
      },

      {
        label: "Minimum Weight",
        value: formatNumber(reportData.summary.minimumWeight),
        unit: "",
      },

      {
        label: "Maximum Weight",
        value: formatNumber(reportData.summary.maximumWeight),
        unit: "",
      },

      {
        label: "Starting Weight",
        value: formatNumber(reportData.configuration.startingWeight),
        unit: "",
      },

      {
        label: "Target Weight",
        value: formatNumber(reportData.configuration.targetWeight),
        unit: "",
      },

      {
        label: "Measurements",
        value: String(reportData.measurements.length),
        unit: "",
      },
    ];
  }, [reportData]);

  // ==========================================================
  // REPORT TYPE INFORMATION
  // ==========================================================

  const reportTypeDescription =
    reportType === "Sensors"
      ? "pH, temperature, water level, battery, current and other sensor readings."
      : reportType === "Crop"
        ? "Crop configuration and recorded crop growth measurements."
        : "Fish configuration and recorded fish growth measurements.";

  // ==========================================================
  // PAGE
  // ==========================================================

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-0 space-y-5 sm:space-y-6">
      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="w-full mx-auto flex flex-col gap-4 sm:gap-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 leading-tight">
            Reports
          </h1>

          <p className="text-sm sm:text-base text-slate-500 mt-1 leading-relaxed">
            Generate reports from your Aquanics Firebase data.
          </p>
        </div>

        <ol
          aria-label="Report creation steps"
          className="grid grid-cols-3 gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:gap-3 sm:p-4"
        >
          {[
            ["1", "Choose data"],
            ["2", "Set period"],
            ["3", "Generate"],
          ].map(([step, label]) => (
            <li
              key={step}
              className="flex min-w-0 items-center gap-2 text-xs font-semibold text-slate-600 sm:text-sm"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                {step}
              </span>
              <span className="truncate">{label}</span>
            </li>
          ))}
        </ol>

        {/* ====================================================
            REPORT TYPE
        ==================================================== */}

        <div className="w-full bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-5 shadow-sm">
          <div className="mb-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
              Step 1
            </p>
            <label className="mt-1 block text-sm font-bold text-slate-700">
              Choose report subject
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* SENSORS */}

            <button
              type="button"
              onClick={() => setReportType("Sensors")}
              className={cn(
                "rounded-xl sm:rounded-2xl border p-3 sm:p-4 text-left transition-all",
                reportType === "Sensors"
                  ? "border-emerald-400 bg-emerald-50 shadow-sm"
                  : "border-slate-200 bg-white hover:bg-slate-50",
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "h-9 w-9 sm:h-10 sm:w-10 rounded-xl flex items-center justify-center shrink-0",
                    reportType === "Sensors"
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-100 text-slate-500",
                  )}
                >
                  <Activity size={18} className="sm:w-5 sm:h-5" />
                </div>

                <div>
                  <p
                    className={cn(
                      "text-sm font-bold",
                      reportType === "Sensors"
                        ? "text-emerald-800"
                        : "text-slate-800",
                    )}
                  >
                    Sensors
                  </p>

                  <p className="text-xs text-slate-400 mt-0.5">
                    Sensor readings
                  </p>
                </div>
              </div>
            </button>

            {/* CROP */}

            <button
              type="button"
              onClick={() => setReportType("Crop")}
              className={cn(
                "rounded-xl sm:rounded-2xl border p-3 sm:p-4 text-left transition-all",
                reportType === "Crop"
                  ? "border-emerald-400 bg-emerald-50 shadow-sm"
                  : "border-slate-200 bg-white hover:bg-slate-50",
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "h-9 w-9 sm:h-10 sm:w-10 rounded-xl flex items-center justify-center shrink-0",
                    reportType === "Crop"
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-100 text-slate-500",
                  )}
                >
                  <Sprout size={18} className="sm:w-5 sm:h-5" />
                </div>

                <div>
                  <p
                    className={cn(
                      "text-sm font-bold",
                      reportType === "Crop"
                        ? "text-emerald-800"
                        : "text-slate-800",
                    )}
                  >
                    Crop
                  </p>

                  <p className="text-xs text-slate-400 mt-0.5">Crop growth</p>
                </div>
              </div>
            </button>

            {/* FISH */}

            <button
              type="button"
              onClick={() => setReportType("Fish")}
              className={cn(
                "rounded-xl sm:rounded-2xl border p-3 sm:p-4 text-left transition-all",
                reportType === "Fish"
                  ? "border-emerald-400 bg-emerald-50 shadow-sm"
                  : "border-slate-200 bg-white hover:bg-slate-50",
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "h-9 w-9 sm:h-10 sm:w-10 rounded-xl flex items-center justify-center shrink-0",
                    reportType === "Fish"
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-100 text-slate-500",
                  )}
                >
                  <Fish size={18} className="sm:w-5 sm:h-5" />
                </div>

                <div>
                  <p
                    className={cn(
                      "text-sm font-bold",
                      reportType === "Fish"
                        ? "text-emerald-800"
                        : "text-slate-800",
                    )}
                  >
                    Fish
                  </p>

                  <p className="text-xs text-slate-400 mt-0.5">Fish growth</p>
                </div>
              </div>
            </button>
          </div>

          <p className="mt-3 text-xs text-slate-400">{reportTypeDescription}</p>
        </div>

        {/* ====================================================
            DATE FILTER
        ==================================================== */}

        <div className="w-full bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-5 shadow-sm">
          <div className="mb-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
              Step 2
            </p>
            <p className="mt-1 text-sm font-bold text-slate-700">
              Choose a date or period
            </p>
          </div>
          <div className="flex flex-col lg:flex-row lg:items-end gap-5">
            {/* DATE MODE */}

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2">
                Date selection
              </label>

              <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
                <button
                  type="button"
                  onClick={() => setDateMode("single")}
                  className={cn(
                    "flex-1 sm:flex-none rounded-lg px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold transition-all",
                    dateMode === "single"
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "text-slate-500 hover:bg-white hover:text-slate-700",
                  )}
                >
                  Single Date
                </button>

                <button
                  type="button"
                  onClick={() => setDateMode("range")}
                  className={cn(
                    "flex-1 sm:flex-none rounded-lg px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold transition-all",
                    dateMode === "range"
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "text-slate-500 hover:bg-white hover:text-slate-700",
                  )}
                >
                  Date Range
                </button>
              </div>
            </div>

            {/* SINGLE DATE */}

            {dateMode === "single" && (
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2">
                  Date
                </label>

                <div className="relative">
                  <Calendar
                    size={17}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  />

                  <input
                    type="date"
                    max={today}
                    value={selectedDate}
                    onChange={(event) => setSelectedDate(event.target.value)}
                    className="w-full sm:w-auto pl-10 pr-3 sm:pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>
              </div>
            )}

            {/* START DATE */}

            {dateMode === "range" && (
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2">
                  Start Date
                </label>

                <div className="relative">
                  <Calendar
                    size={17}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  />

                  <input
                    type="date"
                    max={today}
                    value={startDate}
                    onChange={(event) => {
                      const nextStartDate = event.target.value;
                      setStartDate(nextStartDate);
                      if (nextStartDate > endDate) {
                        setEndDate(nextStartDate);
                      }
                    }}
                    className="w-full sm:w-auto pl-10 pr-3 sm:pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>
              </div>
            )}

            {/* END DATE */}

            {dateMode === "range" && (
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2">
                  End Date
                </label>

                <div className="relative">
                  <Calendar
                    size={17}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  />

                  <input
                    type="date"
                    min={startDate}
                    max={today}
                    value={endDate}
                    onChange={(event) => setEndDate(event.target.value)}
                    className="w-full sm:w-auto pl-10 pr-3 sm:pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-end gap-2">
              <span className="w-full text-xs font-bold text-slate-500">
                Quick range
              </span>
              {[7, 30].map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => selectRecentRange(days)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-600 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
                >
                  Last {days} days
                </button>
              ))}
            </div>

            {/* REFRESH */}

            <button
              type="button"
              onClick={loadReportData}
              disabled={loading}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-all"
            >
              {loading ? (
                <Loader2 size={17} className="animate-spin" />
              ) : (
                <RefreshCw size={17} />
              )}
              Refresh Data
            </button>
          </div>

          {/* ACTIVE RANGE */}

          <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-2 text-sm">
              <Calendar size={16} className="text-emerald-600" />

              <span className="font-bold text-slate-700">Selected period:</span>

              <span className="text-slate-500">{rangeLabel}</span>
            </div>

            {reportData && (
              <span className="text-xs font-bold text-slate-400">
                {reportData.reportType === "Sensors"
                  ? `${reportData.readings.length} sensor readings`
                  : `${reportData.measurements.length} growth measurements`}
              </span>
            )}
          </div>
        </div>

        {/* ====================================================
            GENERATE CONTROLS
        ==================================================== */}

        <div className="flex flex-col items-stretch gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:flex-row sm:flex-wrap sm:items-center sm:p-0 sm:border-0 sm:bg-transparent">
          <div className="w-full sm:w-auto sm:mr-auto">
            <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
              Step 3
            </p>
            <p className="mt-1 text-sm font-bold text-slate-700">
              Prepare your report
            </p>
          </div>
          {/* FILTER */}

          <div className="relative w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setIsFilterMenuOpen((previous) => !previous)}
              className={cn(
                "w-full sm:w-auto px-4 py-2.5 bg-white border rounded-xl text-sm font-bold shadow-sm flex items-center justify-center gap-2 transition-all",
                filterType
                  ? "border-emerald-300 text-emerald-700 bg-emerald-50"
                  : "border-slate-200 text-slate-600 hover:bg-slate-50",
              )}
            >
              <Filter size={16} />

              {filterType || "Filter generated"}
            </button>

            {isFilterMenuOpen && (
              <div className="absolute left-0 top-full z-50 mt-2 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl sm:w-44">
                {(["PDF", "CSV"] as ReportFormat[]).map((format) => (
                  <button
                    key={format}
                    type="button"
                    onClick={() => {
                      setFilterType(format);

                      setIsFilterMenuOpen(false);
                    }}
                    className={cn(
                      "w-full px-4 py-2.5 text-sm font-medium text-left hover:bg-slate-50",
                      filterType === format && "text-emerald-600 bg-emerald-50",
                    )}
                  >
                    {format}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => {
                    setFilterType(null);

                    setIsFilterMenuOpen(false);
                  }}
                  className="w-full px-4 py-2.5 text-sm font-medium text-left hover:bg-slate-50 text-slate-500 border-t border-slate-100"
                >
                  All
                </button>
              </div>
            )}
          </div>
          <p className="text-xs leading-relaxed text-slate-500 sm:max-w-48">
            This filter applies to the generated-files list, not the source data.
          </p>

          {/* FORMAT */}

          <div className="flex w-full items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 sm:w-auto">
            {(["PDF", "CSV"] as ReportFormat[]).map((format) => (
              <button
                key={format}
                type="button"
                onClick={() => setGenerateFormat(format)}
                className={cn(
                  "flex-1 rounded-lg px-3 py-2 text-xs font-bold transition-all sm:flex-none sm:py-1.5",
                  generateFormat === format
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-700",
                )}
              >
                {format}
              </button>
            ))}
          </div>

          {/* GENERATE */}

          <button
            type="button"
            disabled={loading || !hasCurrentReportData}
            onClick={handleGenerate}
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            {loading ? (
              <>
                <Loader2 size={17} className="animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <FileText size={17} />
                Generate {generateFormat}
              </>
            )}
          </button>
        </div>
      </div>

      {/* ======================================================
          ERROR
      ====================================================== */}

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-red-800">Report Error</p>

            <p className="text-xs text-red-600 mt-1">{error}</p>
          </div>

          <button
            type="button"
            onClick={() => setError(null)}
            className="text-red-400 hover:text-red-600"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* ======================================================
          SUMMARY
      ====================================================== */}

      <div>
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 size={20} className="text-emerald-600" />

          <h2 className="text-lg font-bold text-slate-900">
            {reportType === "Sensors"
              ? "Sensor Summary"
              : reportType === "Crop"
                ? "Crop Summary"
                : "Fish Summary"}
          </h2>
        </div>

        {loading ? (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-12 flex flex-col items-center justify-center">
            <Loader2 size={32} className="animate-spin text-emerald-600" />

            <p className="mt-3 text-sm font-semibold text-slate-500">
              Fetching Firebase data...
            </p>
          </div>
        ) : reportData ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4">
            {summaryCards.map((card) => (
              <div
                key={card.label}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5"
              >
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                  {card.label}
                </p>

                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-2xl font-display font-bold text-slate-900 truncate">
                    {card.value}
                  </span>

                  {card.unit && (
                    <span className="text-xs font-bold text-slate-400">
                      {card.unit}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      {/* ======================================================
          CROP CONFIGURATION
      ====================================================== */}

      {reportData?.reportType === "Crop" && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Sprout size={18} className="sm:w-5 sm:h-5" />
              </div>

              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Crop Configuration
                </h2>

                <p className="text-xs text-slate-400 mt-1">
                  Current configuration from Firebase.
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4">
            <div>
              <p className="text-xs font-bold text-slate-400">Crop Type</p>

              <p className="mt-1 text-sm font-bold text-slate-900">
                {reportData.configuration.type || "—"}
              </p>
            </div>

            <div>
              <p className="text-xs font-bold text-slate-400">Age</p>

              <p className="mt-1 text-sm font-bold text-slate-900">
                {formatNumber(reportData.configuration.ageDays, 0)} days
              </p>
            </div>

            <div>
              <p className="text-xs font-bold text-slate-400">Planting Date</p>

              <p className="mt-1 text-sm font-bold text-slate-900">
                {reportData.configuration.plantingDate || "—"}
              </p>
            </div>

            <div>
              <p className="text-xs font-bold text-slate-400">Target Yield</p>

              <p className="mt-1 text-sm font-bold text-slate-900">
                {formatNumber(reportData.configuration.targetYield)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================
          FISH CONFIGURATION
      ====================================================== */}

      {reportData?.reportType === "Fish" && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Fish size={18} className="sm:w-5 sm:h-5" />
              </div>

              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Fish Configuration
                </h2>

                <p className="text-xs text-slate-400 mt-1">
                  Current configuration from Firebase.
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4">
            <div>
              <p className="text-xs font-bold text-slate-400">Species</p>

              <p className="mt-1 text-sm font-bold text-slate-900">
                {reportData.configuration.species || "—"}
              </p>
            </div>

            <div>
              <p className="text-xs font-bold text-slate-400">Age</p>

              <p className="mt-1 text-sm font-bold text-slate-900">
                {formatNumber(reportData.configuration.ageWeeks, 0)} weeks
              </p>
            </div>

            <div>
              <p className="text-xs font-bold text-slate-400">
                Starting Weight
              </p>

              <p className="mt-1 text-sm font-bold text-slate-900">
                {formatNumber(reportData.configuration.startingWeight)}
              </p>
            </div>

            <div>
              <p className="text-xs font-bold text-slate-400">Target Weight</p>

              <p className="mt-1 text-sm font-bold text-slate-900">
                {formatNumber(reportData.configuration.targetWeight)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================
          SENSOR READINGS
      ====================================================== */}

      {reportData?.reportType === "Sensors" && (
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Sensor Readings
              </h2>

              <p className="text-xs text-slate-400 mt-1">
                Actual sensor readings retrieved from Firebase.
              </p>
            </div>

            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg">
              {reportData.readings.length} readings
            </span>
          </div>

          {loading ? (
            <div className="p-8 sm:p-12 text-center">
              <Loader2
                size={30}
                className="mx-auto animate-spin text-emerald-600"
              />
            </div>
          ) : reportData.readings.length === 0 ? (
            <div className="p-8 sm:p-12 text-center">
              <FileText size={40} className="mx-auto text-slate-300" />

              <p className="mt-4 text-sm font-bold text-slate-600">
                No sensor data found
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px]">
                <thead>
                  <tr className="bg-slate-50 text-left">
                    {[
                      "Date",
                      "Time",
                      "pH",
                      "pH Voltage",
                      "Temp",
                      "Level",
                      "Water %",
                      "Distance",
                      "Battery",
                      "Current",
                    ].map((heading) => (
                      <th
                        key={heading}
                        className="px-5 py-3 text-xs font-bold text-slate-500"
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {reportData.readings.slice(0, 25).map((reading, index) => (
                    <tr
                      key={`${reading.date}-${reading.time}-${index}`}
                      className="hover:bg-slate-50/50"
                    >
                      <td className="px-5 py-3 text-xs font-medium text-slate-600">
                        {reading.date}
                      </td>

                      <td className="px-5 py-3 text-xs font-medium text-slate-600">
                        {reading.time}
                      </td>

                      <td className="px-5 py-3 text-sm font-bold text-slate-900">
                        {formatNumber(reading.ph)}
                      </td>

                      <td className="px-5 py-3 text-xs text-slate-500">
                        {formatNumber(reading.phVoltage, 4)} V
                      </td>

                      <td className="px-5 py-3 text-xs text-slate-500">
                        {formatNumber(reading.waterTemp)} °C
                      </td>

                      <td className="px-5 py-3 text-xs text-slate-500">
                        {formatNumber(reading.waterLevel)} cm
                      </td>

                      <td className="px-5 py-3 text-xs text-slate-500">
                        {formatNumber(reading.waterPercent)} %
                      </td>

                      <td className="px-5 py-3 text-xs text-slate-500">
                        {formatNumber(reading.distance)} cm
                      </td>

                      <td className="px-5 py-3 text-xs text-slate-500">
                        {formatNumber(reading.batteryVoltage)} V
                      </td>

                      <td className="px-5 py-3 text-xs text-slate-500">
                        {formatNumber(reading.currentDraw)} A
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {reportData.readings.length > 25 && (
                <div className="px-5 py-4 border-t border-slate-100 text-xs text-slate-400">
                  Showing the first 25 readings. The generated CSV/PDF contains
                  the complete selected date range.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ======================================================
          CROP GROWTH MEASUREMENTS
      ====================================================== */}

      {reportData?.reportType === "Crop" && (
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Crop Growth Measurements
              </h2>

              <p className="text-xs text-slate-400 mt-1">
                Records from /growthMeasurements/crop.
              </p>
            </div>

            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg">
              {reportData.measurements.length} measurements
            </span>
          </div>

          {reportData.measurements.length === 0 ? (
            <div className="p-8 sm:p-12 text-center">
              <Sprout size={40} className="mx-auto text-slate-300" />

              <p className="mt-4 text-sm font-bold text-slate-600">
                No crop growth data found
              </p>

              <p className="mt-1 text-xs text-slate-400">
                There are no crop measurements for {rangeLabel}.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="bg-slate-50 text-left">
                    <th className="px-5 py-3 text-xs font-bold text-slate-500">
                      Date
                    </th>

                    <th className="px-5 py-3 text-xs font-bold text-slate-500">
                      Height
                    </th>

                    <th className="px-5 py-3 text-xs font-bold text-slate-500">
                      Notes
                    </th>

                    <th className="px-5 py-3 text-xs font-bold text-slate-500">
                      Created At
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {reportData.measurements.slice(0, 50).map((measurement) => (
                    <tr key={measurement.id} className="hover:bg-slate-50/50">
                      <td className="px-5 py-3 text-xs font-medium text-slate-600">
                        {measurement.date}
                      </td>

                      <td className="px-5 py-3 text-sm font-bold text-slate-900">
                        {formatNumber(measurement.height)}
                      </td>

                      <td className="px-5 py-3 text-xs text-slate-500">
                        {measurement.notes || "—"}
                      </td>

                      <td className="px-5 py-3 text-xs text-slate-400">
                        {measurement.createdAt || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ======================================================
          FISH GROWTH MEASUREMENTS
      ====================================================== */}

      {reportData?.reportType === "Fish" && (
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Fish Growth Measurements
              </h2>

              <p className="text-xs text-slate-400 mt-1">
                Records from /growthMeasurements/fish.
              </p>
            </div>

            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg">
              {reportData.measurements.length} measurements
            </span>
          </div>

          {reportData.measurements.length === 0 ? (
            <div className="p-8 sm:p-12 text-center">
              <Fish size={40} className="mx-auto text-slate-300" />

              <p className="mt-4 text-sm font-bold text-slate-600">
                No fish growth data found
              </p>

              <p className="mt-1 text-xs text-slate-400">
                There are no fish measurements for {rangeLabel}.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="bg-slate-50 text-left">
                    <th className="px-5 py-3 text-xs font-bold text-slate-500">
                      Date
                    </th>

                    <th className="px-5 py-3 text-xs font-bold text-slate-500">
                      Average Weight
                    </th>

                    <th className="px-5 py-3 text-xs font-bold text-slate-500">
                      Notes
                    </th>

                    <th className="px-5 py-3 text-xs font-bold text-slate-500">
                      Created At
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {reportData.measurements.slice(0, 50).map((measurement) => (
                    <tr key={measurement.id} className="hover:bg-slate-50/50">
                      <td className="px-5 py-3 text-xs font-medium text-slate-600">
                        {measurement.date}
                      </td>

                      <td className="px-5 py-3 text-sm font-bold text-slate-900">
                        {formatNumber(measurement.averageWeight)}
                      </td>

                      <td className="px-5 py-3 text-xs text-slate-500">
                        {measurement.notes || "—"}
                      </td>

                      <td className="px-5 py-3 text-xs text-slate-400">
                        {measurement.createdAt || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ======================================================
          GENERATED REPORTS
      ====================================================== */}

      <div>
        <div className="mb-4 flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Generated Reports
            </h2>

            <p className="text-xs text-slate-400 mt-1">
              Reports generated during this session.
            </p>
          </div>

          {filterType && (
            <button
              type="button"
              onClick={() => setFilterType(null)}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700"
            >
              Clear filter
            </button>
          )}
        </div>

        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
          {filteredReports.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {filteredReports.map((report) => (
                <div
                  key={report.id}
                  className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:bg-slate-50/50 transition-colors group"
                >
                  <div className="flex items-center gap-3 sm:gap-5 min-w-0 w-full">
                    <div
                      className={cn(
                        "h-12 w-12 shrink-0 rounded-2xl flex items-center justify-center transition-colors shadow-sm",
                        report.type === "PDF"
                          ? "bg-red-50 text-red-500 group-hover:bg-red-100"
                          : "bg-emerald-50 text-emerald-500 group-hover:bg-emerald-100",
                      )}
                    >
                      {report.reportType === "Crop" ? (
                        <Sprout size={24} />
                      ) : report.reportType === "Fish" ? (
                        <Fish size={24} />
                      ) : (
                        <FileText size={24} />
                      )}
                    </div>

                    <div className="min-w-0">
                      <h4 className="font-bold text-slate-900 text-lg truncate">
                        {report.name}
                      </h4>

                      <div className="flex flex-wrap items-center gap-3 mt-1">
                        <span
                          className={cn(
                            "text-xs font-bold px-2 py-0.5 rounded-md",
                            report.reportType === "Sensors"
                              ? "bg-blue-50 text-blue-600"
                              : report.reportType === "Crop"
                                ? "bg-emerald-50 text-emerald-600"
                                : "bg-cyan-50 text-cyan-600",
                          )}
                        >
                          {report.reportType}
                        </span>

                        <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                          {report.type}
                        </span>

                        <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                          <Calendar size={12} />

                          {report.date_label}
                        </span>

                        <span className="text-xs text-slate-400 font-medium">
                          •{" "}
                          {report.data.reportType === "Sensors"
                            ? report.data.readings.length
                            : report.data.measurements.length}{" "}
                          {report.data.reportType === "Sensors"
                            ? "readings"
                            : "measurements"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => openDownloadModal(report)}
                    title="Download report"
                    className="self-end sm:self-auto shrink-0 p-2.5 sm:p-3 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                  >
                    <Download size={20} className="sm:w-6 sm:h-6" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 sm:p-12 text-center">
              <FileText size={40} className="mx-auto text-slate-300" />

              <p className="mt-4 text-sm font-bold text-slate-600">
                No generated reports
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Select Sensors, Crop, or Fish and generate your first report.
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-slate-400 px-1 mt-3">
          <span>
            Showing{" "}
            <strong className="text-slate-600">{filteredReports.length}</strong>{" "}
            of <strong className="text-slate-600">{reports.length}</strong>{" "}
            reports
          </span>
        </div>
      </div>

      {/* ======================================================
          DOWNLOAD MODAL
      ====================================================== */}

      <Modal
        isOpen={downloadTarget !== null}
        onClose={() => setDownloadTarget(null)}
        title="Download Report"
      >
        {downloadTarget && (
          <div className="space-y-4 sm:space-y-5">
            <div className="rounded-xl sm:rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:p-4">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "h-9 w-9 sm:h-10 sm:w-10 rounded-xl flex items-center justify-center shrink-0",
                    downloadTarget.reportType === "Sensors"
                      ? "bg-blue-50 text-blue-600"
                      : downloadTarget.reportType === "Crop"
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-cyan-50 text-cyan-600",
                  )}
                >
                  {downloadTarget.reportType === "Crop" ? (
                    <Sprout size={18} className="sm:w-5 sm:h-5" />
                  ) : downloadTarget.reportType === "Fish" ? (
                    <Fish size={18} className="sm:w-5 sm:h-5" />
                  ) : (
                    <Activity size={18} className="sm:w-5 sm:h-5" />
                  )}
                </div>

                <div>
                  <p className="text-sm font-bold text-slate-900">
                    {downloadTarget.name}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    {downloadTarget.reportType}
                    {" • "}
                    {downloadTarget.date_label}
                  </p>
                </div>
              </div>

              <p className="mt-3 text-xs text-slate-500">
                {downloadTarget.data.reportType === "Sensors"
                  ? `${downloadTarget.data.readings.length} sensor readings`
                  : `${downloadTarget.data.measurements.length} growth measurements`}
              </p>
            </div>

            <div>
              <p className="text-sm font-bold text-slate-700">
                Choose download format
              </p>

              <div className="mt-3 grid grid-cols-2 gap-3">
                {(["PDF", "CSV"] as ReportFormat[]).map((format) => (
                  <button
                    key={format}
                    type="button"
                    onClick={() => setDownloadFormat(format)}
                    className={cn(
                      "rounded-2xl border px-4 py-4 text-left transition-all",
                      downloadFormat === format
                        ? "border-emerald-400 bg-emerald-50 text-emerald-700 shadow-sm"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50",
                    )}
                  >
                    <p className="text-sm font-bold">{format}</p>

                    <p className="mt-1 text-xs font-medium">
                      {format === downloadTarget.type
                        ? "Matches generated format"
                        : `Download as ${format}`}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 sm:gap-3">
              <button
                type="button"
                onClick={() => setDownloadTarget(null)}
                className="w-full sm:w-auto rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDownload}
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition-all hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-200"
              >
                <Download size={16} />
                Download {downloadFormat}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
