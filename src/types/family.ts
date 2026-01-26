import { Tables, TablesInsert, TablesUpdate, Gender } from "./database";

// Re-export database types for convenience
export type FamilyMember = Tables<"family_members">;
export type FamilyMemberInsert = TablesInsert<"family_members">;
export type FamilyMemberUpdate = TablesUpdate<"family_members">;

export type FamilyRelationship = Tables<"family_relationships">;

// Form state types
export type FamilyMemberFormData = {
  full_name: string;
  date_of_birth?: string;
  gender?: Gender;
};

// Action state types
export type FamilyActionState = {
  error?: string;
  success?: boolean;
  data?: FamilyMember;
};

// Extended family member with relationship info (for future use in Phase 3B)
export type FamilyMemberWithRelations = FamilyMember & {
  relationships?: {
    parents: FamilyMember[];
    children: FamilyMember[];
    spouses: FamilyMember[];
    siblings: FamilyMember[];
  };
};
