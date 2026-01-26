"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { deleteRelationship } from "@/actions/relationships";
import type { RelationshipDisplay } from "@/types/relationships";

interface RelationshipsListProps {
  relationships: RelationshipDisplay[];
}

export function RelationshipsList({ relationships }: RelationshipsListProps) {
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Deduplicate relationships (we store both directions)
  const uniqueRelationships = relationships.filter((rel, index, arr) => {
    // Keep only one direction
    const reverseIndex = arr.findIndex(
      (r) =>
        r.memberId === rel.relatedMemberId &&
        r.relatedMemberId === rel.memberId
    );
    return reverseIndex === -1 || index < reverseIndex;
  });

  const handleDelete = (memberId: string, relatedMemberId: string) => {
    setDeletingId(`${memberId}-${relatedMemberId}`);
    startTransition(async () => {
      await deleteRelationship(memberId, relatedMemberId);
      setDeletingId(null);
    });
  };

  if (uniqueRelationships.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        No relationships defined yet. Add relationships to see the family tree connections.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {uniqueRelationships.map((rel) => (
        <div
          key={rel.id}
          className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
        >
          <span className="text-sm">
            <strong>{rel.memberName}</strong>
            <span className="text-muted-foreground mx-2">is {rel.relationshipType} of</span>
            <strong>{rel.relatedMemberName}</strong>
          </span>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remove Relationship?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will remove the {rel.relationshipType} relationship between{" "}
                  {rel.memberName} and {rel.relatedMemberName}.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => handleDelete(rel.memberId, rel.relatedMemberId)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  disabled={isPending && deletingId === `${rel.memberId}-${rel.relatedMemberId}`}
                >
                  {isPending && deletingId === `${rel.memberId}-${rel.relatedMemberId}` ? "Removing..." : "Remove"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      ))}
    </div>
  );
}
