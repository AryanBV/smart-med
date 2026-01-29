import type { Tables, TablesInsert } from "./database";

// Database types
export type GlucoseReading = Tables<"glucose_readings">;
export type GlucoseReadingInsert = TablesInsert<"glucose_readings">;

// Extended type with owner name (from join)
export interface GlucoseDisplay {
  id: string;
  owner_id: string;
  value: number;
  unit: string;
  reading_type: "fasting" | "pre_meal" | "post_meal" | "random" | "bedtime";
  meal_context: "breakfast" | "lunch" | "dinner" | "snack" | "none" | null;
  notes: string | null;
  recorded_at: string;
  created_at: string;
  ownerName: string;
}

// Action state following existing pattern
export type GlucoseActionState = {
  error?: string;
  success?: boolean;
  data?: GlucoseReading;
};

// Reading type labels for display
export const READING_TYPE_LABELS: Record<string, string> = {
  fasting: "Fasting",
  pre_meal: "Pre-Meal",
  post_meal: "Post-Meal",
  random: "Random",
  bedtime: "Bedtime",
};

// Meal context labels for display
export const MEAL_CONTEXT_LABELS: Record<string, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snack",
  none: "None",
};

// Target ranges for glucose (mg/dL)
export const GLUCOSE_TARGETS = {
  low: 70,
  normalLow: 80,
  normalHigh: 100,
  preDiabeticHigh: 125,
  diabeticHigh: 140,
} as const;

// Helper to get status based on value
export function getGlucoseStatus(
  value: number,
  readingType: string
): "low" | "normal" | "elevated" | "high" {
  if (value < GLUCOSE_TARGETS.low) return "low";

  // Fasting targets are stricter
  if (readingType === "fasting") {
    if (value <= GLUCOSE_TARGETS.normalHigh) return "normal";
    if (value <= GLUCOSE_TARGETS.preDiabeticHigh) return "elevated";
    return "high";
  }

  // Post-meal and other readings
  if (value <= GLUCOSE_TARGETS.diabeticHigh) return "normal";
  if (value <= 180) return "elevated";
  return "high";
}
