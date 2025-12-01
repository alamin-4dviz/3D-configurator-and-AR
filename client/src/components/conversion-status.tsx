import { Upload, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ConversionStatus as Status } from "@shared/schema";

interface ConversionStatusProps {
  status: Status;
  className?: string;
}

const statusConfig = {
  pending: {
    icon: Upload,
    label: "Ready to upload",
    color: "text-muted-foreground",
    bgColor: "bg-muted",
  },
  converting: {
    icon: RefreshCw,
    label: "Converting...",
    color: "text-primary",
    bgColor: "bg-primary/10",
    animate: true,
  },
  ready: {
    icon: CheckCircle2,
    label: "Ready for AR",
    color: "text-green-600 dark:text-green-500",
    bgColor: "bg-green-100 dark:bg-green-900/20",
  },
  error: {
    icon: AlertCircle,
    label: "Conversion failed",
    color: "text-destructive",
    bgColor: "bg-destructive/10",
  },
};

export function ConversionStatus({ status, className }: ConversionStatusProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-1 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg",
        config.bgColor,
        className
      )}
      data-testid="container-conversion-status"
    >
      <div
        className={cn(
          "h-6 w-6 rounded-full flex items-center justify-center",
          config.bgColor
        )}
      >
        <Icon
          className={cn(
            "h-5 w-5",
            config.color,
            config.animate && "animate-spin"
          )}
        />
      </div>
      <div>
        <p className={cn("font-medium text-xs sm:text-sm", config.color)} data-testid="text-status-label">
          {config.label}
        </p>
        {status === "converting" && (
          <p className="text-sm text-muted-foreground">
            This may take a few moments...
          </p>
        )}
      </div>
    </div>
  );
}
