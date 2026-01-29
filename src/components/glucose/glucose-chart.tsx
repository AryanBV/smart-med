"use client";

import { GLUCOSE_TARGETS } from "@/types/glucose";
import type { GlucoseDisplay } from "@/types/glucose";

interface GlucoseChartProps {
  readings: GlucoseDisplay[];
}

export function GlucoseChart({ readings }: GlucoseChartProps) {
  // Sort readings by date and take last 30
  const sortedReadings = [...readings]
    .sort(
      (a, b) =>
        new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()
    )
    .slice(-30);

  if (sortedReadings.length < 2) {
    return (
      <div className="border rounded-lg p-6 text-center text-muted-foreground">
        <p className="font-medium">Not enough data for trend chart</p>
        <p className="text-sm mt-1">Log at least 2 readings to see trends</p>
      </div>
    );
  }

  const values = sortedReadings.map((r) => r.value);
  const maxValue = Math.max(...values, GLUCOSE_TARGETS.diabeticHigh + 20);
  const minValue = Math.min(...values, GLUCOSE_TARGETS.low - 10);
  const range = maxValue - minValue;

  // Calculate positions for target zone
  const targetTopPercent = ((maxValue - GLUCOSE_TARGETS.diabeticHigh) / range) * 100;
  const targetHeightPercent =
    ((GLUCOSE_TARGETS.diabeticHigh - GLUCOSE_TARGETS.low) / range) * 100;

  // Generate SVG path for line chart
  const pathData = sortedReadings
    .map((r, i) => {
      const x = (i / (sortedReadings.length - 1)) * 100;
      const y = ((maxValue - r.value) / range) * 100;
      return `${i === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");

  return (
    <div className="border rounded-lg p-6">
      <h3 className="font-semibold mb-4">Trend (Last 30 Readings)</h3>
      <div className="relative h-48">
        {/* Target range indicator */}
        <div
          className="absolute left-0 right-0 bg-green-50 dark:bg-green-950/30 border-y border-green-200 dark:border-green-800"
          style={{
            top: `${targetTopPercent}%`,
            height: `${targetHeightPercent}%`,
          }}
        />

        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-0 w-8 flex flex-col justify-between text-xs text-muted-foreground">
          <span>{maxValue.toFixed(0)}</span>
          <span>{((maxValue + minValue) / 2).toFixed(0)}</span>
          <span>{minValue.toFixed(0)}</span>
        </div>

        {/* Chart area */}
        <div className="absolute left-10 right-0 top-0 bottom-0">
          <svg
            className="w-full h-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            {/* Grid lines */}
            <line
              x1="0"
              y1="50"
              x2="100"
              y2="50"
              stroke="currentColor"
              strokeOpacity="0.1"
              strokeDasharray="2,2"
            />

            {/* Line chart */}
            <path
              d={pathData}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-primary"
              vectorEffect="non-scaling-stroke"
            />

            {/* Data points */}
            {sortedReadings.map((r, i) => {
              const x = (i / (sortedReadings.length - 1)) * 100;
              const y = ((maxValue - r.value) / range) * 100;
              return (
                <circle
                  key={r.id}
                  cx={x}
                  cy={y}
                  r="1.5"
                  className="fill-primary"
                />
              );
            })}
          </svg>
        </div>
      </div>

      {/* X-axis labels */}
      <div className="flex justify-between text-xs text-muted-foreground mt-2 ml-10">
        <span>
          {new Date(sortedReadings[0].recorded_at).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
          })}
        </span>
        <span>
          {new Date(
            sortedReadings[sortedReadings.length - 1].recorded_at
          ).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
          })}
        </span>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-green-100 border border-green-300 rounded" />
          <span>Target range (70-140 mg/dL)</span>
        </div>
      </div>
    </div>
  );
}
