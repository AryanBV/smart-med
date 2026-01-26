"use client";

import { Pill, Check, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ExtractedMedicine } from "@/types/medicines";

interface ExtractedMedicinesPreviewProps {
  medicines: ExtractedMedicine[];
  status: "idle" | "loading" | "success" | "error";
  error?: string | null;
}

export function ExtractedMedicinesPreview({
  medicines,
  status,
  error,
}: ExtractedMedicinesPreviewProps) {
  if (status === "idle") {
    return null;
  }

  if (status === "loading") {
    return (
      <div className="p-4 border rounded-lg bg-muted/20">
        <div className="flex items-center gap-2">
          <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
          <p className="text-sm">Extracting medicines from prescription...</p>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          This may take 10-20 seconds
        </p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="p-4 border border-red-500/50 rounded-lg bg-red-50 dark:bg-red-900/10">
        <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
          <AlertTriangle className="h-4 w-4" />
          <p className="text-sm font-medium">Extraction Failed</p>
        </div>
        {error && (
          <p className="text-xs text-red-600/80 dark:text-red-400/80 mt-1">
            {error}
          </p>
        )}
      </div>
    );
  }

  if (medicines.length === 0) {
    return (
      <div className="p-4 border border-yellow-500/50 rounded-lg bg-yellow-50 dark:bg-yellow-900/10">
        <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
          <AlertTriangle className="h-4 w-4" />
          <p className="text-sm font-medium">No Medicines Found</p>
        </div>
        <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-1">
          The prescription may be unclear or contain no medicine information.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 border border-green-500/50 rounded-lg bg-green-50 dark:bg-green-900/10">
      <div className="flex items-center gap-2 text-green-700 dark:text-green-400 mb-3">
        <Check className="h-4 w-4" />
        <p className="text-sm font-medium">
          {medicines.length} Medicine{medicines.length !== 1 ? "s" : ""}{" "}
          Extracted
        </p>
      </div>

      <div className="space-y-2">
        {medicines.map((med, index) => (
          <div
            key={index}
            className="flex items-start gap-2 p-2 bg-white dark:bg-gray-900 rounded border"
          >
            <Pill className="h-4 w-4 text-green-600 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">{med.name}</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {med.dosage && (
                  <Badge variant="outline" className="text-xs">
                    {med.dosage}
                  </Badge>
                )}
                {med.frequency && (
                  <Badge variant="outline" className="text-xs">
                    {med.frequency}
                  </Badge>
                )}
                {med.duration && (
                  <Badge variant="outline" className="text-xs">
                    {med.duration}
                  </Badge>
                )}
              </div>
              {med.instructions && (
                <p className="text-xs text-muted-foreground mt-1 italic">
                  {med.instructions}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
