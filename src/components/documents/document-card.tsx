"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  Image as ImageIcon,
  Eye,
  Trash2,
  MoreVertical,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog";
import { OcrStatusBadge } from "./ocr-status-badge";
import { deleteDocument, getDocumentUrl } from "@/actions/documents";
import { formatFileSize } from "@/types/documents";
import type { DocumentWithOwner } from "@/types/documents";

interface DocumentCardProps {
  document: DocumentWithOwner;
}

export function DocumentCard({ document }: DocumentCardProps) {
  const router = useRouter();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoadingUrl, setIsLoadingUrl] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractionError, setExtractionError] = useState<string | null>(null);

  const isPdf = document.file_type === "application/pdf";

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const handleView = async () => {
    setIsLoadingUrl(true);
    try {
      const { url, error } = await getDocumentUrl(document.file_path);
      if (error) {
        alert(`Failed to load document: ${error}`);
        return;
      }
      if (url) {
        window.open(url, "_blank");
      }
    } finally {
      setIsLoadingUrl(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteDocument(document.id);
      if (result.error) {
        alert(`Failed to delete: ${result.error}`);
      }
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleProcess = async () => {
    setIsProcessing(true);
    setExtractionError(null);

    try {
      const response = await fetch(`/api/documents/${document.id}/process`, {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        setExtractionError(data.error || "Extraction failed");
        return;
      }

      // Success - refresh page to show updated status
      router.refresh();
    } catch (error) {
      console.error("Process error:", error);
      setExtractionError("Failed to process document");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <div className="rounded-lg border bg-card p-4 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="h-12 w-12 flex-shrink-0 rounded-lg bg-muted flex items-center justify-center">
              {isPdf ? (
                <FileText className="h-6 w-6 text-red-500" />
              ) : (
                <ImageIcon className="h-6 w-6 text-blue-500" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h3
                className="font-medium truncate"
                title={document.file_name}
              >
                {document.file_name}
              </h3>
              <p className="text-sm text-muted-foreground">
                For: {document.owner.full_name}
              </p>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 flex-shrink-0"
              >
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleView} disabled={isLoadingUrl}>
                <Eye className="h-4 w-4 mr-2" />
                {isLoadingUrl ? "Loading..." : "View"}
              </DropdownMenuItem>
              {document.ocr_status === "pending" && (
                <DropdownMenuItem
                  onClick={handleProcess}
                  disabled={isProcessing || isPdf}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  {isProcessing ? "Processing..." : "Extract Medicines"}
                </DropdownMenuItem>
              )}
              {document.ocr_status === "failed" && (
                <DropdownMenuItem
                  onClick={handleProcess}
                  disabled={isProcessing}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Retry Extraction
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={() => setShowDeleteDialog(true)}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-2">
            <OcrStatusBadge status={document.ocr_status} />
            <span className="text-xs text-muted-foreground">
              {formatFileSize(document.file_size)}
            </span>
          </div>
          <span className="text-xs text-muted-foreground">
            {formatDate(document.uploaded_at)}
          </span>
        </div>

        {extractionError && (
          <div className="mt-2">
            <p className="text-xs text-red-600">{extractionError}</p>
          </div>
        )}
      </div>

      <DeleteConfirmationDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete Document?"
        description={`Are you sure you want to delete "${document.file_name}"? This will permanently remove the document. This action cannot be undone.`}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />
    </>
  );
}
