"use client";

import { useState, useTransition } from "react";
import {
  Pill,
  MoreVertical,
  Trash2,
  Power,
  PowerOff,
  Clock,
  Calendar,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog";
import { toggleMedicineActive, deleteMedicine } from "@/actions/medicines";
import type { MedicineDisplay } from "@/types/medicines";
import { cn } from "@/lib/utils";

interface MedicineCardProps {
  medicine: MedicineDisplay;
  showOwner?: boolean;
}

export function MedicineCard({
  medicine,
  showOwner = false,
}: MedicineCardProps) {
  const [isPending, startTransition] = useTransition();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleToggle = () => {
    startTransition(async () => {
      await toggleMedicineActive(medicine.id);
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      await deleteMedicine(medicine.id);
      setShowDeleteDialog(false);
    });
  };

  return (
    <>
      <Card
        className={cn(
          "group hover:shadow-md transition-shadow",
          !medicine.isActive && "opacity-60"
        )}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "flex-shrink-0 p-2 rounded-lg",
                medicine.isActive
                  ? "bg-green-100 dark:bg-green-900/30"
                  : "bg-gray-100 dark:bg-gray-800"
              )}
            >
              <Pill
                className={cn(
                  "h-5 w-5",
                  medicine.isActive
                    ? "text-green-600 dark:text-green-400"
                    : "text-gray-400"
                )}
              />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium truncate">{medicine.name}</p>
                {!medicine.isActive && (
                  <Badge variant="secondary" className="text-xs">
                    Inactive
                  </Badge>
                )}
              </div>

              <div className="mt-1 space-y-1 text-sm text-muted-foreground">
                {medicine.dosage && <p>{medicine.dosage}</p>}
                {medicine.frequency && (
                  <p className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {medicine.frequency}
                  </p>
                )}
                {medicine.duration && (
                  <p className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {medicine.duration}
                  </p>
                )}
                {medicine.instructions && (
                  <p className="italic text-xs">{medicine.instructions}</p>
                )}
              </div>

              {showOwner && (
                <p className="mt-2 text-xs text-muted-foreground">
                  For: {medicine.ownerName}
                </p>
              )}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                  disabled={isPending}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleToggle} disabled={isPending}>
                  {medicine.isActive ? (
                    <>
                      <PowerOff className="h-4 w-4 mr-2" />
                      Mark Inactive
                    </>
                  ) : (
                    <>
                      <Power className="h-4 w-4 mr-2" />
                      Mark Active
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-red-600 focus:text-red-600"
                  disabled={isPending}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      <DeleteConfirmationDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete Medicine?"
        description={`This will permanently delete "${medicine.name}" from the records.`}
        onConfirm={handleDelete}
        isDeleting={isPending}
      />
    </>
  );
}
