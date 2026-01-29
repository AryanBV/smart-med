import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  extractMedicinesFromImage,
  extractMedicinesFromPDF,
} from "@/lib/extraction";
import { createMedicinesFromExtraction } from "@/actions/medicines";
import { checkMemberInteractions } from "@/actions/interactions";
import { isOpenAIConfigured } from "@/lib/openai";

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

    if (document.ocr_status === "completed") {
      return NextResponse.json(
        { error: "Document already processed" },
        { status: 400 }
      );
    }

    // Update status to processing
    await supabase
      .from("documents")
      .update({ ocr_status: "processing" })
      .eq("id", documentId);

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("prescriptions")
      .download(document.file_path);

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
    const isPdf = document.file_type === "application/pdf";
    const extraction = isPdf
      ? await extractMedicinesFromPDF()
      : await extractMedicinesFromImage(base64, document.file_type);

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
        document.owner_id,
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
        const interactionResult = await checkMemberInteractions(document.owner_id);
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
