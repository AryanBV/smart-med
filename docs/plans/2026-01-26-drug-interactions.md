# Phase 5: Drug Interaction Checking Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement drug interaction checking using OpenFDA API with GPT-4o-mini fallback to alert users about potentially dangerous medicine combinations.

**Architecture:** Hybrid approach - try OpenFDA first (authoritative US FDA data), fall back to GPT-4o-mini for Indian/generic medicines. Auto-check after medicine extraction. Display alerts on dashboard with acknowledge/dismiss workflow.

**Tech Stack:** Next.js 15, Supabase, OpenFDA API (free), OpenAI GPT-4o-mini, shadcn/ui Alert component

---

## Pre-Implementation Notes

**Database Schema Already Exists:**
- Table: `drug_interactions` with `medicine_1_id`, `medicine_2_id` (not `medicine_id`/`interacting_medicine_id`)
- Severity enum: `minor`, `moderate`, `major`, `contraindicated` (not `mild`, `moderate`, `severe`, `contraindicated`)
- RLS is enabled

**Files to Create:**
- `src/types/interactions.ts`
- `src/lib/openfda.ts`
- `src/lib/interaction-gpt.ts`
- `src/lib/interactions.ts`
- `src/actions/interactions.ts`
- `src/components/interactions/interaction-card.tsx`
- `src/components/interactions/interaction-alert.tsx`
- `src/app/(dashboard)/dashboard/interactions/page.tsx`
- `src/app/(dashboard)/dashboard/interactions/loading.tsx`
- `src/components/ui/alert.tsx` (via shadcn)

**Files to Modify:**
- `src/app/api/documents/[id]/process/route.ts` (add auto-check)
- `src/app/(dashboard)/dashboard/page.tsx` (add alert)
- `src/types/database.ts` (regenerate types)

---

### Task 1: Install Alert Component

**Files:**
- Create: `src/components/ui/alert.tsx` (via shadcn CLI)

**Step 1: Install the shadcn Alert component**

Run:
```bash
npx shadcn@latest add alert
```

Expected: Creates `src/components/ui/alert.tsx` with Alert, AlertTitle, AlertDescription exports

**Step 2: Verify installation**

Run:
```bash
ls src/components/ui/alert.tsx
```

Expected: File exists

**Step 3: Commit**

```bash
git add src/components/ui/alert.tsx
git commit -m "chore: add shadcn alert component"
```

---

### Task 2: Regenerate TypeScript Types from Supabase

**Files:**
- Modify: `src/types/database.ts`

**Step 1: Generate types using Supabase MCP**

Use `mcp__plugin_supabase_supabase__generate_typescript_types` with project_id `zjjcykgfjobpfeobvptm`

**Step 2: Update database.ts with new types**

The generated types should include `drug_interactions` table.

**Step 3: Commit**

```bash
git add src/types/database.ts
git commit -m "chore: regenerate Supabase types with drug_interactions"
```

---

### Task 3: Create Interaction Types

**Files:**
- Create: `src/types/interactions.ts`

**Step 1: Create the types file**

```typescript
import type { Tables, TablesInsert } from "./database";

// Database types
export type DrugInteraction = Tables<"drug_interactions">;
export type DrugInteractionInsert = TablesInsert<"drug_interactions">;

// Severity levels (matches DB enum: minor, moderate, major, contraindicated)
export type InteractionSeverity = "minor" | "moderate" | "major" | "contraindicated";

// Source of interaction data
export type InteractionSource = "openfda" | "gpt" | "manual";

// For UI display
export interface InteractionDisplay {
  id: string;
  medicine1Id: string;
  medicine1Name: string;
  medicine2Id: string;
  medicine2Name: string;
  severity: InteractionSeverity;
  description: string;
  source: InteractionSource;
  isAcknowledged: boolean;
  acknowledgedAt: string | null;
  createdAt: string;
  ownerName: string;
  ownerId: string;
}

// Interaction check result (before DB insert)
export interface InteractionCheckResult {
  medicine1: string;
  medicine2: string;
  hasInteraction: boolean;
  severity: InteractionSeverity | null;
  description: string | null;
  source: InteractionSource;
}

// Action states
export interface InteractionActionState {
  success: boolean;
  error: string | null;
}

export interface CheckInteractionsResult {
  success: boolean;
  interactionsFound: number;
  newInteractions: number;
  error: string | null;
}

// Severity display config
export const SEVERITY_CONFIG: Record<InteractionSeverity, {
  label: string;
  color: string;
  bgColor: string;
  icon: "info" | "alert-triangle" | "alert-circle" | "octagon";
}> = {
  minor: {
    label: "Minor",
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
    icon: "info",
  },
  moderate: {
    label: "Moderate",
    color: "text-yellow-600 dark:text-yellow-400",
    bgColor: "bg-yellow-100 dark:bg-yellow-900/30",
    icon: "alert-triangle",
  },
  major: {
    label: "Major",
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-100 dark:bg-orange-900/30",
    icon: "alert-circle",
  },
  contraindicated: {
    label: "Contraindicated",
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-100 dark:bg-red-900/30",
    icon: "octagon",
  },
};
```

