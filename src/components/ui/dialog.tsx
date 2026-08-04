"use client";

import * as RadixDialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function Dialog({ open, onOpenChange, title, description, children, className }: DialogProps) {
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 bg-foreground/40 z-40 data-[state=open]:animate-in data-[state=open]:fade-in data-[state=closed]:animate-out data-[state=closed]:fade-out" />
        <RadixDialog.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2",
            "bg-card text-card-foreground border-brutal rounded-brutal shadow-brutal-lg p-6",
            "max-h-[85vh] overflow-y-auto brutal-scroll",
            className
          )}
        >
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <RadixDialog.Title className="text-xl font-bold font-display">{title}</RadixDialog.Title>
              {description && (
                <RadixDialog.Description className="text-sm text-muted-foreground mt-1">
                  {description}
                </RadixDialog.Description>
              )}
            </div>
            <RadixDialog.Close asChild>
              <button
                type="button"
                aria-label="Fechar"
                className="size-9 shrink-0 grid place-items-center rounded-brutal border-brutal bg-card press-brutal cursor-pointer"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </RadixDialog.Close>
          </div>
          {children}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
