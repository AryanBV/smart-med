"use client";

import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { createRelationship } from "@/actions/relationships";
import type { FamilyMember } from "@/types/family";
import type { RelationshipType } from "@/types/relationships";

interface AddRelationshipDialogProps {
  members: FamilyMember[];
  trigger?: React.ReactNode;
}

export function AddRelationshipDialog({ members, trigger }: AddRelationshipDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [memberId, setMemberId] = useState<string>("");
  const [relatedMemberId, setRelatedMemberId] = useState<string>("");
  const [relationshipType, setRelationshipType] = useState<RelationshipType | "">("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!memberId || !relatedMemberId || !relationshipType) {
      setError("Please fill in all fields");
      return;
    }

    if (memberId === relatedMemberId) {
      setError("Cannot create relationship with self");
      return;
    }

    startTransition(async () => {
      const result = await createRelationship(
        memberId,
        relatedMemberId,
        relationshipType as RelationshipType
      );

      if (result.success) {
        setOpen(false);
        // Reset form
        setMemberId("");
        setRelatedMemberId("");
        setRelationshipType("");
      } else {
        setError(result.error || "Failed to create relationship");
      }
    });
  };

  // Filter out selected member from related options
  const availableRelatedMembers = members.filter((m) => m.id !== memberId);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button>Add Relationship</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Relationship</DialogTitle>
          <DialogDescription>
            Define how two family members are related to each other.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* First Member */}
          <div className="space-y-2">
            <Label htmlFor="member">First Person</Label>
            <Select value={memberId} onValueChange={setMemberId}>
              <SelectTrigger id="member">
                <SelectValue placeholder="Select person" />
              </SelectTrigger>
              <SelectContent>
                {members.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.full_name}
                    {member.is_registered && " (You)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Relationship Type */}
          <div className="space-y-2">
            <Label htmlFor="type">is the</Label>
            <Select
              value={relationshipType}
              onValueChange={(v) => setRelationshipType(v as RelationshipType)}
            >
              <SelectTrigger id="type">
                <SelectValue placeholder="Select relationship" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="parent">Parent</SelectItem>
                <SelectItem value="child">Child</SelectItem>
                <SelectItem value="spouse">Spouse</SelectItem>
                <SelectItem value="sibling">Sibling</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Second Member */}
          <div className="space-y-2">
            <Label htmlFor="related">of</Label>
            <Select
              value={relatedMemberId}
              onValueChange={setRelatedMemberId}
              disabled={!memberId}
            >
              <SelectTrigger id="related">
                <SelectValue placeholder="Select person" />
              </SelectTrigger>
              <SelectContent>
                {availableRelatedMembers.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.full_name}
                    {member.is_registered && " (You)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Preview */}
          {memberId && relatedMemberId && relationshipType && (
            <p className="text-sm text-muted-foreground bg-muted p-2 rounded">
              {members.find((m) => m.id === memberId)?.full_name} is the{" "}
              <strong>{relationshipType}</strong> of{" "}
              {members.find((m) => m.id === relatedMemberId)?.full_name}
            </p>
          )}

          {/* Error */}
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          {/* Submit */}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Adding..." : "Add Relationship"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
