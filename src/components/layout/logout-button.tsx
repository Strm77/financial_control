"use client";

import { useState, useTransition } from "react";
import { LogOut } from "lucide-react";
import { logoutAction } from "@/lib/actions/auth";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        aria-label="Sair da conta"
      >
        <LogOut className="size-4" aria-hidden="true" />
        <span className="hidden sm:inline">Sair</span>
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Sair da conta"
        description="Você precisará entrar novamente com seu e-mail e senha para acessar seus dados."
        confirmLabel="Sair"
        confirmVariant="danger"
        loading={isPending}
        onConfirm={() => startTransition(() => logoutAction())}
      />
    </>
  );
}
