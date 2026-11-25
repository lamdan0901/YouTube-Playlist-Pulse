import { cn } from "@/lib/utils";

export interface ProgressBarProps {
  value: number; // Progress value from 0 to 100
  status?: string; // Optional status text to display
  variant?: "default" | "success" | "error" | "warning";
  size?: "sm" | "md" | "lg";
  showPercentage?: boolean;
  className?: string;
}

export function ProgressBar({
  value,
  status,
  variant = "default",
  size = "md",
  showPercentage = true,
  className,
}: ProgressBarProps) {
  // Ensure value is between 0 and 100
  const clampedValue = Math.min(Math.max(value, 0), 100);

  const sizes = {
    sm: "h-2",
    md: "h-3",
    lg: "h-4",
  };

  const variants = {
    default: "bg-primary",
    success: "bg-success",
    error: "bg-danger",
    warning: "bg-amber-600",
  };

  return (
    <div className={cn("w-full space-y-2", className)}>
      {/* Status and percentage display */}
      {(status || showPercentage) && (
        <div className="flex items-center justify-between gap-4 text-sm">
          {status && (
            <span className="min-w-0 font-medium wrap-anywhere">
              {status}
            </span>
          )}
          {showPercentage && (
            <span className="ml-auto shrink-0 text-muted tabular-nums">
              {clampedValue}%
            </span>
          )}
        </div>
      )}

      {/* Progress bar container */}
      <div
        role="progressbar"
        aria-label="Playlist creation progress"
        aria-valuenow={clampedValue}
        className={cn(
          "w-full overflow-hidden rounded-full bg-quiet",
          sizes[size]
        )}
      >
        {/* Progress bar fill */}
        <div
          className={cn(
            "h-full rounded-full motion-safe:transition-[width] motion-safe:duration-500 motion-safe:ease-out",
            variants[variant]
          )}
          style={{
            width: `${clampedValue}%`,
          }}
        />
      </div>
    </div>
  );
}
