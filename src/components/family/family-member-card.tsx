"use client";

import { useState } from "react";
import { User, Calendar, Edit, Trash2, MoreVertical } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog";
import type { FamilyMember } from "@/types/family";
import { deleteFamilyMember } from "@/actions/family";

interface FamilyMemberCardProps {
  member: FamilyMember;
  onEdit: (member: FamilyMember) => void;
}

export function FamilyMemberCard({ member, onEdit }: FamilyMemberCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const initials = member.full_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const calculateAge = (dateString: string | null) => {
    if (!dateString) return null;
    const today = new Date();
    const birthDate = new Date(dateString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return age;
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    await deleteFamilyMember(member.id);
    setIsDeleting(false);
    setShowDeleteDialog(false);
  };

  const age = calculateAge(member.date_of_birth);

  return (
    <>
      <div className="rounded-lg border bg-card p-4 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarFallback className="bg-primary/10 text-primary font-medium">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold flex items-center gap-2">
                {member.full_name}
                {member.is_registered && (
                  <Badge variant="secondary" className="text-xs">
                    You
                  </Badge>
                )}
              </h3>
              <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                {member.gender && (
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {member.gender.charAt(0).toUpperCase() +
                      member.gender.slice(1).replace("_", " ")}
                  </span>
                )}
                {age !== null && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {age} years
                  </span>
                )}
              </div>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(member)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setShowDeleteDialog(true)}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {member.date_of_birth && (
          <p className="text-xs text-muted-foreground mt-3">
            Born: {formatDate(member.date_of_birth)}
          </p>
        )}
      </div>

      <DeleteConfirmationDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete Family Member?"
        description={`Are you sure you want to delete ${member.full_name}? This will also delete all their associated documents, medicines, and health records. This action cannot be undone.`}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />
    </>
  );
}
