import type { FamilyMember } from "@/types/family";
import type { RelationshipDisplay } from "@/types/relationships";

/**
 * Data format expected by family-chart library
 */
export interface FamilyChartDatum {
  id: string;
  data: {
    "first name": string;
    "last name": string;
    "full name": string;
    gender: "M" | "F";
    birthday?: string;
    isRegistered: boolean;
  };
  rels: {
    father?: string;
    mother?: string;
    spouses?: string[];
    children?: string[];
  };
}

/**
 * Escape HTML special characters to prevent XSS
 */
function escapeHtml(text: string): string {
  const div = typeof document !== "undefined"
    ? document.createElement("div")
    : null;
  if (div) {
    div.textContent = text;
    return div.innerHTML;
  }
  // Fallback for SSR
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Transform SMART-MED data to family-chart format
 */
export function transformToFamilyChartData(
  members: FamilyMember[],
  relationships: RelationshipDisplay[]
): FamilyChartDatum[] {
  return members.map((member) => {
    // Split full name into first/last
    const nameParts = member.full_name.trim().split(" ");
    const firstName = escapeHtml(nameParts[0] || "");
    const lastName = escapeHtml(nameParts.slice(1).join(" ") || "");
    const fullName = escapeHtml(member.full_name);

    // Map gender to M/F (family-chart format)
    const gender: "M" | "F" = member.gender === "female" ? "F" : "M";

    // Find relationships where this member is the source
    const memberRels = relationships.filter((r) => r.memberId === member.id);

    // Find parents (relationships where type is "parent" - meaning relatedMember is the parent)
    const parentRels = memberRels.filter((r) => r.relationshipType === "parent");
    const father = parentRels.find((r) => {
      const parent = members.find((m) => m.id === r.relatedMemberId);
      return parent?.gender === "male";
    })?.relatedMemberId;
    const mother = parentRels.find((r) => {
      const parent = members.find((m) => m.id === r.relatedMemberId);
      return parent?.gender === "female";
    })?.relatedMemberId;

    // Find spouses
    const spouses = memberRels
      .filter((r) => r.relationshipType === "spouse")
      .map((r) => r.relatedMemberId);

    // Find children
    const children = memberRels
      .filter((r) => r.relationshipType === "child")
      .map((r) => r.relatedMemberId);

    return {
      id: member.id,
      data: {
        "first name": firstName,
        "last name": lastName,
        "full name": fullName,
        gender,
        birthday: member.date_of_birth || undefined,
        isRegistered: member.is_registered || false,
      },
      rels: {
        ...(father && { father }),
        ...(mother && { mother }),
        ...(spouses.length > 0 && { spouses }),
        ...(children.length > 0 && { children }),
      },
    };
  });
}

/**
 * Find the main/root person for initial tree focus
 * Prioritizes: 1) Registered user, 2) First person in list
 */
export function findMainPerson(data: FamilyChartDatum[]): string | null {
  if (data.length === 0) return null;

  // Prefer registered user (the logged-in person)
  const registered = data.find((d) => d.data.isRegistered);
  if (registered) return registered.id;

  // Fallback to first person
  return data[0].id;
}

/**
 * Get initials from full name (max 2 characters)
 */
export function getInitials(fullName: string): string {
  return fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
