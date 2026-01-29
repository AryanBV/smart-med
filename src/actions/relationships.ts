"use server";

import { getAuthenticatedUser, type AuthSuccess } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { RelationshipFormState, RelationshipType, RelationshipDisplay } from "@/types/relationships";

// Get all relationships for current user
export async function getRelationships(): Promise<{
  data: RelationshipDisplay[] | null;
  error: string | null;
}> {
  const authResult = await getAuthenticatedUser();
  if (authResult.error) {
    return { data: null, error: authResult.error };
  }
  const { supabase, user } = authResult as AuthSuccess;

  // Get relationships
  const { data: relationships, error: relError } = await supabase
    .from("family_relationships")
    .select("id, member_id, related_member_id, relationship_type");

  if (relError) {
    console.error("Error fetching relationships:", relError);
    return { data: null, error: relError.message };
  }

  // Get all family members for this user to map names
  const { data: members, error: memError } = await supabase
    .from("family_members")
    .select("id, full_name")
    .eq("created_by", user.id);

  if (memError) {
    console.error("Error fetching members:", memError);
    return { data: null, error: memError.message };
  }

  // Create a map of member IDs to names
  const memberMap = new Map(members?.map(m => [m.id, m.full_name]) || []);

  // Filter relationships to only include those where both members belong to user
  const userMemberIds = new Set(members?.map(m => m.id) || []);

  const displayData: RelationshipDisplay[] = (relationships || [])
    .filter(r => userMemberIds.has(r.member_id) && userMemberIds.has(r.related_member_id))
    .map((r) => ({
      id: r.id,
      memberId: r.member_id,
      memberName: memberMap.get(r.member_id) || "Unknown",
      relatedMemberId: r.related_member_id,
      relatedMemberName: memberMap.get(r.related_member_id) || "Unknown",
      relationshipType: r.relationship_type as RelationshipType,
    }));

  return { data: displayData, error: null };
}

// Create a relationship (and its inverse)
export async function createRelationship(
  memberId: string,
  relatedMemberId: string,
  relationshipType: RelationshipType
): Promise<RelationshipFormState> {
  const authResult = await getAuthenticatedUser();
  if (authResult.error) {
    return { success: false, error: authResult.error };
  }
  const { supabase, user } = authResult as AuthSuccess;

  // Validate: can't relate to self
  if (memberId === relatedMemberId) {
    return { success: false, error: "Cannot create relationship with self" };
  }

  // Verify both members belong to the user
  const { data: members } = await supabase
    .from("family_members")
    .select("id")
    .eq("created_by", user.id)
    .in("id", [memberId, relatedMemberId]);

  if (!members || members.length !== 2) {
    return { success: false, error: "Invalid family members" };
  }

  // Determine inverse relationship
  const inverseType = getInverseRelationship(relationshipType);

  // Insert both directions for easier querying
  const { error } = await supabase.from("family_relationships").insert([
    {
      member_id: memberId,
      related_member_id: relatedMemberId,
      relationship_type: relationshipType,
    },
    {
      member_id: relatedMemberId,
      related_member_id: memberId,
      relationship_type: inverseType,
    },
  ]);

  if (error) {
    // Check for duplicate
    if (error.code === "23505") {
      return { success: false, error: "This relationship already exists" };
    }
    console.error("Error creating relationship:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/family");
  revalidatePath("/dashboard/family/tree");
  return { success: true, error: null };
}

// Delete a relationship (and its inverse)
export async function deleteRelationship(
  memberId: string,
  relatedMemberId: string
): Promise<RelationshipFormState> {
  const authResult = await getAuthenticatedUser();
  if (authResult.error) {
    return { success: false, error: authResult.error };
  }
  const { supabase, user } = authResult as AuthSuccess;

  // Verify members belong to user before deleting
  const { data: members } = await supabase
    .from("family_members")
    .select("id")
    .eq("created_by", user.id)
    .in("id", [memberId, relatedMemberId]);

  if (!members || members.length !== 2) {
    return { success: false, error: "Invalid family members" };
  }

  // Delete both directions
  const { error: error1 } = await supabase
    .from("family_relationships")
    .delete()
    .eq("member_id", memberId)
    .eq("related_member_id", relatedMemberId);

  const { error: error2 } = await supabase
    .from("family_relationships")
    .delete()
    .eq("member_id", relatedMemberId)
    .eq("related_member_id", memberId);

  if (error1 || error2) {
    console.error("Error deleting relationship:", error1 || error2);
    return { success: false, error: (error1 || error2)?.message || "Delete failed" };
  }

  revalidatePath("/dashboard/family");
  revalidatePath("/dashboard/family/tree");
  return { success: true, error: null };
}

// Helper: get inverse relationship type
function getInverseRelationship(type: RelationshipType): RelationshipType {
  switch (type) {
    case "parent":
      return "child";
    case "child":
      return "parent";
    case "spouse":
      return "spouse";
    case "sibling":
      return "sibling";
    default:
      return type;
  }
}
