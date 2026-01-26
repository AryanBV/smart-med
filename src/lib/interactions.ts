import { checkInteractionOpenFDA } from "./openfda";
import { checkInteractionGPT } from "./interaction-gpt";
import type { InteractionCheckResult } from "@/types/interactions";

export interface MedicinePair {
  id1: string;
  name1: string;
  id2: string;
  name2: string;
}

// Check interaction using hybrid approach (OpenFDA first, GPT fallback)
export async function checkInteraction(
  drug1Name: string,
  drug2Name: string
): Promise<InteractionCheckResult> {
  // Try OpenFDA first (authoritative source)
  const openfdaResult = await checkInteractionOpenFDA(drug1Name, drug2Name);

  if (openfdaResult.hasInteraction) {
    return openfdaResult;
  }

  // Fall back to GPT for Indian/generic medicines
  const gptResult = await checkInteractionGPT(drug1Name, drug2Name);

  return gptResult;
}

// Check all pairs of medicines for interactions
export async function checkAllInteractions(
  medicines: Array<{ id: string; name: string }>
): Promise<Array<InteractionCheckResult & { medicineId1: string; medicineId2: string }>> {
  const results: Array<InteractionCheckResult & { medicineId1: string; medicineId2: string }> = [];

  // Generate all unique pairs
  const pairs: MedicinePair[] = [];
  for (let i = 0; i < medicines.length; i++) {
    for (let j = i + 1; j < medicines.length; j++) {
      pairs.push({
        id1: medicines[i].id,
        name1: medicines[i].name,
        id2: medicines[j].id,
        name2: medicines[j].name,
      });
    }
  }

  // Check interactions in parallel (with rate limiting)
  const BATCH_SIZE = 3; // Process 3 pairs at a time to avoid rate limits

  for (let i = 0; i < pairs.length; i += BATCH_SIZE) {
    const batch = pairs.slice(i, i + BATCH_SIZE);

    const batchResults = await Promise.all(
      batch.map(async (pair) => {
        const result = await checkInteraction(pair.name1, pair.name2);
        return {
          ...result,
          medicineId1: pair.id1,
          medicineId2: pair.id2,
        };
      })
    );

    results.push(...batchResults);

    // Small delay between batches to avoid rate limits
    if (i + BATCH_SIZE < pairs.length) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  return results;
}
