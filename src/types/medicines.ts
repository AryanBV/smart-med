import type { Tables, TablesInsert } from "./database";

// Database types
export type Medicine = Tables<"medicines">;
export type MedicineInsert = TablesInsert<"medicines">;

// For UI display with owner name
export interface MedicineDisplay {
  id: string;
  name: string;
  dosage: string | null;
  frequency: string | null;
  duration: string | null;
  instructions: string | null;
  isActive: boolean;
  ownerName: string;
  ownerId: string;
  documentId: string | null;
  createdAt: string;
}

// Extracted medicine from GPT (before DB insert)
export interface ExtractedMedicine {
  name: string;
  dosage: string | null;
  frequency: string | null;
  duration: string | null;
  instructions: string | null;
}

// GPT response format
export interface ExtractionResult {
  success: boolean;
  medicines: ExtractedMedicine[];
  rawText: string | null;
  error: string | null;
}

// Action states
export interface MedicineActionState {
  success: boolean;
  error: string | null;
}

export interface ProcessDocumentResult {
  success: boolean;
  medicinesExtracted: number;
  error: string | null;
}
