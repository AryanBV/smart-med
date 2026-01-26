"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FamilyMemberCard } from "./family-member-card";
import { FamilyMemberDialog } from "./family-member-dialog";
import { EmptyFamilyState } from "./empty-family-state";
import type { FamilyMember } from "@/types/family";

interface FamilyListProps {
  initialMembers: FamilyMember[];
}

export function FamilyList({ initialMembers }: FamilyListProps) {
  const [members] = useState<FamilyMember[]>(initialMembers);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);

  const handleAddNew = () => {
    setEditingMember(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (member: FamilyMember) => {
    setEditingMember(member);
    setIsDialogOpen(true);
  };

  const handleDialogClose = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setEditingMember(null);
    }
  };

  if (members.length === 0) {
    return (
      <>
        <EmptyFamilyState onAddMember={handleAddNew} />
        <FamilyMemberDialog
          open={isDialogOpen}
          onOpenChange={handleDialogClose}
          member={editingMember}
        />
      </>
    );
  }

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <p className="text-muted-foreground">
            {members.length} {members.length === 1 ? "member" : "members"} in
            your family
          </p>
        </div>
        <Button onClick={handleAddNew}>
          <UserPlus className="mr-2 h-4 w-4" />
          Add Member
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {members.map((member) => (
          <FamilyMemberCard
            key={member.id}
            member={member}
            onEdit={handleEdit}
          />
        ))}
      </div>

      <FamilyMemberDialog
        open={isDialogOpen}
        onOpenChange={handleDialogClose}
        member={editingMember}
      />
    </>
  );
}
