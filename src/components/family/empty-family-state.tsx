"use client";

import { useState } from "react";
import { Users, UserPlus, Loader2, GitBranch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { addSelfAsFamilyMember } from "@/actions/family";

interface EmptyFamilyStateProps {
  onAddMember: () => void;
}

export function EmptyFamilyState({ onAddMember }: EmptyFamilyStateProps) {
  const [isAddingSelf, setIsAddingSelf] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddSelf = async () => {
    setIsAddingSelf(true);
    setError(null);
    const result = await addSelfAsFamilyMember();
    setIsAddingSelf(false);
    if (result.error) {
      setError(result.error);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="relative">
        {/* Decorative glow */}
        <div className="absolute -inset-4 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full blur-xl" />
        <div className="relative rounded-full bg-gradient-to-br from-primary/20 to-primary/10 p-5">
          <Users className="h-10 w-10 text-primary" />
        </div>
      </div>
      <h3 className="mt-6 text-xl font-semibold">No Family Members Yet</h3>
      <p className="text-muted-foreground text-center max-w-md mt-2 mb-6">
        Start building your family health hub. Add family members to track their
        health records, medications, and more.
      </p>

      {/* Tree teaser */}
      <div className="mb-6 p-4 bg-muted/50 rounded-lg text-center max-w-sm">
        <GitBranch className="h-5 w-5 mx-auto text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">
          Add 2+ members to unlock the interactive family tree
        </p>
      </div>

      {error && (
        <div className="text-sm text-red-500 bg-red-50 dark:bg-red-950 p-3 rounded-md mb-4">
          {error}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <Button onClick={handleAddSelf} disabled={isAddingSelf} variant="outline">
          {isAddingSelf ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Adding...
            </>
          ) : (
            <>
              <UserPlus className="mr-2 h-4 w-4" />
              Add Myself First
            </>
          )}
        </Button>
        <Button onClick={onAddMember}>
          <UserPlus className="mr-2 h-4 w-4" />
          Add Family Member
        </Button>
      </div>
    </div>
  );
}
