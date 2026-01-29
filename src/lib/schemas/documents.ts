import { z } from "zod";

export const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const documentUploadSchema = z.object({
  owner_id: z.string().uuid("Invalid owner ID"),
  file_name: z.string().min(1, "File name required").max(255),
  file_type: z.enum(ALLOWED_MIME_TYPES, {
    message: "Invalid file type. Only JPG, PNG, and WebP are allowed.",
  }),
  file_size: z.number().max(MAX_FILE_SIZE, "File too large (max 10MB)"),
});

export type DocumentUploadInput = z.infer<typeof documentUploadSchema>;

export const documentDeleteSchema = z.object({
  document_id: z.string().uuid("Invalid document ID"),
});

export type DocumentDeleteInput = z.infer<typeof documentDeleteSchema>;