**Step 2: Verify no TypeScript errors**

Run:
```bash
npx tsc --noEmit
```

Expected: No errors related to interactions.ts

**Step 3: Commit**

```bash
git add src/types/interactions.ts
git commit -m "feat: add drug interaction types"
```

---

### Task 4: Create OpenFDA Service

**Files:**
- Create: `src/lib/openfda.ts`

**Step 1: Create OpenFDA service**

```typescript
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
```

**Step 2: Commit**

```bash
git add src/lib/openfda.ts
git commit -m "feat: add OpenFDA drug interaction service"
```

---

### Task 5: Create GPT Interaction Service (Fallback)

**Files:**
- Create: `src/lib/interaction-gpt.ts`

**Step 1: Create GPT fallback service**

```typescript
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
```

**Step 2: Commit**

```bash
git add src/lib/interaction-gpt.ts
git commit -m "feat: add GPT fallback for drug interaction checking"
```

---

### Task 6: Create Combined Interaction Service

**Files:**
- Create: `src/lib/interactions.ts`

**Step 1: Create combined service**

```typescript
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
```

**Step 2: Commit**

```bash
git add src/lib/interactions.ts
git commit -m "feat: add combined interaction checking service"
```

---

### Task 7: Create Interaction Server Actions

**Files:**
- Create: `src/actions/interactions.ts`

**Step 1: Create server actions**

