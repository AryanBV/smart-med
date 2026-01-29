"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
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
import { Plus } from "lucide-react";
import { createGlucoseReading } from "@/actions/glucose";
import type { FamilyMember } from "@/types/family";

interface GlucoseFormProps {
  familyMembers: FamilyMember[];
}

export function GlucoseForm({ familyMembers }: GlucoseFormProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await createGlucoseReading(
        formData.get("owner_id") as string,
        parseFloat(formData.get("value") as string),
        formData.get("reading_type") as string,
        (formData.get("meal_context") as string) || null,
        (formData.get("notes") as string) || null,
        new Date().toISOString()
      );

      if (result.success) {
        setOpen(false);
        setError(null);
        // Reset form by closing and reopening
      } else {
        setError(result.error || "Failed to save reading");
      }
    });
  };

  if (familyMembers.length === 0) {
    return (
      <Button disabled className="min-h-[44px]">
        <Plus className="h-4 w-4 mr-2" />
        Add family member first
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="min-h-[44px]">
          <Plus className="h-4 w-4 mr-2" />
          Log Reading
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Log Glucose Reading</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="owner_id">Family Member</Label>
            <Select name="owner_id" required>
              <SelectTrigger className="min-h-[44px]">
                <SelectValue placeholder="Select member" />
              </SelectTrigger>
              <SelectContent>
                {familyMembers.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="value">Glucose Level (mg/dL)</Label>
            <Input
              id="value"
              name="value"
              type="number"
              min="20"
              max="600"
              step="0.1"
              required
              placeholder="e.g., 120"
              className="min-h-[44px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reading_type">Reading Type</Label>
            <Select name="reading_type" required>
              <SelectTrigger className="min-h-[44px]">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fasting">Fasting</SelectItem>
                <SelectItem value="pre_meal">Pre-Meal</SelectItem>
                <SelectItem value="post_meal">Post-Meal</SelectItem>
                <SelectItem value="random">Random</SelectItem>
                <SelectItem value="bedtime">Bedtime</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="meal_context">Meal Context (Optional)</Label>
            <Select name="meal_context">
              <SelectTrigger className="min-h-[44px]">
                <SelectValue placeholder="Select meal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="breakfast">Breakfast</SelectItem>
                <SelectItem value="lunch">Lunch</SelectItem>
                <SelectItem value="dinner">Dinner</SelectItem>
                <SelectItem value="snack">Snack</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Input
              id="notes"
              name="notes"
              placeholder="Any additional notes"
              className="min-h-[44px]"
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-50 p-2 rounded">{error}</p>
          )}

          <Button
            type="submit"
            disabled={isPending}
            className="w-full min-h-[44px]"
          >
            {isPending ? "Saving..." : "Save Reading"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
