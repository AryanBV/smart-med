"use client";

import { useState } from "react";
import { Users, UserPlus, Loader2 } from "lucide-react";
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
      <div className="rounded-full bg-primary/10 p-4 mb-4">
        <Users className="h-8 w-8 text-primary" />
      </div>
      <h3 className="text-lg font-semibold mb-2">No Family Members Yet</h3>
      <p className="text-muted-foreground text-center max-w-md mb-6">
        Start building your family health hub by adding family members. You can
        track health records, prescriptions, and medicines for each member.
      </p>

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