```typescript
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { checkAllInteractions } from "@/lib/interactions";
import type {
  InteractionDisplay,
  InteractionActionState,
  CheckInteractionsResult,
  InteractionSource,
} from "@/types/interactions";

// Get all unacknowledged interactions for current user
export async function getUnacknowledgedInteractions(): Promise<{
  data: InteractionDisplay[] | null;
  error: string | null;
}> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { data: null, error: "Not authenticated" };
  }

  // Get user's family members
  const { data: members } = await supabase
    .from("family_members")
    .select("id, full_name")
    .eq("created_by", user.id);

  if (!members || members.length === 0) {
    return { data: [], error: null };
  }

  const memberIds = members.map((m) => m.id);
  const memberMap = new Map(members.map((m) => [m.id, m.full_name]));

  // Get medicines for those members
  const { data: medicines } = await supabase
    .from("medicines")
    .select("id, name, owner_id")
    .in("owner_id", memberIds);

  if (!medicines || medicines.length === 0) {
    return { data: [], error: null };
  }

  const medicineIds = medicines.map((m) => m.id);
  const medicineMap = new Map(medicines.map((m) => [m.id, { name: m.name, ownerId: m.owner_id }]));

  // Get unacknowledged interactions
  const { data: interactions, error } = await supabase
    .from("drug_interactions")
    .select("*")
    .or(`medicine_1_id.in.(${medicineIds.join(",")}),medicine_2_id.in.(${medicineIds.join(",")})`)
    .eq("is_acknowledged", false)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching interactions:", error);
    return { data: null, error: error.message };
  }

  // Filter to only interactions where user owns at least one medicine
  const userInteractions = (interactions || []).filter((int) => {
    const med1 = medicineMap.get(int.medicine_1_id);
    const med2 = medicineMap.get(int.medicine_2_id);
    return med1 || med2;
  });

  const displayData: InteractionDisplay[] = userInteractions.map((int) => {
    const med1 = medicineMap.get(int.medicine_1_id);
    const med2 = medicineMap.get(int.medicine_2_id);
    const ownerId = med1?.ownerId || med2?.ownerId || "";

    return {
      id: int.id,
      medicine1Id: int.medicine_1_id,
      medicine1Name: med1?.name || "Unknown",
      medicine2Id: int.medicine_2_id,
      medicine2Name: med2?.name || "Unknown",
      severity: int.severity as InteractionDisplay["severity"],
      description: int.description,
      source: (int.source || "manual") as InteractionSource,
      isAcknowledged: int.is_acknowledged ?? false,
      acknowledgedAt: int.acknowledged_at,
      createdAt: int.created_at,
      ownerName: memberMap.get(ownerId) || "Unknown",
      ownerId,
    };
  });

  // Sort by severity (contraindicated first)
  const severityOrder = { contraindicated: 0, major: 1, moderate: 2, minor: 3 };
  displayData.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return { data: displayData, error: null };
}

// Get interaction count for dashboard
export async function getUnacknowledgedInteractionCount(): Promise<number> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;

  // Get user's family members
  const { data: members } = await supabase
    .from("family_members")
    .select("id")
    .eq("created_by", user.id);

  if (!members || members.length === 0) return 0;

  const memberIds = members.map((m) => m.id);

  // Get medicines for those members
  const { data: medicines } = await supabase
    .from("medicines")
    .select("id")
    .in("owner_id", memberIds);

  if (!medicines || medicines.length === 0) return 0;

  const medicineIds = medicines.map((m) => m.id);

  // Count unacknowledged interactions
  const { count, error } = await supabase
    .from("drug_interactions")
    .select("*", { count: "exact", head: true })
    .or(`medicine_1_id.in.(${medicineIds.join(",")}),medicine_2_id.in.(${medicineIds.join(",")})`)
    .eq("is_acknowledged", false);

  if (error) {
    console.error("Error counting interactions:", error);
    return 0;
  }

  return count || 0;
}

// Check interactions for a family member's medicines
export async function checkMemberInteractions(
  memberId: string
): Promise<CheckInteractionsResult> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, interactionsFound: 0, newInteractions: 0, error: "Not authenticated" };
  }

  // Verify member belongs to user
  const { data: member } = await supabase
    .from("family_members")
    .select("id, created_by")
    .eq("id", memberId)
    .single();

  if (!member || member.created_by !== user.id) {
    return { success: false, interactionsFound: 0, newInteractions: 0, error: "Family member not found" };
  }

  // Get active medicines for this member
  const { data: medicines, error: medError } = await supabase
    .from("medicines")
    .select("id, name")
    .eq("owner_id", memberId)
    .eq("is_active", true);

  if (medError) {
    return { success: false, interactionsFound: 0, newInteractions: 0, error: medError.message };
  }

  if (!medicines || medicines.length < 2) {
    // Need at least 2 medicines to check interactions
    return { success: true, interactionsFound: 0, newInteractions: 0, error: null };
  }

  // Check all interactions
  const results = await checkAllInteractions(medicines);

  // Filter to only interactions found
  const interactions = results.filter((r) => r.hasInteraction && r.severity);

  if (interactions.length === 0) {
    return { success: true, interactionsFound: 0, newInteractions: 0, error: null };
  }

  // Get existing interactions to avoid duplicates
  const medicineIds = medicines.map((m) => m.id);
  const { data: existing } = await supabase
    .from("drug_interactions")
    .select("medicine_1_id, medicine_2_id")
    .or(`medicine_1_id.in.(${medicineIds.join(",")}),medicine_2_id.in.(${medicineIds.join(",")})`);

  const existingSet = new Set(
    (existing || []).flatMap((e) => [
      `${e.medicine_1_id}-${e.medicine_2_id}`,
      `${e.medicine_2_id}-${e.medicine_1_id}`,
    ])
  );

  // Insert new interactions
  const newInteractions = interactions.filter(
    (i) =>
      !existingSet.has(`${i.medicineId1}-${i.medicineId2}`) &&
      !existingSet.has(`${i.medicineId2}-${i.medicineId1}`)
  );

  if (newInteractions.length > 0) {
    const { error: insertError } = await supabase
      .from("drug_interactions")
      .insert(
        newInteractions.map((i) => ({
          medicine_1_id: i.medicineId1,
          medicine_2_id: i.medicineId2,
          severity: i.severity!,
          description: i.description || "Potential drug interaction detected.",
          source: i.source,
          is_acknowledged: false,
        }))
      );

    if (insertError) {
      console.error("Error inserting interactions:", insertError);
      return {
        success: false,
        interactionsFound: interactions.length,
        newInteractions: 0,
        error: insertError.message
      };
    }
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/medicines");
  revalidatePath("/dashboard/interactions");

  return {
    success: true,
    interactionsFound: interactions.length,
    newInteractions: newInteractions.length,
    error: null
  };
}

// Acknowledge an interaction
export async function acknowledgeInteraction(
  interactionId: string
): Promise<InteractionActionState> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Get interaction
  const { data: interaction } = await supabase
    .from("drug_interactions")
    .select("id, medicine_1_id, medicine_2_id")
    .eq("id", interactionId)
    .single();

  if (!interaction) {
    return { success: false, error: "Interaction not found" };
  }

  // Verify ownership through medicine → family_member chain
  const { data: med1 } = await supabase
    .from("medicines")
    .select("owner_id")
    .eq("id", interaction.medicine_1_id)
    .single();

  const { data: med2 } = await supabase
    .from("medicines")
    .select("owner_id")
    .eq("id", interaction.medicine_2_id)
    .single();

  const ownerIds = [med1?.owner_id, med2?.owner_id].filter(Boolean);

  if (ownerIds.length === 0) {
    return { success: false, error: "Medicine not found" };
  }

  // Check if any of the medicine owners belong to this user
  const { data: members } = await supabase
    .from("family_members")
    .select("id")
    .in("id", ownerIds)
    .eq("created_by", user.id);

  if (!members || members.length === 0) {
    return { success: false, error: "Access denied" };
  }

  // Update interaction
  const { error } = await supabase
    .from("drug_interactions")
    .update({
      is_acknowledged: true,
      acknowledged_at: new Date().toISOString(),
      acknowledged_by: user.id,
    })
    .eq("id", interactionId);

  if (error) {
    console.error("Error acknowledging interaction:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/interactions");

  return { success: true, error: null };
}
```

