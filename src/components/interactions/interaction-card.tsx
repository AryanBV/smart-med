"use client";

import { useState, useTransition } from "react";
import { Info, AlertTriangle, AlertCircle, Octagon, Check, Pill } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { acknowledgeInteraction } from "@/actions/interactions";
import { SEVERITY_CONFIG } from "@/types/interactions";
import type { InteractionDisplay } from "@/types/interactions";
import { cn } from "@/lib/utils";

interface InteractionCardProps {
  interaction: InteractionDisplay;
  showOwner?: boolean;
}

const SEVERITY_ICONS = {
  info: Info,
  "alert-triangle": AlertTriangle,
  "alert-circle": AlertCircle,
  octagon: Octagon,
};

export function InteractionCard({ interaction, showOwner = false }: InteractionCardProps) {
  const [isPending, startTransition] = useTransition();
  const [isAcknowledged, setIsAcknowledged] = useState(interaction.isAcknowledged);

  const config = SEVERITY_CONFIG[interaction.severity];
  const Icon = SEVERITY_ICONS[config.icon];

  const handleAcknowledge = () => {
    startTransition(async () => {
      const result = await acknowledgeInteraction(interaction.id);
      if (result.success) {
        setIsAcknowledged(true);
      }
    });
  };

  if (isAcknowledged) {
    return null;
  }

  return (
    <Card className={cn("border-l-4", {
      "border-l-blue-500": interaction.severity === "minor",
      "border-l-yellow-500": interaction.severity === "moderate",
      "border-l-orange-500": interaction.severity === "major",
      "border-l-red-500": interaction.severity === "contraindicated",
    })}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={cn("flex-shrink-0 p-2 rounded-lg", config.bgColor)}>
            <Icon className={cn("h-5 w-5", config.color)} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className={cn("text-xs font-medium", config.color)}>
                {config.label}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {interaction.source === "openfda" ? "FDA" : interaction.source === "gpt" ? "AI" : "Manual"}
              </Badge>
            </div>

            <div className="flex items-center gap-2 text-sm font-medium mb-2 flex-wrap">
              <span className="flex items-center gap-1">
                <Pill className="h-3 w-3" />
                {interaction.medicine1Name}
              </span>
              <span className="text-muted-foreground">+</span>
              <span className="flex items-center gap-1">
                <Pill className="h-3 w-3" />
                {interaction.medicine2Name}
              </span>
            </div>

            <p className="text-sm text-muted-foreground mb-3">
              {interaction.description}
            </p>

            {showOwner && (
              <p className="text-xs text-muted-foreground mb-3">
                For: {interaction.ownerName}
              </p>
            )}

            <p className="text-xs text-muted-foreground italic mb-3">
              This is informational only. Always consult a healthcare provider before making changes to your medications.
            </p>

            <Button
              size="sm"
              variant="outline"
              onClick={handleAcknowledge}
              disabled={isPending}
              className="min-h-[44px]"
            >
              <Check className="h-4 w-4 mr-2" />
              {isPending ? "Acknowledging..." : "I understand, dismiss"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
