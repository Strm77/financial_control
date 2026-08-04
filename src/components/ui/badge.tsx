import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const VARIANT_CLASSES = {
  neutral: "bg-muted text-muted-foreground",
  primary: "bg-primary text-primary-foreground",
  success: "bg-success text-success-foreground",
  warning: "bg-warning text-warning-foreground",
  danger: "bg-danger text-danger-foreground",
  secondary: "bg-secondary text-secondary-foreground",
} as const;

export type BadgeVariant = keyof typeof VARIANT_CLASSES;

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({ className, variant = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-1 rounded-brutal border-brutal text-xs font-bold uppercase tracking-wide",
        VARIANT_CLASSES[variant],
        className
      )}
      {...props}
    />
  );
}
