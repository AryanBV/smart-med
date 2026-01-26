"use client";

import { FileText, Users, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface EmptyDocumentsStateProps {
  variant: "no-family" | "no-documents";
  onUpload?: () => void;
}

export function EmptyDocumentsState({
  variant,
  onUpload,
}: EmptyDocumentsStateProps) {
  if (variant === "no-family") {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className="rounded-full bg-primary/10 p-4 mb-4">
          <Users className="h-8 w-8 text-primary" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Add Family Members First</h3>
        <p className="text-muted-foreground text-center max-w-md mb-6">
          Before uploading documents, you need to add at least one family
          member. Documents are linked to family members for organization.
        </p>
        <Link href="/dashboard/family">
          <Button className="min-h-[44px]">
            <Users className="mr-2 h-4 w-4" />
            Go to Family
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="rounded-full bg-primary/10 p-4 mb-4">
        <FileText className="h-8 w-8 text-primary" />
      </div>
      <h3 className="text-lg font-semibold mb-2">No Documents Yet</h3>
      <p className="text-muted-foreground text-center max-w-md mb-6">
        Upload prescription documents to automatically extract medicines and
        check for drug interactions. Supported formats: JPG, PNG, WebP, PDF.
      </p>
      <Button onClick={onUpload} className="min-h-[44px]">
        <Upload className="mr-2 h-4 w-4" />
        Upload Your First Document
      </Button>
    </div>
  );
}
