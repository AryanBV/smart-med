"use client";

import { useState, useCallback, useRef } from "react";
import { Loader2, Upload, X, FileText, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { createDocument } from "@/actions/documents";
import {
  ALLOWED_FILE_TYPES,
  MAX_FILE_SIZE,
  isAllowedFileType,
  formatFileSize,
} from "@/types/documents";
import type { FamilyMember } from "@/types/family";

interface DocumentUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  familyMembers: FamilyMember[];
}

export function DocumentUploadDialog({
  open,
  onOpenChange,
  familyMembers,
}: DocumentUploadDialogProps) {
  const [selectedMemberId, setSelectedMemberId] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (!isAllowedFileType(file.type)) {
      return "Invalid file type. Please upload JPG, PNG, WebP, or PDF files.";
    }
    if (file.size > MAX_FILE_SIZE) {
      return `File too large. Maximum size is ${formatFileSize(MAX_FILE_SIZE)}.`;
    }
    return null;
  };

  const handleFileSelect = useCallback((selectedFile: File) => {
    setError(null);
    const validationError = validateFile(selectedFile);
    if (validationError) {
      setError(validationError);
      return;
    }
    setFile(selectedFile);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile) {
        handleFileSelect(droppedFile);
      }
    },
    [handleFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file || !selectedMemberId) {
      setError("Please select a family member and a file.");
      return;
    }

    setIsUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("Not authenticated");
      }

      // Generate unique file path: {user_id}/{uuid}_{original_filename}
      const uniqueId = crypto.randomUUID();
      const filePath = `${user.id}/${uniqueId}_${file.name}`;

      setUploadProgress(10);

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("prescriptions")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      setUploadProgress(60);

      // Create database record via server action
      const result = await createDocument({
        owner_id: selectedMemberId,
        file_path: filePath,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
      });

      if (result.error) {
        // Rollback: delete uploaded file if database insert fails
        await supabase.storage.from("prescriptions").remove([filePath]);
        throw new Error(result.error);
      }

      setUploadProgress(100);

      // Success - close dialog and reset state
      setTimeout(() => {
        onOpenChange(false);
        resetState();
      }, 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const resetState = () => {
    setFile(null);
    setSelectedMemberId("");
    setError(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      resetState();
    }
    onOpenChange(open);
  };

  const getFileIcon = () => {
    if (!file) return <Upload className="h-10 w-10 text-muted-foreground" />;
    if (file.type === "application/pdf") {
      return <FileText className="h-10 w-10 text-red-500" />;
    }
    return <ImageIcon className="h-10 w-10 text-blue-500" />;
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
          <DialogDescription>
            Upload a prescription or medical document for a family member.
            Supported formats: JPG, PNG, WebP, PDF (max 10MB).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Family member selection */}
          <div className="space-y-2">
            <Label htmlFor="member">Family Member *</Label>
            <Select
              value={selectedMemberId}
              onValueChange={setSelectedMemberId}
              disabled={isUploading}
            >
              <SelectTrigger className="min-h-[44px]">
                <SelectValue placeholder="Select family member" />
              </SelectTrigger>
              <SelectContent>
                {familyMembers.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.full_name}
                    {member.is_registered && " (You)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Drag and drop zone */}
          <div className="space-y-2">
            <Label>Document *</Label>
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`
                relative border-2 border-dashed rounded-lg p-8
                flex flex-col items-center justify-center gap-2
                cursor-pointer transition-colors min-h-[160px]
                ${
                  isDragging
                    ? "border-primary bg-primary/5"
                    : "border-muted-foreground/25 hover:border-primary/50"
                }
                ${isUploading ? "pointer-events-none opacity-60" : ""}
              `}
            >
              {getFileIcon()}

              {file ? (
                <div className="text-center">
                  <p className="font-medium truncate max-w-[300px]">
                    {file.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatFileSize(file.size)}
                  </p>
                  {!isUploading && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="mt-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFile(null);
                        if (fileInputRef.current) {
                          fileInputRef.current.value = "";
                        }
                      }}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                  )}
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    Drag and drop a file here, or click to browse
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    JPG, PNG, WebP, or PDF up to 10MB
                  </p>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept={ALLOWED_FILE_TYPES.join(",")}
                onChange={handleInputChange}
                className="hidden"
                disabled={isUploading}
              />
            </div>
          </div>

          {/* Progress bar */}
          {isUploading && (
            <div className="space-y-1">
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground text-center">
                {uploadProgress < 60
                  ? "Uploading file..."
                  : "Saving document..."}
              </p>
            </div>
          )}

          {/* Error display */}
          {error && (
            <div className="text-sm text-red-600 bg-red-50 dark:bg-red-950/50 p-3 rounded-md">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isUploading}
            className="min-h-[44px]"
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!file || !selectedMemberId || isUploading}
            className="min-h-[44px]"
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
