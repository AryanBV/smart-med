import type { Tables, TablesInsert, DocumentStatus } from "./database";

// Database types
export type Document = Tables<"documents">;
export type DocumentInsert = TablesInsert<"documents">;

// Extended type with owner name (from join)
export type DocumentWithOwner = Document & {
  owner: {
    id: string;
    full_name: string;
  };
};

// Action state following existing pattern
export type DocumentActionState = {
  error?: string;
  success?: boolean;
  data?: Document;
};

// Upload form data
export type DocumentUploadData = {
  owner_id: string;
  file_path: string;
  file_name: string;
  file_type: string;
  file_size: number;
};

// Allowed file types
export const ALLOWED_FILE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
] as const;

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export type AllowedFileType = (typeof ALLOWED_FILE_TYPES)[number];

// Helper to check file type
export function isAllowedFileType(type: string): type is AllowedFileType {
  return ALLOWED_FILE_TYPES.includes(type as AllowedFileType);
}

// Helper to format file size
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Re-export DocumentStatus for convenience
export type { DocumentStatus };
