import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  extractMedicinesFromImage,
  extractMedicinesFromPDF,
} from "@/lib/extraction";
import { createMedicinesFromExtraction } from "@/actions/medicines";
import { checkMemberInteractions } from "@/actions/interactions";
import { isOpenAIConfigured } from "@/lib/openai";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: documentId } = await params;

    if (!isOpenAIConfigured()) {
      return NextResponse.json(
        {
          error:
            "OpenAI API key not configured. Add OPENAI_API_KEY to .env.local",
        },
        { status: 503 }
      );
    }

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Rate limiting: 10 requests per minute per user
    const rateLimitResult = rateLimit(`process:${user.id}`, 10, 60000);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded. Please try again in a minute.",
          retryAfter: Math.ceil(rateLimitResult.resetIn / 1000),
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil(rateLimitResult.resetIn / 1000)),
          },
        }
      );
    }

    // Get document
    const { data: document, error: docError } = await supabase
      .from("documents")
      .select("id, file_path, file_type, ocr_status, owner_id")
      .eq("id", documentId)
      .single();

    if (docError || !document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // Verify ownership
    const { data: member } = await supabase
      .from("family_members")
      .select("created_by")
      .eq("id", document.owner_id)
      .single();

    if (!member || member.created_by !== user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Atomic check-and-update in single operation
    const { data: updated, error: updateError } = await supabase
      .from("documents")
      .update({ ocr_status: "processing" })
      .eq("id", documentId)
      .eq("ocr_status", "pending") // Only update if still pending
      .select()
      .single();

    if (updateError || !updated) {
      return NextResponse.json(
        { error: "Document already processing or completed" },
        { status: 409 }
      );
    }

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("prescriptions")
      .download(updated.file_path);

    if (downloadError || !fileData) {
      await supabase
        .from("documents")
        .update({
          ocr_status: "failed",
          ocr_error: "Failed to download file from storage",
        })
        .eq("id", documentId);

      return NextResponse.json(
        { error: "Failed to download file" },
        { status: 500 }
      );
    }

    // Convert to base64
    const arrayBuffer = await fileData.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");

    // Extract medicines
    const isPdf = updated.file_type === "application/pdf";
    const extraction = isPdf
      ? await extractMedicinesFromPDF()
      : await extractMedicinesFromImage(base64, updated.file_type);

    if (!extraction.success) {
      await supabase
        .from("documents")
        .update({
          ocr_status: "failed",
          ocr_text: extraction.rawText,
          ocr_error: extraction.error,
        })
        .eq("id", documentId);

      return NextResponse.json(
        {
          error: extraction.error || "Extraction failed",
          rawText: extraction.rawText,
        },
        { status: 422 }
      );
    }

    // Save medicines
    if (extraction.medicines.length > 0) {
      const result = await createMedicinesFromExtraction(
        documentId,
        updated.owner_id,
        extraction.medicines
      );

      if (!result.success) {
        await supabase
          .from("documents")
          .update({
            ocr_status: "failed",
            ocr_text: extraction.rawText,
            ocr_error: result.error,
          })
          .eq("id", documentId);

        return NextResponse.json(
          { error: result.error || "Failed to save medicines" },
          { status: 500 }
        );
      }

      // Auto-check for drug interactions
      try {
        const interactionResult = await checkMemberInteractions(updated.owner_id);
        console.log(`Interaction check: ${interactionResult.interactionsFound} found, ${interactionResult.newInteractions} new`);
      } catch (interactionError) {
        // Don't fail the whole request if interaction check fails
        console.error("Interaction check error:", interactionError);
      }
    }

    // Update document with success
    await supabase
      .from("documents")
      .update({
        ocr_status: "completed",
        ocr_text: extraction.rawText,
        ocr_error: null,
        processed_at: new Date().toISOString(),
      })
      .eq("id", documentId);

    return NextResponse.json({
      success: true,
      medicinesExtracted: extraction.medicines.length,
      medicines: extraction.medicines,
    });
  } catch (error) {
    console.error("Process document error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
