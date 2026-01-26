import { getOpenAIClient } from "./openai";
import type { ExtractedMedicine, ExtractionResult } from "@/types/medicines";

const EXTRACTION_PROMPT = `You are a medical prescription analyzer. Extract all medicines from this prescription image.

For each medicine found, extract:
- name: The medicine/drug name (required)
- dosage: Amount per dose (e.g., "500mg", "10ml", "1 tablet")
- frequency: How often to take (e.g., "twice daily", "every 8 hours", "once at bedtime")
- duration: How long to take (e.g., "7 days", "2 weeks", "until finished")
- instructions: Special instructions (e.g., "take with food", "avoid alcohol", "before meals")

Return ONLY a JSON object in this exact format, no other text:
{
  "medicines": [
    {
      "name": "Medicine Name",
      "dosage": "dosage or null",
      "frequency": "frequency or null",
      "duration": "duration or null",
      "instructions": "instructions or null"
    }
  ],
  "rawText": "The full text you can read from the prescription"
}

If you cannot read the image or find no medicines, return:
{
  "medicines": [],
  "rawText": null,
  "error": "Description of the problem"
}

Be thorough - extract ALL medicines visible, even if partially readable.
For Indian prescriptions, common patterns include:
- Tab. (tablet), Cap. (capsule), Syp. (syrup), Inj. (injection)
- OD (once daily), BD (twice daily), TDS (three times daily), QID (four times daily)
- SOS (as needed), HS (at bedtime), AC (before meals), PC (after meals)`;

export async function extractMedicinesFromImage(
  imageBase64: string,
  mimeType: string
): Promise<ExtractionResult> {
  try {
    const openai = getOpenAIClient();

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: EXTRACTION_PROMPT },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${imageBase64}`,
                detail: "high",
              },
            },
          ],
        },
      ],
      max_tokens: 2000,
      temperature: 0.1,
    });

    const content = response.choices[0]?.message?.content;

    if (!content) {
      return {
        success: false,
        medicines: [],
        rawText: null,
        error: "No response from AI",
      };
    }

    // Parse JSON response
    try {
      const jsonStr = content.replace(/```json\n?|\n?```/g, "").trim();
      const parsed = JSON.parse(jsonStr);

      if (!Array.isArray(parsed.medicines)) {
        return {
          success: false,
          medicines: [],
          rawText: parsed.rawText || null,
          error: parsed.error || "Invalid response format",
        };
      }

      const medicines: ExtractedMedicine[] = parsed.medicines
        .filter((m: unknown) => {
          if (typeof m !== "object" || m === null) return false;
          const med = m as Record<string, unknown>;
          return typeof med.name === "string" && med.name.trim().length > 0;
        })
        .map((m: Record<string, unknown>) => ({
          name: String(m.name).trim(),
          dosage: m.dosage ? String(m.dosage).trim() : null,
          frequency: m.frequency ? String(m.frequency).trim() : null,
          duration: m.duration ? String(m.duration).trim() : null,
          instructions: m.instructions ? String(m.instructions).trim() : null,
        }));

      return {
        success: true,
        medicines,
        rawText: parsed.rawText || null,
        error: null,
      };
    } catch {
      console.error("Failed to parse GPT response:", content);
      return {
        success: false,
        medicines: [],
        rawText: content,
        error: "Failed to parse AI response",
      };
    }
  } catch (error) {
    console.error("Extraction error:", error);

    if (error instanceof Error) {
      if (error.message.includes("API key")) {
        return {
          success: false,
          medicines: [],
          rawText: null,
          error: "OpenAI API key is invalid or not configured",
        };
      }
      if (error.message.includes("rate limit")) {
        return {
          success: false,
          medicines: [],
          rawText: null,
          error: "Rate limit exceeded. Please try again later.",
        };
      }
    }

    return {
      success: false,
      medicines: [],
      rawText: null,
      error: "Failed to process image",
    };
  }
}

export async function extractMedicinesFromPDF(): Promise<ExtractionResult> {
  return {
    success: false,
    medicines: [],
    rawText: null,
    error:
      "PDF extraction not yet supported. Please upload prescription as an image (JPG/PNG).",
  };
}
