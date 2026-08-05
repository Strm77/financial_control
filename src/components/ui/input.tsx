import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, invalid, ...props }, ref) => (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        "w-full h-11 px-3 neu-rounded neu-surface bg-card text-card-foreground",
        "placeholder:text-muted-foreground",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        invalid && "border-danger",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";