**Step 2: Commit**

```bash
git add src/actions/interactions.ts
git commit -m "feat: add drug interaction server actions"
```

---

### Task 8: Create Interaction Card Component

**Files:**
- Create: `src/components/interactions/interaction-card.tsx`

**Step 1: Create the component**

```typescript
"use client";

import { useState, useTransition } from "react";
import { Info, AlertTriangle, AlertCircle, Octagon, Check, Pill } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { acknowledgeInteraction } from "@/actions/interactions";
import { SEVERITY_CONFIG } from "@/types/interactions";
import type { InteractionDisplay } from "@/types/interactions";
import { cn } from "@/lib/utils";

interface InteractionCardProps {
  interaction: InteractionDisplay;
  showOwner?: boolean;
}

const SEVERITY_ICONS = {
  info: Info,
  "alert-triangle": AlertTriangle,
  "alert-circle": AlertCircle,
  octagon: Octagon,
};

export function InteractionCard({ interaction, showOwner = false }: InteractionCardProps) {
  const [isPending, startTransition] = useTransition();
  const [isAcknowledged, setIsAcknowledged] = useState(interaction.isAcknowledged);

  const config = SEVERITY_CONFIG[interaction.severity];
  const Icon = SEVERITY_ICONS[config.icon];

  const handleAcknowledge = () => {
    startTransition(async () => {
      const result = await acknowledgeInteraction(interaction.id);
      if (result.success) {
        setIsAcknowledged(true);
      }
    });
  };

  if (isAcknowledged) {
    return null;
  }

  return (
    <Card className={cn("border-l-4", {
      "border-l-blue-500": interaction.severity === "minor",
      "border-l-yellow-500": interaction.severity === "moderate",
      "border-l-orange-500": interaction.severity === "major",
      "border-l-red-500": interaction.severity === "contraindicated",
    })}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Severity icon */}
          <div className={cn("flex-shrink-0 p-2 rounded-lg", config.bgColor)}>
            <Icon className={cn("h-5 w-5", config.color)} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center gap-2 mb-1">
              <Badge
                variant="outline"
                className={cn("text-xs font-medium", config.color)}
              >
                {config.label}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {interaction.source === "openfda" ? "FDA" : interaction.source === "gpt" ? "AI" : "Manual"}
              </Badge>
            </div>

            {/* Medicine names */}
            <div className="flex items-center gap-2 text-sm font-medium mb-2 flex-wrap">
              <span className="flex items-center gap-1">
                <Pill className="h-3 w-3" />
                {interaction.medicine1Name}
              </span>
              <span className="text-muted-foreground">+</span>
              <span className="flex items-center gap-1">
                <Pill className="h-3 w-3" />
                {interaction.medicine2Name}
              </span>
            </div>

            {/* Description */}
            <p className="text-sm text-muted-foreground mb-3">
              {interaction.description}
            </p>

            {showOwner && (
              <p className="text-xs text-muted-foreground mb-3">
                For: {interaction.ownerName}
              </p>
            )}

            {/* Disclaimer */}
            <p className="text-xs text-muted-foreground italic mb-3">
              This is informational only. Always consult a healthcare provider before making changes to your medications.
            </p>

            {/* Acknowledge button */}
            <Button
              size="sm"
              variant="outline"
              onClick={handleAcknowledge}
              disabled={isPending}
              className="min-h-[44px]"
            >
              <Check className="h-4 w-4 mr-2" />
              {isPending ? "Acknowledging..." : "I understand, dismiss"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/interactions/interaction-card.tsx
git commit -m "feat: add interaction card component"
```

