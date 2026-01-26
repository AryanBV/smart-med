import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface InteractionAlertProps {
  count: number;
}

export function InteractionAlert({ count }: InteractionAlertProps) {
  if (count === 0) return null;

  return (
    <Alert variant="destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Drug Interaction Warning</AlertTitle>
      <AlertDescription className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <span>
          {count} potential drug interaction{count !== 1 ? "s" : ""} detected in your
          family&apos;s medications.
        </span>
        <Link href="/dashboard/interactions">
          <Button variant="outline" size="sm" className="min-h-[44px]">
            Review Now
          </Button>
        </Link>
      </AlertDescription>
    </Alert>
  );
}
