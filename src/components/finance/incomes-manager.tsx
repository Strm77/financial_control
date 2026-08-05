"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Wallet, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { MetricCard } from "@/components/ui/metric-card";
import { IncomeForm } from "@/components/finance/income-form";
import { createIncomeAction, updateIncomeAction, deleteIncomeAction } from "@/lib/actions/incomes";
import { centsToBRL } from "@/lib/formatters/currency";
import { INCOME_TYPE_LABELS, type IncomeFormValues } from "@/lib/validations/income";
import type { Income } from "@/types/entities";

interface DialogState {
  mode: "create" | "edit";
  income?: Income;
}

export function IncomesManager({ incomes, referenceMonth }: { incomes: Income[]; referenceMonth: string }) {
  const router = useRouter();
  const [dialogState, setDialogState] = useState<DialogState | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Income | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fixedTotal = incomes.filter((i) => i.type === "fixed").reduce((sum, i) => sum + i.amount_cents, 0);
  const variableTotal = incomes.filter((i) => i.type === "variable").reduce((sum, i) => sum + i.amount_cents, 0);
  const total = fixedTotal + variableTotal;

  async function handleSubmit(values: IncomeFormValues) {
    if (!dialogState) return;
    const result =
      dialogState.mode === "create" ? await createIncomeAction(values) : await updateIncomeAction(dialogState.income!.id, values);

    if (!result.success) {
      toast.error(result.message ?? "Não foi possível salvar a renda.");
      return;
    }
    toast.success(dialogState.mode === "create" ? "Renda adicionada." : "Renda atualizada.");
    setDialogState(null);
    router.refresh();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const result = await deleteIncomeAction(deleteTarget.id);
    setDeleting(false);
    if (!result.success) {
      toast.error(result.message ?? "Não foi possível excluir a renda.");
      return;
    }
    toast.success("Renda excluída.");
    setDeleteTarget(null);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard label="Renda do mês" value={centsToBRL(total)} tone="primary" icon={Wallet} />
        <MetricCard label="Renda fixa" value={centsToBRL(fixedTotal)} tone="secondary" />
        <MetricCard label="Renda variável" value={centsToBRL(variableTotal)} tone="neutral" icon={TrendingUp} />
      </div>

      <Card>
        <div className="flex items-center justify-between gap-3 mb-5">
          <h2 className="text-lg font-bold font-display">Lançamentos do mês</h2>
          <Button
            onClick={() => setDialogState({ mode: "create" })}
          >
            <Plus className="size-4" aria-hidden="true" />
            <span className="hidden sm:inline">Nova renda</span>
          </Button>
        </div>

        {incomes.length === 0 ? (
          <EmptyState
            title="Nenhuma renda cadastrada neste mês"
            description="Adicione sua renda fixa (salário) e eventuais rendas variáveis (freelance, bicos)."
            action={
              <Button onClick={() => setDialogState({ mode: "create" })}>
                <Plus className="size-4" aria-hidden="true" />
                Nova renda
              </Button>
            }
          />
        ) : (
          <ul className="space-y-2">
            {incomes.map((income) => (
              <li key={income.id} className="flex items-center justify-between gap-3 border-brutal rounded-brutal px-3 py-2.5 bg-background-alt">
                <div className="min-w-0 flex items-center gap-2.5">
                  <Badge variant={income.type === "fixed" ? "secondary" : "neutral"}>{INCOME_TYPE_LABELS[income.type]}</Badge>
                  <span className="font-semibold truncate">{income.description}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-bold tabular-nums text-success">{centsToBRL(income.amount_cents)}</span>
                  <button
                    type="button"
                    aria-label={`Editar ${income.description}`}
                    onClick={() => setDialogState({ mode: "edit", income })}
                    className="size-9 grid place-items-center rounded-brutal border-brutal bg-card press-brutal cursor-pointer"
                  >
                    <Pencil className="size-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    aria-label={`Excluir ${income.description}`}
                    onClick={() => setDeleteTarget(income)}
                    className="size-9 grid place-items-center rounded-brutal border-brutal bg-card press-brutal cursor-pointer"
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {dialogState && (
        <Dialog
          open
          onOpenChange={(open) => !open && setDialogState(null)}
          title={dialogState.mode === "create" ? "Nova renda" : "Editar renda"}
        >
          <IncomeForm
            defaultValues={
              dialogState.mode === "edit" && dialogState.income
                ? {
                    description: dialogState.income.description,
                    type: dialogState.income.type,
                    amountCents: dialogState.income.amount_cents,
                    referenceMonth: dialogState.income.reference_month,
                    notes: dialogState.income.notes,
                  }
                : { referenceMonth: referenceMonth }
            }
            onSubmit={handleSubmit}
            onCancel={() => setDialogState(null)}
            submitLabel={dialogState.mode === "create" ? "Adicionar renda" : "Salvar alterações"}
          />
        </Dialog>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Excluir renda"
        description={`Tem certeza que deseja excluir "${deleteTarget?.description}"?`}
        confirmLabel="Excluir"
        loading={deleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}