---

### Task 9: Create Dashboard Interaction Alert

**Files:**
- Create: `src/components/interactions/interaction-alert.tsx`

**Step 1: Create the alert component**

```typescript
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface InteractionAlertProps {
  count: number;
}

export function InteractionAlert({ count }: InteractionAlertProps) {
  if (count === 0) return null;

  return (
    <Alert variant="destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Drug Interaction Warning</AlertTitle>
      <AlertDescription className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <span>
          {count} potential drug interaction{count !== 1 ? "s" : ""} detected in your
          family&apos;s medications.
        </span>
        <Link href="/dashboard/interactions">
          <Button variant="outline" size="sm" className="min-h-[44px]">
            Review Now
          </Button>
        </Link>
      </AlertDescription>
    </Alert>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/interactions/interaction-alert.tsx
git commit -m "feat: add dashboard interaction alert component"
```

---

### Task 10: Create Interactions Page

**Files:**
- Create: `src/app/(dashboard)/dashboard/interactions/page.tsx`

**Step 1: Create the page**

```typescript
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AlertTriangle, CheckCircle } from "lucide-react";
import { getUnacknowledgedInteractions } from "@/actions/interactions";
import { InteractionCard } from "@/components/interactions/interaction-card";

export default async function InteractionsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: interactions, error } = await getUnacknowledgedInteractions();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Drug Interactions</h1>
        <p className="text-muted-foreground">
          Review potential interactions between your family&apos;s medications
        </p>
      </div>

      {/* Error display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Empty state */}
      {(!interactions || interactions.length === 0) && !error && (
        <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg bg-muted/20">
          <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
          <h3 className="font-semibold mb-1">No Interactions Detected</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            No drug interactions have been detected between your family&apos;s current
            medications. We&apos;ll alert you if any are found.
          </p>
        </div>
      )}

      {/* Disclaimer */}
      {interactions && interactions.length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                Important Disclaimer
              </p>
              <p className="text-yellow-700 dark:text-yellow-300">
                This information is for educational purposes only and is not a substitute
                for professional medical advice. Always consult your doctor or pharmacist
                before making any changes to your medications.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Interaction cards */}
      {interactions && interactions.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">
            {interactions.length} Interaction{interactions.length !== 1 ? "s" : ""} to Review
          </h2>
          <div className="grid gap-4">
            {interactions.map((interaction) => (
              <InteractionCard
                key={interaction.id}
                interaction={interaction}
                showOwner={true}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/app/\(dashboard\)/dashboard/interactions/page.tsx
git commit -m "feat: add interactions page"
```

---

### Task 11: Create Interactions Loading State

**Files:**
- Create: `src/app/(dashboard)/dashboard/interactions/loading.tsx`

**Step 1: Create loading state**

```typescript
import { Skeleton } from "@/components/ui/skeleton";

export default function InteractionsLoading() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div>
        <Skeleton className="h-9 w-48 mb-2" />
        <Skeleton className="h-5 w-80" />
      </div>

      {/* Disclaimer skeleton */}
      <Skeleton className="h-24 w-full rounded-lg" />

      {/* Cards skeleton */}
      <div>
        <Skeleton className="h-7 w-40 mb-4" />
        <div className="grid gap-4">
          <Skeleton className="h-48 rounded-lg" />
          <Skeleton className="h-48 rounded-lg" />
          <Skeleton className="h-48 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/app/\(dashboard\)/dashboard/interactions/loading.tsx
git commit -m "feat: add interactions loading state"
```

---

### Task 12: Update Document Processing to Auto-Check Interactions

**Files:**
- Modify: `src/app/api/documents/[id]/process/route.ts`

**Step 1: Add import at top of file**

Add this import with the other imports:
```typescript
import { checkMemberInteractions } from "@/actions/interactions";
```

