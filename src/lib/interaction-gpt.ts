import { getOpenAIClient, isOpenAIConfigured } from "./openai";
import type { InteractionCheckResult, InteractionSeverity } from "@/types/interactions";

const INTERACTION_PROMPT = `You are a pharmacist assistant checking for drug interactions.

Given two medicine names, determine if there is a known drug interaction between them.

Respond ONLY with a JSON object in this exact format:
{
  "hasInteraction": true or false,
  "severity": "minor" | "moderate" | "major" | "contraindicated" | null,
  "description": "Brief description of the interaction" or null
}

Severity definitions:
- minor: Minor interaction, usually not clinically significant
- moderate: May require monitoring or dosage adjustment
- major: Potentially dangerous, may require alternative medication
- contraindicated: Should never be taken together

If no interaction is known or you're uncertain, return hasInteraction: false.

Be conservative - only report interactions you are confident about.`;

export async function checkInteractionGPT(
  drug1Name: string,
  drug2Name: string
): Promise<InteractionCheckResult> {
  const result: InteractionCheckResult = {
    medicine1: drug1Name,
    medicine2: drug2Name,
    hasInteraction: false,
    severity: null,
    description: null,
    source: "gpt",
  };

  if (!isOpenAIConfigured()) {
    console.warn("OpenAI not configured, skipping GPT interaction check");
    return result;
  }

  try {
    const openai = getOpenAIClient();

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: INTERACTION_PROMPT },
        {
          role: "user",
          content: `Check for drug interaction between:\n1. ${drug1Name}\n2. ${drug2Name}`,
        },
      ],
      max_tokens: 300,
      temperature: 0.1,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return result;

    // Parse JSON response
    const jsonStr = content.replace(/```json\n?|\n?```/g, "").trim();
    const parsed = JSON.parse(jsonStr);

    if (parsed.hasInteraction) {
      result.hasInteraction = true;
      result.severity = validateSeverity(parsed.severity);
      result.description = parsed.description || "Potential drug interaction detected.";

      // Add disclaimer for GPT-sourced interactions
      result.description += " (AI-generated - please consult a healthcare provider)";
    }

    return result;

  } catch (error) {
    console.error("GPT interaction check error:", error);
    return result;
  }
}

function validateSeverity(severity: unknown): InteractionSeverity | null {
  const valid: InteractionSeverity[] = ["minor", "moderate", "major", "contraindicated"];
  if (typeof severity === "string" && valid.includes(severity as InteractionSeverity)) {
    return severity as InteractionSeverity;
  }
  return null;
}
