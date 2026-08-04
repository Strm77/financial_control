import { forwardRef } from "react";
import type { LabelHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const Label = forwardRef<HTMLLabelElement, LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      className={cn("block text-sm font-semibold text-foreground mb-1.5", className)}
      {...props}
    />
  )
);
Label.displayName = "Label";
