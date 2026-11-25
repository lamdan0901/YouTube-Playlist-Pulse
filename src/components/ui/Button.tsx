import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      loading,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex cursor-pointer items-center justify-center rounded-lg border border-transparent text-center font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50";

    const variants = {
      primary:
        "bg-primary text-white hover:bg-primary-hover",
      secondary:
        "border-control-border bg-surface text-foreground hover:bg-quiet",
      danger:
        "border-control-border bg-surface text-danger hover:bg-danger-tint",
      ghost:
        "text-foreground hover:bg-quiet",
    };

    const sizes = {
      sm: "min-h-11 px-3 py-2 text-sm sm:min-h-10",
      md: "min-h-11 px-5 py-2 text-sm",
      lg: "min-h-12 px-6 py-2.5 text-base",
    };

    return (
      <button
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          loading && "cursor-wait",
          className
        )}
        disabled={disabled || loading}
        ref={ref}
        {...props}
      >
        {loading && (
          <svg
            className="mr-2 h-4 w-4 shrink-0 motion-safe:animate-spin"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button };
