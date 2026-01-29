import { z } from "zod";

export const readingTypeSchema = z.enum([
  "fasting",
  "pre_meal",
  "post_meal",
  "random",
  "bedtime",
]);

export const mealContextSchema = z.enum([
  "breakfast",
  "lunch",
  "dinner",
  "snack",
  "none",
]);

export const glucoseReadingSchema = z.object({
  owner_id: z.string().uuid("Invalid owner ID"),
  value: z
    .number()
    .min(20, "Value must be at least 20 mg/dL")
    .max(600, "Value must be less than 600 mg/dL"),
  reading_type: readingTypeSchema,
  meal_context: mealContextSchema.nullable().optional(),
  notes: z.string().max(500, "Notes must be less than 500 characters").nullable().optional(),
  recorded_at: z.string().datetime("Invalid date/time"),
});

export type GlucoseReadingInput = z.infer<typeof glucoseReadingSchema>;

export const glucoseDeleteSchema = z.object({
  reading_id: z.string().uuid("Invalid reading ID"),
});

export type GlucoseDeleteInput = z.infer<typeof glucoseDeleteSchema>;
