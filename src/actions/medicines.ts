"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type {
  MedicineDisplay,
  MedicineActionState,
  ExtractedMedicine,
} from "@/types/medicines";

// Get medicines for a family member
export async function getMedicinesByMember(memberId: string): Promise<{
  data: MedicineDisplay[] | null;
  error: string | null;
}> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { data: null, error: "Not authenticated" };
  }

  const { data: member } = await supabase
    .from("family_members")
    .select("id, full_name, created_by")
    .eq("id", memberId)
    .single();

  if (!member || member.created_by !== user.id) {
    return { data: null, error: "Family member not found" };
  }

  const { data: medicines, error } = await supabase
    .from("medicines")
    .select("*")
    .eq("owner_id", memberId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching medicines:", error);
    return { data: null, error: error.message };
  }

  const displayData: MedicineDisplay[] = (medicines || []).map((med) => ({
    id: med.id,
    name: med.name,
    dosage: med.dosage,
    frequency: med.frequency,
    duration: med.duration,
    instructions: med.instructions,
    isActive: med.is_active ?? true,
    ownerName: member.full_name,
    ownerId: med.owner_id,
    documentId: med.document_id,
    createdAt: med.created_at,
  }));

  return { data: displayData, error: null };
}

// Get medicines by document
export async function getMedicinesByDocument(documentId: string): Promise<{
  data: MedicineDisplay[] | null;
  error: string | null;
}> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { data: null, error: "Not authenticated" };
  }

  // Get medicines with owner info
  const { data: medicines, error } = await supabase
    .from("medicines")
    .select("*")
    .eq("document_id", documentId);

  if (error) {
    console.error("Error fetching medicines:", error);
    return { data: null, error: error.message };
  }

  if (!medicines || medicines.length === 0) {
    return { data: [], error: null };
  }

  // Get owner info separately
  const ownerIds = [...new Set(medicines.map((m) => m.owner_id))];
  const { data: members } = await supabase
    .from("family_members")
    .select("id, full_name, created_by")
    .in("id", ownerIds);

  const memberMap = new Map(members?.map((m) => [m.id, m]) || []);

  // Filter to only user's medicines and map
  const displayData: MedicineDisplay[] = medicines
    .filter((med) => {
      const member = memberMap.get(med.owner_id);
      return member?.created_by === user.id;
    })
    .map((med) => ({
      id: med.id,
      name: med.name,
      dosage: med.dosage,
      frequency: med.frequency,
      duration: med.duration,
      instructions: med.instructions,
      isActive: med.is_active ?? true,
      ownerName: memberMap.get(med.owner_id)?.full_name || "Unknown",
      ownerId: med.owner_id,
      documentId: med.document_id,
      createdAt: med.created_at,
    }));

  return { data: displayData, error: null };
}

// Get active medicine count for dashboard
export async function getActiveMedicineCount(): Promise<number> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return 0;

  const { data: members } = await supabase
    .from("family_members")
    .select("id")
    .eq("created_by", user.id);

  if (!members || members.length === 0) return 0;

  const memberIds = members.map((m) => m.id);

  const { count, error } = await supabase
    .from("medicines")
    .select("*", { count: "exact", head: true })
    .in("owner_id", memberIds)
    .eq("is_active", true);

  if (error) {
    console.error("Error counting medicines:", error);
    return 0;
  }

  return count || 0;
}

// Create medicines from extraction
export async function createMedicinesFromExtraction(
  documentId: string,
  ownerId: string,
  medicines: ExtractedMedicine[]
): Promise<MedicineActionState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const { data: member } = await supabase
    .from("family_members")
    .select("id, created_by")
    .eq("id", ownerId)
    .single();

  if (!member || member.created_by !== user.id) {
    return { success: false, error: "Family member not found" };
  }

  const medicineRecords = medicines.map((med) => ({
    owner_id: ownerId,
    document_id: documentId,
    name: med.name,
    dosage: med.dosage,
    frequency: med.frequency,
    duration: med.duration,
    instructions: med.instructions,
    is_active: true,
  }));

  const { error } = await supabase.from("medicines").insert(medicineRecords);

  if (error) {
    console.error("Error creating medicines:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/documents");
  revalidatePath("/dashboard/medicines");

  return { success: true, error: null };
}

// Toggle medicine active status
export async function toggleMedicineActive(
  medicineId: string
): Promise<MedicineActionState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Get medicine
  const { data: medicine, error: fetchError } = await supabase
    .from("medicines")
    .select("id, is_active, owner_id")
    .eq("id", medicineId)
    .single();

  if (fetchError || !medicine) {
    return { success: false, error: "Medicine not found" };
  }

  // Verify ownership
  const { data: member } = await supabase
    .from("family_members")
    .select("created_by")
    .eq("id", medicine.owner_id)
    .single();

  if (!member || member.created_by !== user.id) {
    return { success: false, error: "Access denied" };
  }

  const { error } = await supabase
    .from("medicines")
    .update({ is_active: !medicine.is_active })
    .eq("id", medicineId);

  if (error) {
    console.error("Error toggling medicine:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/medicines");

  return { success: true, error: null };
}

// Delete medicine
export async function deleteMedicine(
  medicineId: string
): Promise<MedicineActionState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Get medicine with ownership check
  const { data: medicine } = await supabase
    .from("medicines")
    .select("id, owner_id")
    .eq("id", medicineId)
    .single();

  if (!medicine) {
    return { success: false, error: "Medicine not found" };
  }

  // Verify ownership
  const { data: member } = await supabase
    .from("family_members")
    .select("created_by")
    .eq("id", medicine.owner_id)
    .single();

  if (!member || member.created_by !== user.id) {
    return { success: false, error: "Access denied" };
  }

  const { error } = await supabase
    .from("medicines")
    .delete()
    .eq("id", medicineId);

  if (error) {
    console.error("Error deleting medicine:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/medicines");

  return { success: true, error: null };
}
