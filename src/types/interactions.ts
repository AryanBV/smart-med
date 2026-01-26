import type { Tables, TablesInsert } from "./database";

// Database types
export type DrugInteraction = Tables<"drug_interactions">;
export type DrugInteractionInsert = TablesInsert<"drug_interactions">;

// Severity levels (matches DB enum: minor, moderate, major, contraindicated)
export type InteractionSeverity = "minor" | "moderate" | "major" | "contraindicated";

// Source of interaction data
export type InteractionSource = "openfda" | "gpt" | "manual";

// For UI display
export interface InteractionDisplay {
  id: string;
  medicine1Id: string;
  medicine1Name: string;
  medicine2Id: string;
  medicine2Name: string;
  severity: InteractionSeverity;
  description: string;
  source: InteractionSource;
  isAcknowledged: boolean;
  acknowledgedAt: string | null;
  createdAt: string;
  ownerName: string;
  ownerId: string;
}

// Interaction check result (before DB insert)
export interface InteractionCheckResult {
  medicine1: string;
  medicine2: string;
  hasInteraction: boolean;
  severity: InteractionSeverity | null;
  description: string | null;
  source: InteractionSource;
}

// Action states
export interface InteractionActionState {
  success: boolean;
  error: string | null;
}

export interface CheckInteractionsResult {
  success: boolean;
  interactionsFound: number;
  newInteractions: number;
  error: string | null;
}

// Severity display config
export const SEVERITY_CONFIG: Record<InteractionSeverity, {
  label: string;
  color: string;
  bgColor: string;
  icon: "info" | "alert-triangle" | "alert-circle" | "octagon";
}> = {
  minor: {
    label: "Minor",
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
    icon: "info",
  },
  moderate: {
    label: "Moderate",
    color: "text-yellow-600 dark:text-yellow-400",
    bgColor: "bg-yellow-100 dark:bg-yellow-900/30",
    icon: "alert-triangle",
  },
  major: {
    label: "Major",
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-100 dark:bg-orange-900/30",
    icon: "alert-circle",
  },
  contraindicated: {
    label: "Contraindicated",
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-100 dark:bg-red-900/30",
    icon: "octagon",
  },
};
