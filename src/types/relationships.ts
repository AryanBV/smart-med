import type { Database } from "./database";

// Database row type
export type FamilyRelationship = Database["public"]["Tables"]["family_relationships"]["Row"];
export type FamilyRelationshipInsert = Database["public"]["Tables"]["family_relationships"]["Insert"];

// Relationship type enum (re-export for convenience)
export type RelationshipType = "parent" | "child" | "spouse" | "sibling";

// For the tree library - node format
export interface TreeNode {
  id: string;
  gender: "male" | "female";
  displayName: string;
  isRegistered: boolean;
  parents: RelationLink[];
  siblings: RelationLink[];
  spouses: RelationLink[];
  children: RelationLink[];
}

export interface RelationLink {
  id: string;
  type: "blood" | "married";
}

// Form state
export interface RelationshipFormState {
  success: boolean;
  error: string | null;
}

// For UI display
export interface RelationshipDisplay {
  id: string;
  memberId: string;
  memberName: string;
  relatedMemberId: string;
  relatedMemberName: string;
  relationshipType: RelationshipType;
}
