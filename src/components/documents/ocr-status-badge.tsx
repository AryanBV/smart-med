import { Badge } from "@/components/ui/badge";
import { Clock, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import type { DocumentStatus } from "@/types/documents";

interface OcrStatusBadgeProps {
  status: DocumentStatus;
}

const statusConfig: Record<
  DocumentStatus,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
    icon: React.ReactNode;
  }
> = {
  pending: {
    label: "Pending OCR",
    variant: "secondary",
    icon: <Clock className="h-3 w-3" />,
  },
  processing: {
    label: "Processing",
    variant: "default",
    icon: <Loader2 className="h-3 w-3 animate-spin" />,
  },
  completed: {
    label: "Processed",
    variant: "outline",
    icon: <CheckCircle className="h-3 w-3" />,
  },
  failed: {
    label: "OCR Failed",
    variant: "destructive",
    icon: <AlertCircle className="h-3 w-3" />,
  },
};

export function OcrStatusBadge({ status }: OcrStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <Badge variant={config.variant} className="gap-1 text-xs">
      {config.icon}
      {config.label}
    </Badge>
  );
}
