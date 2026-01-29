"use server";

import { revalidatePath } from "next/cache";
import { getAuthenticatedUser, type AuthSuccess } from "@/lib/supabase/server";
import { familyMemberSchema } from "@/lib/schemas/family";
import type { FamilyActionState, FamilyMember } from "@/types/family";
import type { Gender } from "@/types/database";

export async function getFamilyMembers(): Promise<{
  error?: string;
  data: FamilyMember[];
}> {
  const authResult = await getAuthenticatedUser();
  if (authResult.error) {
    return { error: authResult.error, data: [] };
  }
  const { supabase, user } = authResult as AuthSuccess;

  const { data, error } = await supabase
    .from("family_members")
    .select("*")
    .eq("created_by", user.id)
    .order("created_at", { ascending: true });

  if (error) {
    return { error: error.message, data: [] };
  }

  return { data: data || [] };
}

export async function getFamilyMemberCount(): Promise<number> {
  const authResult = await getAuthenticatedUser();
  if (authResult.error) return 0;
  const { supabase, user } = authResult as AuthSuccess;

  const { count, error } = await supabase
    .from("family_members")
    .select("*", { count: "exact", head: true })
    .eq("created_by", user.id);

  if (error) return 0;
  return count || 0;
}

export async function createFamilyMember(
  prevState: FamilyActionState,
  formData: FormData
): Promise<FamilyActionState> {
  const authResult = await getAuthenticatedUser();
  if (authResult.error) {
    return { error: authResult.error };
  }
  const { supabase, user } = authResult as AuthSuccess;

  const full_name = formData.get("full_name") as string;
  const date_of_birth = formData.get("date_of_birth") as string | null;
  const gender = formData.get("gender") as string | null;

  // Zod validation
  const parsed = familyMemberSchema.safeParse({
    full_name,
    date_of_birth: date_of_birth || null,
    gender: gender || null,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { data, error } = await supabase
    .from("family_members")
    .insert({
      created_by: user.id,
      full_name: parsed.data.full_name.trim(),
      date_of_birth: parsed.data.date_of_birth || null,
      gender: (parsed.data.gender as Gender) || null,
      is_registered: false,
    })
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/family");

  return { success: true, data };
}

export async function updateFamilyMember(
  memberId: string,
  prevState: FamilyActionState,
  formData: FormData
): Promise<FamilyActionState> {
  const authResult = await getAuthenticatedUser();
  if (authResult.error) {
    return { error: authResult.error };
  }
  const { supabase, user } = authResult as AuthSuccess;

  const full_name = formData.get("full_name") as string;
  const date_of_birth = formData.get("date_of_birth") as string | null;
  const gender = formData.get("gender") as string | null;

  // Zod validation
  const parsed = familyMemberSchema.safeParse({
    full_name,
    date_of_birth: date_of_birth || null,
    gender: gender || null,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { data, error } = await supabase
    .from("family_members")
    .update({
      full_name: parsed.data.full_name.trim(),
      date_of_birth: parsed.data.date_of_birth || null,
      gender: (parsed.data.gender as Gender) || null,
    })
    .eq("id", memberId)
    .eq("created_by", user.id) // Security: only update own family members
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/family");

  return { success: true, data };
}

export async function deleteFamilyMember(
  memberId: string
): Promise<FamilyActionState> {
  const authResult = await getAuthenticatedUser();
  if (authResult.error) {
    return { error: authResult.error };
  }
  const { supabase, user } = authResult as AuthSuccess;

  const { error } = await supabase
    .from("family_members")
    .delete()
    .eq("id", memberId)
    .eq("created_by", user.id); // Security: only delete own family members

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/family");

  return { success: true };
}

export async function addSelfAsFamilyMember(): Promise<FamilyActionState> {
  const authResult = await getAuthenticatedUser();
  if (authResult.error) {
    return { error: authResult.error };
  }
  const { supabase, user } = authResult as AuthSuccess;

  // Get user's profile for name
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  const fullName =
    profile?.full_name ||
    user.user_metadata?.full_name ||
    user.email?.split("@")[0] ||
    "Me";

  // Check if user already added themselves
  const { data: existing } = await supabase
    .from("family_members")
    .select("id")
    .eq("created_by", user.id)
    .eq("profile_id", user.id)
    .single();

  if (existing) {
    return { error: "You have already added yourself to the family" };
  }

  const { data, error } = await supabase
    .from("family_members")
    .insert({
      created_by: user.id,
      profile_id: user.id, // Links to their profile
      full_name: fullName,
      is_registered: true,
    })
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/family");

  return { success: true, data };
}
