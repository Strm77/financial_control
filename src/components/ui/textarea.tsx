import { forwardRef } from "react";
import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, invalid, ...props }, ref) => (
    <textarea
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        "w-full min-h-24 px-3 py-2 rounded-brutal border-brutal bg-card text-card-foreground",
        "placeholder:text-muted-foreground",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        invalid && "border-danger",
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";
