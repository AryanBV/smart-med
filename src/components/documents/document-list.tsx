"use client";

import { useState } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DocumentCard } from "./document-card";
import { DocumentUploadDialog } from "./document-upload-dialog";
import { EmptyDocumentsState } from "./empty-documents-state";
import type { DocumentWithOwner } from "@/types/documents";
import type { FamilyMember } from "@/types/family";

interface DocumentListProps {
  documents: DocumentWithOwner[];
  familyMembers: FamilyMember[];
}

export function DocumentList({ documents, familyMembers }: DocumentListProps) {
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);

  // Handle case: no family members
  if (familyMembers.length === 0) {
    return <EmptyDocumentsState variant="no-family" />;
  }

  // Handle case: no documents yet
  if (documents.length === 0) {
    return (
      <>
        <EmptyDocumentsState
          variant="no-documents"
          onUpload={() => setIsUploadDialogOpen(true)}
        />
        <DocumentUploadDialog
          open={isUploadDialogOpen}
          onOpenChange={setIsUploadDialogOpen}
          familyMembers={familyMembers}
        />
      </>
    );
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <p className="text-muted-foreground">
          {documents.length} document{documents.length !== 1 ? "s" : ""} uploaded
        </p>
        <Button
          onClick={() => setIsUploadDialogOpen(true)}
          className="min-h-[44px]"
        >
          <Upload className="mr-2 h-4 w-4" />
          Upload Document
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {documents.map((doc) => (
          <DocumentCard key={doc.id} document={doc} />
        ))}
      </div>

      <DocumentUploadDialog
        open={isUploadDialogOpen}
        onOpenChange={setIsUploadDialogOpen}
        familyMembers={familyMembers}
      />
    </>
  );
}
