import type { FamilyMember } from "@/types/family";
import type { RelationshipDisplay, TreeNode, RelationLink } from "@/types/relationships";

// Transform our data to the format relatives-tree expects
export function transformToTreeNodes(
  members: FamilyMember[],
  relationships: RelationshipDisplay[]
): TreeNode[] {
  return members.map((member) => {
    // Find all relationships for this member
    const memberRelationships = relationships.filter(
      (r) => r.memberId === member.id
    );

    // Categorize relationships
    const parents: RelationLink[] = memberRelationships
      .filter((r) => r.relationshipType === "parent")
      .map((r) => ({ id: r.relatedMemberId, type: "blood" as const }));

    const children: RelationLink[] = memberRelationships
      .filter((r) => r.relationshipType === "child")
      .map((r) => ({ id: r.relatedMemberId, type: "blood" as const }));

    const spouses: RelationLink[] = memberRelationships
      .filter((r) => r.relationshipType === "spouse")
      .map((r) => ({ id: r.relatedMemberId, type: "married" as const }));

    const siblings: RelationLink[] = memberRelationships
      .filter((r) => r.relationshipType === "sibling")
      .map((r) => ({ id: r.relatedMemberId, type: "blood" as const }));

    return {
      id: member.id,
      gender: (member.gender === "male" || member.gender === "female"
        ? member.gender
        : "male") as "male" | "female",
      displayName: member.full_name,
      isRegistered: member.is_registered || false,
      parents,
      children,
      spouses,
      siblings,
    };
  });
}

// Find a good root node (oldest generation or registered user)
export function findRootNode(nodes: TreeNode[]): string | null {
  if (nodes.length === 0) return null;

  // Prefer registered user
  const registered = nodes.find((n) => n.isRegistered);
  if (registered) return registered.id;

  // Otherwise, find someone with no parents (oldest generation)
  const noParents = nodes.find((n) => n.parents.length === 0);
  if (noParents) return noParents.id;

  // Fallback to first node
  return nodes[0].id;
}
