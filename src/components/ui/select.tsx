import { forwardRef } from "react";
import type { SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, invalid, children, ...props }, ref) => (
    <div className="relative">
      <select
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cn(
          "w-full h-11 pl-3 pr-9 rounded-brutal border-brutal bg-card text-card-foreground appearance-none",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          invalid && "border-danger",
          className
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 size-4 text-foreground"
        aria-hidden="true"
      />
    </div>
  )
);
Select.displayName = "Select";