**Step 2: Add interaction check after medicines are saved**

Find the block where medicines are saved (after `createMedicinesFromExtraction` is called successfully) and add the interaction check. Look for this section and add the new code after the success check:

After this existing code:
```typescript
if (!result.success) {
  // ... error handling ...
}
```

Add:
```typescript
// Auto-check for drug interactions
try {
  const interactionResult = await checkMemberInteractions(document.owner_id);
  console.log(`Interaction check: ${interactionResult.interactionsFound} found, ${interactionResult.newInteractions} new`);
} catch (interactionError) {
  // Don't fail the whole request if interaction check fails
  console.error("Interaction check error:", interactionError);
}
```

**Step 3: Commit**

```bash
git add src/app/api/documents/\[id\]/process/route.ts
git commit -m "feat: auto-check drug interactions after medicine extraction"
```

---

### Task 13: Update Dashboard with Interaction Alert

**Files:**
- Modify: `src/app/(dashboard)/dashboard/page.tsx`

**Step 1: Add imports**

Add these imports at the top:
```typescript
import { InteractionAlert } from "@/components/interactions/interaction-alert";
```

**Step 2: Add InteractionAlert to JSX**

In the return statement, add the InteractionAlert component after the header and before the stats grid:

```tsx
{/* INTERACTION ALERT */}
<InteractionAlert count={stats.interactionCount} />
```

The dashboard already fetches `interactionCount` in the `getStats` function, so no changes needed there.

**Step 3: Commit**

```bash
git add src/app/\(dashboard\)/dashboard/page.tsx
git commit -m "feat: add interaction alert to dashboard"
```

---

### Task 14: Update CLAUDE.md

**Files:**
- Modify: `CLAUDE.md`

**Step 1: Update development phases**

Change:
```markdown
- Phase 5: Drug Interactions
```

To:
```markdown
- Phase 5: Drug Interactions ✅
```

**Step 2: Add feature documentation**

Add after the Medicine Extraction section:
```markdown
### Drug Interactions (Phase 5) ✅
- Hybrid interaction checking (OpenFDA + GPT fallback)
- Severity levels: minor, moderate, major, contraindicated
- Auto-check when medicines extracted
- Dashboard alert for unacknowledged interactions
- Interaction cards with acknowledge/dismiss
- Medical disclaimer on all interaction information
- Interactions page showing all warnings
```

**Step 3: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: mark Phase 5 Drug Interactions complete"
```

---

### Task 15: Build Verification

**Step 1: Run build**

```bash
npm run build
```

Expected: Build succeeds with no errors

**Step 2: Run lint**

```bash
npm run lint
```

Expected: No lint errors

---

### Task 16: Final Commit and Push

**Step 1: Verify git status**

```bash
git status
```

**Step 2: Push all commits**

```bash
git push origin main
```

---

## Verification Testing

### Manual Test Checklist

1. **Navigate to `/dashboard/interactions`**
   - Should show empty state or existing interactions

2. **Add medicines to a family member**
   - Add at least 2 active medicines
   - Try known interaction pairs (e.g., Aspirin + Ibuprofen, Warfarin + Aspirin)

3. **Upload prescription and extract**
   - Should auto-check for interactions after extraction
   - Check console for interaction check log

4. **View interactions**
   - Interaction cards should show with severity colors
   - Disclaimer should be visible

5. **Acknowledge interaction**
   - Click "I understand, dismiss"
   - Card should disappear
   - Dashboard count should decrease

6. **Dashboard alert**
   - With unacknowledged interactions, alert should show
   - "Review Now" should navigate to interactions page

---

## Completion Checklist

- [ ] Alert component installed
- [ ] Types regenerated from Supabase
- [ ] `src/types/interactions.ts` created
- [ ] `src/lib/openfda.ts` created
- [ ] `src/lib/interaction-gpt.ts` created
- [ ] `src/lib/interactions.ts` created
- [ ] `src/actions/interactions.ts` created
- [ ] `src/components/interactions/interaction-card.tsx` created
- [ ] `src/components/interactions/interaction-alert.tsx` created
- [ ] `src/app/(dashboard)/dashboard/interactions/page.tsx` created
- [ ] `src/app/(dashboard)/dashboard/interactions/loading.tsx` created
- [ ] Document processing triggers interaction check
- [ ] Dashboard shows interaction alert
- [ ] `npm run build` succeeds
- [ ] CLAUDE.md updated
- [ ] All changes committed and pushed
