"use server";

import { getAuthenticatedUser, type AuthSuccess } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { glucoseReadingSchema } from "@/lib/schemas/glucose";
import type { GlucoseDisplay, GlucoseActionState } from "@/types/glucose";
import type { Database } from "@/types/database";

// Get glucose readings for all family members or a specific member
export async function getGlucoseReadings(memberId?: string): Promise<{
  data: GlucoseDisplay[] | null;
  error: string | null;
}> {
  const authResult = await getAuthenticatedUser();
  if (authResult.error) {
    return { data: null, error: authResult.error };
  }
  const { supabase, user } = authResult as AuthSuccess;

  // Build query with join to get owner name and verify ownership
  let query = supabase
    .from("glucose_readings")
    .select(
      `
      id,
      owner_id,
      value,
      unit,
      reading_type,
      meal_context,
      notes,
      recorded_at,
      created_at,
      family_members!inner(full_name, created_by)
    `
    )
    .eq("family_members.created_by", user.id)
    .order("recorded_at", { ascending: false });

  if (memberId) {
    query = query.eq("owner_id", memberId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching glucose readings:", error);
    return { data: null, error: error.message };
  }

  // Transform to display type
  const displayData: GlucoseDisplay[] = (data || []).map((reading) => ({
    id: reading.id,
    owner_id: reading.owner_id,
    value: reading.value,
    unit: reading.unit,
    reading_type: reading.reading_type as GlucoseDisplay["reading_type"],
    meal_context: reading.meal_context as GlucoseDisplay["meal_context"],
    notes: reading.notes,
    recorded_at: reading.recorded_at,
    created_at: reading.created_at,
    ownerName: (reading.family_members as { full_name: string }).full_name,
  }));

  return { data: displayData, error: null };
}

// Get glucose reading count for dashboard
export async function getGlucoseReadingCount(): Promise<number> {
  const authResult = await getAuthenticatedUser();
  if (authResult.error) return 0;
  const { supabase, user } = authResult as AuthSuccess;

  // Get user's family members first
  const { data: members } = await supabase
    .from("family_members")
    .select("id")
    .eq("created_by", user.id);

  if (!members || members.length === 0) return 0;

  const memberIds = members.map((m) => m.id);

  const { count, error } = await supabase
    .from("glucose_readings")
    .select("*", { count: "exact", head: true })
    .in("owner_id", memberIds);

  if (error) {
    console.error("Error counting glucose readings:", error);
    return 0;
  }

  return count || 0;
}

// Create a new glucose reading
export async function createGlucoseReading(
  ownerId: string,
  value: number,
  readingType: string,
  mealContext: string | null,
  notes: string | null,
  recordedAt: string
): Promise<GlucoseActionState> {
  const authResult = await getAuthenticatedUser();
  if (authResult.error) {
    return { success: false, error: authResult.error };
  }
  const { supabase, user } = authResult as AuthSuccess;

  // Validate input with Zod
  const parsed = glucoseReadingSchema.safeParse({
    owner_id: ownerId,
    value,
    reading_type: readingType,
    meal_context: mealContext || null,
    notes: notes || null,
    recorded_at: recordedAt,
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  // Verify ownership of family member
  const { data: member } = await supabase
    .from("family_members")
    .select("id, created_by")
    .eq("id", ownerId)
    .single();

  if (!member || member.created_by !== user.id) {
    return { success: false, error: "Family member not found" };
  }

  // Insert reading
  const { data, error } = await supabase
    .from("glucose_readings")
    .insert({
      owner_id: ownerId,
      value,
      reading_type: readingType as Database["public"]["Enums"]["reading_type"],
      meal_context: (mealContext || null) as Database["public"]["Enums"]["meal_context"] | null,
      notes: notes || null,
      recorded_at: recordedAt,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating glucose reading:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/glucose");

  return { success: true, data };
}

// Delete a glucose reading
export async function deleteGlucoseReading(
  readingId: string
): Promise<GlucoseActionState> {
  const authResult = await getAuthenticatedUser();
  if (authResult.error) {
    return { success: false, error: authResult.error };
  }
  const { supabase, user } = authResult as AuthSuccess;

  // Get reading to verify ownership
  const { data: reading } = await supabase
    .from("glucose_readings")
    .select("id, owner_id")
    .eq("id", readingId)
    .single();

  if (!reading) {
    return { success: false, error: "Reading not found" };
  }

  // Verify ownership through family_members
  const { data: member } = await supabase
    .from("family_members")
    .select("created_by")
    .eq("id", reading.owner_id)
    .single();

  if (!member || member.created_by !== user.id) {
    return { success: false, error: "Access denied" };
  }

  // Delete reading
  const { error } = await supabase
    .from("glucose_readings")
    .delete()
    .eq("id", readingId);

  if (error) {
    console.error("Error deleting glucose reading:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/glucose");

  return { success: true };
}
