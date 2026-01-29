import { getGlucoseStatus, GLUCOSE_TARGETS } from "@/types/glucose";
import type { GlucoseDisplay } from "@/types/glucose";

interface GlucoseStatsProps {
  readings: GlucoseDisplay[];
}

export function GlucoseStats({ readings }: GlucoseStatsProps) {
  if (readings.length === 0) return null;

  const values = readings.map((r) => r.value);
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const min = Math.min(...values);
  const max = Math.max(...values);

  // Calculate fasting average
  const fastingReadings = readings.filter((r) => r.reading_type === "fasting");
  const fastingAvg = fastingReadings.length
    ? fastingReadings.reduce((a, b) => a + b.value, 0) / fastingReadings.length
    : null;

  // Calculate readings in range
  const inRange = readings.filter(
    (r) => r.value >= GLUCOSE_TARGETS.low && r.value <= GLUCOSE_TARGETS.diabeticHigh
  ).length;
  const inRangePercent = Math.round((inRange / readings.length) * 100);

  // Get average status
  const avgStatus = getGlucoseStatus(avg, "random");
  const avgStatusColor = {
    low: "text-blue-600",
    normal: "text-green-600",
    elevated: "text-yellow-600",
    high: "text-red-600",
  }[avgStatus];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="border rounded-lg p-4 bg-card">
        <p className="text-sm text-muted-foreground">Average</p>
        <p className={`text-2xl font-bold ${avgStatusColor}`}>
          {avg.toFixed(0)}
        </p>
        <p className="text-xs text-muted-foreground">mg/dL</p>
      </div>

      <div className="border rounded-lg p-4 bg-card">
        <p className="text-sm text-muted-foreground">Fasting Avg</p>
        <p
          className={`text-2xl font-bold ${
            fastingAvg
              ? fastingAvg <= GLUCOSE_TARGETS.normalHigh
                ? "text-green-600"
                : fastingAvg <= GLUCOSE_TARGETS.preDiabeticHigh
                  ? "text-yellow-600"
                  : "text-red-600"
              : "text-muted-foreground"
          }`}
        >
          {fastingAvg ? fastingAvg.toFixed(0) : "—"}
        </p>
        <p className="text-xs text-muted-foreground">mg/dL</p>
      </div>

      <div className="border rounded-lg p-4 bg-card">
        <p className="text-sm text-muted-foreground">Range</p>
        <p className="text-2xl font-bold">
          <span className="text-green-600">{min}</span>
          <span className="text-muted-foreground mx-1">-</span>
          <span className="text-red-600">{max}</span>
        </p>
        <p className="text-xs text-muted-foreground">mg/dL (min-max)</p>
      </div>

      <div className="border rounded-lg p-4 bg-card">
        <p className="text-sm text-muted-foreground">In Target</p>
        <p
          className={`text-2xl font-bold ${
            inRangePercent >= 70
              ? "text-green-600"
              : inRangePercent >= 50
                ? "text-yellow-600"
                : "text-red-600"
          }`}
        >
          {inRangePercent}%
        </p>
        <p className="text-xs text-muted-foreground">
          {inRange} of {readings.length} readings
        </p>
      </div>
    </div>
  );
}
