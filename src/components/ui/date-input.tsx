import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface DateInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  invalid?: boolean;
}

/** Input de data nativo (respeita a localização do navegador), valor sempre "YYYY-MM-DD". */
export const DateInput = forwardRef<HTMLInputElement, DateInputProps>(
  ({ className, invalid, ...props }, ref) => (
    <input
      ref={ref}
      type="date"
      aria-invalid={invalid || undefined}
      className={cn(
        "w-full h-11 px-3 rounded-brutal border-brutal bg-card text-card-foreground",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        invalid && "border-danger",
        className
      )}
      {...props}
    />
  )
);
DateInput.displayName = "DateInput";
