"use client";

import { useEffect, useActionState, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createFamilyMember, updateFamilyMember } from "@/actions/family";
import type { FamilyMember, FamilyActionState } from "@/types/family";

interface FamilyMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member?: FamilyMember | null; // If provided, we're editing
}

const initialState: FamilyActionState = {};

export function FamilyMemberDialog({
  open,
  onOpenChange,
  member,
}: FamilyMemberDialogProps) {
  const isEditing = !!member;

  // For create, use useActionState directly
  const [createState, createAction, isCreating] = useActionState(
    createFamilyMember,
    initialState
  );

  // For update, handle manually since we need dynamic member ID
  const [updateState, setUpdateState] =
    useState<FamilyActionState>(initialState);
  const [isUpdating, setIsUpdating] = useState(false);

  // Handle form submission for updates
  const handleSubmit = async (formData: FormData) => {
    if (isEditing && member) {
      setIsUpdating(true);
      const result = await updateFamilyMember(member.id, initialState, formData);
      setUpdateState(result);
      setIsUpdating(false);
    }
  };

  const state = isEditing ? updateState : createState;
  const isPending = isEditing ? isUpdating : isCreating;

  // Close dialog on success
  useEffect(() => {
    if (state.success) {
      onOpenChange(false);
      // Reset update state
      if (isEditing) {
        setUpdateState(initialState);
      }
    }
  }, [state.success, onOpenChange, isEditing]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setUpdateState(initialState);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Family Member" : "Add Family Member"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the details of this family member."
              : "Add a new member to your family. You can add relationships later."}
          </DialogDescription>
        </DialogHeader>

        <form
          action={isEditing ? handleSubmit : createAction}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name *</Label>
            <Input
              id="full_name"
              name="full_name"
              placeholder="Enter full name"
              defaultValue={member?.full_name || ""}
              required
              minLength={2}
              className="min-h-[44px]"
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="date_of_birth">Date of Birth</Label>
            <Input
              id="date_of_birth"
              name="date_of_birth"
              type="date"
              defaultValue={member?.date_of_birth || ""}
              className="min-h-[44px]"
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="gender">Gender</Label>
            <Select
              name="gender"
              defaultValue={member?.gender || ""}
              disabled={isPending}
            >
              <SelectTrigger className="min-h-[44px]">
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
                <SelectItem value="prefer_not_to_say">
                  Prefer not to say
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {state.error && (
            <div className="text-sm text-red-500 bg-red-50 dark:bg-red-950 p-3 rounded-md">
              {state.error}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditing ? "Saving..." : "Adding..."}
                </>
              ) : isEditing ? (
                "Save Changes"
              ) : (
                "Add Member"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
