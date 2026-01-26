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
