"use server";

import { revalidatePath } from "next/cache";
import { getAuthenticatedUser, type AuthSuccess } from "@/lib/supabase/server";
import type {
  DocumentActionState,
  DocumentWithOwner,
  DocumentUploadData,
} from "@/types/documents";

// Get all documents for current user (via family members)
export async function getDocuments(): Promise<{
  error?: string;
  data: DocumentWithOwner[];
}> {
  const authResult = await getAuthenticatedUser();
  if (authResult.error) {
    return { error: authResult.error, data: [] };
  }
  const { supabase, user } = authResult as AuthSuccess;

  // Get user's family member IDs first
  const { data: familyMembers, error: familyError } = await supabase
    .from("family_members")
    .select("id")
    .eq("created_by", user.id);

  if (familyError) {
    return { error: familyError.message, data: [] };
  }

  if (!familyMembers || familyMembers.length === 0) {
    return { data: [] };
  }

  const memberIds = familyMembers.map((m) => m.id);

  // Get documents with owner info
  const { data, error } = await supabase
    .from("documents")
    .select(
      `
      *,
      owner:family_members!inner(id, full_name)
    `
    )
    .in("owner_id", memberIds)
    .order("uploaded_at", { ascending: false });

  if (error) {
    return { error: error.message, data: [] };
  }

  // Transform to match DocumentWithOwner type
  const documents: DocumentWithOwner[] = (data || []).map((doc) => ({
    ...doc,
    owner: doc.owner as { id: string; full_name: string },
  }));

  return { data: documents };
}

// Create document record (called after successful storage upload)
export async function createDocument(
  uploadData: DocumentUploadData
): Promise<DocumentActionState> {
  const authResult = await getAuthenticatedUser();
  if (authResult.error) {
    return { error: authResult.error };
  }
  const { supabase, user } = authResult;

  // Verify owner_id belongs to user's family (defense in depth beyond RLS)
  const { data: familyMember, error: memberError } = await supabase
    .from("family_members")
    .select("id")
    .eq("id", uploadData.owner_id)
    .eq("created_by", user.id)
    .single();

  if (memberError || !familyMember) {
    return { error: "Invalid family member" };
  }

  const { data, error } = await supabase
    .from("documents")
    .insert({
      owner_id: uploadData.owner_id,
      file_path: uploadData.file_path,
      file_name: uploadData.file_name,
      file_type: uploadData.file_type,
      file_size: uploadData.file_size,
      ocr_status: "pending",
    })
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/documents");

  return { success: true, data };
}

// Delete document (storage + database record)
export async function deleteDocument(
  documentId: string
): Promise<DocumentActionState> {
  const authResult = await getAuthenticatedUser();
  if (authResult.error) {
    return { error: authResult.error };
  }
  const { supabase, user } = authResult;

  // Get document with ownership check via family_members join
  const { data: doc, error: fetchError } = await supabase
    .from("documents")
    .select(
      `
      id,
      file_path,
      owner:family_members!inner(created_by)
    `
    )
    .eq("id", documentId)
    .single();

  if (fetchError || !doc) {
    return { error: "Document not found" };
  }

  // Verify ownership
  const owner = doc.owner as { created_by: string };
  if (owner.created_by !== user.id) {
    return { error: "Access denied" };
  }

  // Delete from database first
  const { error: deleteError } = await supabase
    .from("documents")
    .delete()
    .eq("id", documentId);

  if (deleteError) {
    return { error: deleteError.message };
  }

  // Delete from storage (continue even if this fails - DB record is gone)
  const { error: storageError } = await supabase.storage
    .from("prescriptions")
    .remove([doc.file_path]);

  if (storageError) {
    console.error("Storage deletion failed:", storageError.message);
    // Don't return error - database record is already deleted
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/documents");

  return { success: true };
}

// Get signed URL for viewing a document
export async function getDocumentUrl(
  filePath: string
): Promise<{ url?: string; error?: string }> {
  const authResult = await getAuthenticatedUser();
  if (authResult.error) {
    return { error: authResult.error };
  }
  const { supabase, user } = authResult;

  // Verify user owns this file path (path starts with user ID)
  if (!filePath.startsWith(user.id)) {
    return { error: "Access denied" };
  }

  const { data, error } = await supabase.storage
    .from("prescriptions")
    .createSignedUrl(filePath, 60 * 60); // 1 hour expiry

  if (error) {
    return { error: error.message };
  }

  return { url: data.signedUrl };
}
