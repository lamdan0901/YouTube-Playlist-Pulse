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
    default: "bg-[--color-youtube-primary]",
    success: "bg-[--color-success]",
    error: "bg-[--color-error]",
    warning: "bg-[--color-warning]",
  };

  return (
    <div className={cn("w-full space-y-2", className)}>
      {/* Status and percentage display */}
      {(status || showPercentage) && (
        <div className="flex justify-between items-center text-sm">
          {status && (
            <span className="text-[--color-foreground] font-medium">
              {status}
            </span>
          )}
          {showPercentage && (
            <span className="text-[--color-foreground] opacity-75">
              {clampedValue}%
            </span>
          )}
        </div>
      )}

      {/* Progress bar container */}
      <div
        className={cn(
          "w-full bg-[--color-youtube-surface] rounded-full overflow-hidden",
          sizes[size]
        )}
      >
        {/* Progress bar fill */}
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500 ease-out",
            variants[variant]
          )}
          style={{
            width: `${clampedValue}%`,
            transformOrigin: "left",
          }}
        />
      </div>
    </div>
  );
}
