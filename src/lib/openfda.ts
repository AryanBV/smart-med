import type { InteractionCheckResult, InteractionSeverity } from "@/types/interactions";

const OPENFDA_BASE_URL = "https://api.fda.gov/drug";

interface OpenFDADrugResult {
  openfda?: {
    brand_name?: string[];
    generic_name?: string[];
    substance_name?: string[];
  };
  drug_interactions?: string[];
}

interface OpenFDAResponse {
  results?: OpenFDADrugResult[];
}

// Search OpenFDA for drug information
async function searchDrug(drugName: string): Promise<OpenFDADrugResult | null> {
  try {
    // Clean up drug name for search
    const cleanName = drugName
      .replace(/\d+\s*(mg|ml|mcg|g|iu)/gi, "") // Remove dosages
      .replace(/tablet|capsule|syrup|injection|tab\.|cap\.|syp\.|inj\./gi, "") // Remove forms
      .trim();

    if (!cleanName) return null;

    const response = await fetch(
      `${OPENFDA_BASE_URL}/label.json?search=openfda.brand_name:"${encodeURIComponent(cleanName)}"+openfda.generic_name:"${encodeURIComponent(cleanName)}"&limit=1`,
      { next: { revalidate: 86400 } } // Cache for 24 hours
    );

    if (!response.ok) {
      if (response.status === 404) return null;
      console.error(`OpenFDA API error: ${response.status}`);
      return null;
    }

    const data: OpenFDAResponse = await response.json();
    return data.results?.[0] || null;

  } catch (error) {
    console.error(`OpenFDA search error for "${drugName}":`, error);
    return null;
  }
}

// Check if two drugs interact using OpenFDA data
export async function checkInteractionOpenFDA(
  drug1Name: string,
  drug2Name: string
): Promise<InteractionCheckResult> {
  const result: InteractionCheckResult = {
    medicine1: drug1Name,
    medicine2: drug2Name,
    hasInteraction: false,
    severity: null,
    description: null,
    source: "openfda",
  };

  try {
    // Get drug info for both medicines
    const [drug1Info, drug2Info] = await Promise.all([
      searchDrug(drug1Name),
      searchDrug(drug2Name),
    ]);

    // If either drug not found in OpenFDA, return no result
    if (!drug1Info || !drug2Info) {
      return result;
    }

    // Get interaction text from drug1's label
    const drug1Interactions = drug1Info.drug_interactions || [];

    // Check if drug2 is mentioned in drug1's interactions
    const drug2Names = [
      ...(drug2Info.openfda?.brand_name || []),
      ...(drug2Info.openfda?.generic_name || []),
      ...(drug2Info.openfda?.substance_name || []),
    ].map(n => n.toLowerCase());

    for (const interactionText of drug1Interactions) {
      const lowerText = interactionText.toLowerCase();

      for (const name of drug2Names) {
        if (lowerText.includes(name)) {
          result.hasInteraction = true;
          result.description = truncateDescription(interactionText, 500);
          result.severity = inferSeverity(interactionText);
          return result;
        }
      }
    }

    // Also check drug2's interactions for drug1
    const drug2Interactions = drug2Info.drug_interactions || [];
    const drug1Names = [
      ...(drug1Info.openfda?.brand_name || []),
      ...(drug1Info.openfda?.generic_name || []),
      ...(drug1Info.openfda?.substance_name || []),
    ].map(n => n.toLowerCase());

    for (const interactionText of drug2Interactions) {
      const lowerText = interactionText.toLowerCase();

      for (const name of drug1Names) {
        if (lowerText.includes(name)) {
          result.hasInteraction = true;
          result.description = truncateDescription(interactionText, 500);
          result.severity = inferSeverity(interactionText);
          return result;
        }
      }
    }

    return result;

  } catch (error) {
    console.error("OpenFDA interaction check error:", error);
    return result;
  }
}

// Infer severity from interaction text (maps to DB enum: minor, moderate, major, contraindicated)
function inferSeverity(text: string): InteractionSeverity {
  const lower = text.toLowerCase();

  if (
    lower.includes("contraindicated") ||
    lower.includes("do not use") ||
    lower.includes("avoid concomitant") ||
    lower.includes("fatal") ||
    lower.includes("death")
  ) {
    return "contraindicated";
  }

  if (
    lower.includes("serious") ||
    lower.includes("severe") ||
    lower.includes("dangerous") ||
    lower.includes("life-threatening") ||
    lower.includes("major")
  ) {
    return "major";
  }

  if (
    lower.includes("caution") ||
    lower.includes("monitor") ||
    lower.includes("may increase") ||
    lower.includes("may decrease") ||
    lower.includes("moderate")
  ) {
    return "moderate";
  }

  return "minor";
}

// Truncate description to max length
function truncateDescription(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + "...";
}
