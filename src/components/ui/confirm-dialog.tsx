"use client";

import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { Button } from "@/components/ui/button";
import type { ButtonVariant } from "@/components/ui/button";

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: ButtonVariant;
  loading?: boolean;
  onConfirm: () => void;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  confirmVariant = "danger",
  loading = false,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 bg-foreground/40 z-40" />
        <AlertDialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 bg-card text-card-foreground border-brutal rounded-brutal shadow-brutal-lg p-6">
          <AlertDialog.Title className="text-xl font-bold font-display mb-2">{title}</AlertDialog.Title>
          <AlertDialog.Description className="text-sm text-muted-foreground mb-6">
            {description}
          </AlertDialog.Description>
          <div className="flex items-center justify-end gap-3">
            <AlertDialog.Cancel asChild>
              <Button type="button" variant="outline">
                {cancelLabel}
              </Button>
            </AlertDialog.Cancel>
            <Button type="button" variant={confirmVariant} loading={loading} onClick={onConfirm}>
              {confirmLabel}
            </Button>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
