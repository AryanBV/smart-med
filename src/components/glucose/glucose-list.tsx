"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog";
import { deleteGlucoseReading } from "@/actions/glucose";
import { getGlucoseStatus, READING_TYPE_LABELS } from "@/types/glucose";
import type { GlucoseDisplay } from "@/types/glucose";

interface GlucoseListProps {
  readings: GlucoseDisplay[];
}

export function GlucoseList({ readings }: GlucoseListProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (!deleteId) return;
    startTransition(async () => {
      await deleteGlucoseReading(deleteId);
      setDeleteId(null);
    });
  };

  const getStatusColor = (value: number, readingType: string) => {
    const status = getGlucoseStatus(value, readingType);
    switch (status) {
      case "low":
        return "text-blue-600 bg-blue-50 dark:bg-blue-950";
      case "normal":
        return "text-green-600 bg-green-50 dark:bg-green-950";
      case "elevated":
        return "text-yellow-600 bg-yellow-50 dark:bg-yellow-950";
      case "high":
        return "text-red-600 bg-red-50 dark:bg-red-950";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  if (readings.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground border rounded-lg">
        <p className="text-lg font-medium">No glucose readings yet</p>
        <p className="text-sm mt-1">
          Start logging readings to track blood sugar levels
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        <h3 className="font-semibold">Recent Readings</h3>
        {readings.map((reading) => (
          <div
            key={reading.id}
            className="flex items-center justify-between p-4 border rounded-lg bg-card hover:shadow-sm transition-shadow"
          >
            <div className="flex items-center gap-4">
              <div
                className={`text-2xl font-bold px-3 py-1 rounded-lg ${getStatusColor(
                  reading.value,
                  reading.reading_type
                )}`}
              >
                {reading.value}
              </div>
              <div>
                <p className="font-medium">{reading.ownerName}</p>
                <p className="text-sm text-muted-foreground">
                  {READING_TYPE_LABELS[reading.reading_type] ||
                    reading.reading_type.replace("_", " ")}{" "}
                  •{" "}
                  {new Date(reading.recorded_at).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
                {reading.notes && (
                  <p className="text-xs text-muted-foreground mt-1 italic">
                    {reading.notes}
                  </p>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDeleteId(reading.id)}
              className="min-h-[44px] min-w-[44px] text-muted-foreground hover:text-red-500"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      <DeleteConfirmationDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete Reading?"
        description="This will permanently delete this glucose reading. This action cannot be undone."
        onConfirm={handleDelete}
        isDeleting={isPending}
      />
    </>
  );
}
