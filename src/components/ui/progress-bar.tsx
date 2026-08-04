import { cn } from "@/lib/utils";

export interface ProgressBarProps {
  percent: number;
  variant?: "primary" | "success" | "warning" | "danger" | "secondary";
  className?: string;
  label?: string;
}

const VARIANT_CLASSES = {
  primary: "bg-primary",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  secondary: "bg-secondary",
} as const;

export function ProgressBar({ percent, variant = "primary", className, label }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, percent));
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={cn("h-4 w-full rounded-brutal border-brutal bg-background-alt overflow-hidden", className)}
    >
      <div
        className={cn("h-full transition-[width] duration-300 ease-out", VARIANT_CLASSES[variant])}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
