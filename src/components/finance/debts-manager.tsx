"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, HandCoins, History, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Dialog } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { ListSkeleton } from "@/components/ui/loading-skeleton";
import { DebtForm } from "@/components/finance/debt-form";
import { DebtPaymentForm } from "@/components/finance/debt-payment-form";
import { createDebtAction, updateDebtAction, deleteDebtAction, registerDebtPaymentAction, listDebtPaymentsAction } from "@/lib/actions/debts";
import { centsToBRL } from "@/lib/formatters/currency";
import { formatDateBR } from "@/lib/formatters/date";
import { computeGoalProgress } from "@/lib/finance/goals";
import type { DebtFormValues, DebtPaymentFormValues } from "@/lib/validations/debt";
import type { Debt, DebtPayment } from "@/types/entities";

interface EditState {
  mode: "create" | "edit";
  debt?: Debt;
}

export function DebtsManager({ debts }: { debts: Debt[] }) {
  const router = useRouter();
  const [editState, setEditState] = useState<EditState | null>(null);
  const [payTarget, setPayTarget] = useState<Debt | null>(null);
  const [historyTarget, setHistoryTarget] = useState<Debt | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [history, setHistory] = useState<DebtPayment[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<Debt | null>(null);
  const [deleting, setDeleting] = useState(false);

  const activeDebts = debts.filter((d) => d.status === "active");
  const paidDebts = debts.filter((d) => d.status === "paid");

  async function handleFormSubmit(values: DebtFormValues) {
    if (!editState) return;
    const result = editState.mode === "create" ? await createDebtAction(values) : await updateDebtAction(editState.debt!.id, values);
    if (!result.success) {
      toast.error(result.message ?? "Não foi possível salvar a dívida.");
      return;
    }
    toast.success(editState.mode === "create" ? "Dívida criada." : "Dívida atualizada.");
    setEditState(null);
    router.refresh();
  }

  async function handlePayment(values: DebtPaymentFormValues) {
    if (!payTarget) return;
    const result = await registerDebtPaymentAction(payTarget.id, values);
    if (!result.success) {
      toast.error(result.message ?? "Não foi possível registrar o pagamento.");
      return;
    }
    toast.success(result.data?.status === "paid" ? "Pagamento registrado. Dívida quitada!" : "Pagamento registrado.");
    setPayTarget(null);
    router.refresh();
  }

  async function openHistory(debt: Debt) {
    setHistoryTarget(debt);
    setHistoryLoading(true);
    const result = await listDebtPaymentsAction(debt.id);
    setHistoryLoading(false);
    if (!result.success) {
      toast.error(result.message ?? "Não foi possível carregar o histórico.");
      setHistory([]);
      return;
    }
    setHistory(result.data ?? []);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const result = await deleteDebtAction(deleteTarget.id);
    setDeleting(false);
    if (!result.success) {
      toast.error(result.message ?? "Não foi possível excluir a dívida.");
      return;
    }
    toast.success("Dívida excluída.");
    setDeleteTarget(null);
    router.refresh();
  }

  function renderDebtCard(debt: Debt) {
    const progress = computeGoalProgress(debt.original_amount_cents - debt.current_balance_cents, debt.original_amount_cents);
    return (
      <li key={debt.id} className="border-brutal rounded-brutal p-4 bg-background-alt">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-bold font-display truncate">{debt.name}</p>
              {debt.status === "paid" && (
                <Badge variant="success">
                  <CheckCircle2 className="size-3.5" aria-hidden="true" />
                  Quitada
                </Badge>
              )}
            </div>
            {debt.creditor && <p className="text-xs text-muted-foreground mt-0.5">{debt.creditor}</p>}
          </div>
          <div className="text-right shrink-0">
            <p className="text-xl font-bold font-display tabular-nums">{centsToBRL(debt.current_balance_cents)}</p>
            <p className="text-xs text-muted-foreground">de {centsToBRL(debt.original_amount_cents)}</p>
          </div>
        </div>

        <div className="mt-3">
          <ProgressBar percent={progress.percent} variant={debt.status === "paid" ? "success" : "primary"} label={`${progress.percent}% quitado`} />
          <p className="text-xs text-muted-foreground mt-1">{progress.percent.toFixed(0)}% quitado</p>
        </div>

        <div className="flex flex-wrap gap-x-5 gap-y-1 mt-3 text-xs text-muted-foreground">
          {debt.interest_rate !== null && <span>Juros: {debt.interest_rate}% (informativo)</span>}
          {debt.minimum_payment_cents !== null && <span>Mínimo: {centsToBRL(debt.minimum_payment_cents)}</span>}
          {debt.due_day !== null && <span>Vencimento: dia {debt.due_day}</span>}
        </div>

        <div className="flex flex-wrap items-center gap-2 mt-3.5 pt-3.5 border-t border-border/40">
          {debt.status === "active" && (
            <Button size="sm" variant="secondary" onClick={() => setPayTarget(debt)}>
              <HandCoins className="size-4" aria-hidden="true" />
              Registrar pagamento
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={() => openHistory(debt)}>
            <History className="size-4" aria-hidden="true" />
            Histórico
          </Button>
          <button
            type="button"
            aria-label="Editar"
            onClick={() => setEditState({ mode: "edit", debt })}
            className="size-9 grid place-items-center rounded-brutal border-brutal bg-card press-brutal cursor-pointer"
          >
            <Pencil className="size-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label="Excluir"
            onClick={() => setDeleteTarget(debt)}
            className="size-9 grid place-items-center rounded-brutal border-brutal bg-card press-brutal cursor-pointer"
          >
            <Trash2 className="size-4" aria-hidden="true" />
          </button>
        </div>
      </li>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-center justify-between gap-3 mb-5">
          <h2 className="text-lg font-bold font-display">Dívidas ativas</h2>
          <Button onClick={() => setEditState({ mode: "create" })}>
            <Plus className="size-4" aria-hidden="true" />
            <span className="hidden sm:inline">Nova dívida</span>
          </Button>
        </div>

        {activeDebts.length === 0 ? (
          <EmptyState
            title="Nenhuma dívida ativa"
            description="Cadastre financiamentos, empréstimos ou parcelamentos para acompanhar o saldo devedor."
            action={
              <Button onClick={() => setEditState({ mode: "create" })}>
                <Plus className="size-4" aria-hidden="true" />
                Nova dívida
              </Button>
            }
          />
        ) : (
          <ul className="space-y-3">{activeDebts.map(renderDebtCard)}</ul>
        )}
      </Card>

      {paidDebts.length > 0 && (
        <Card>
          <h2 className="text-lg font-bold font-display mb-5">Dívidas quitadas</h2>
          <ul className="space-y-3">{paidDebts.map(renderDebtCard)}</ul>
        </Card>
      )}

      {editState && (
        <Dialog open onOpenChange={(open) => !open && setEditState(null)} title={editState.mode === "create" ? "Nova dívida" : "Editar dívida"}>
          <DebtForm
            mode={editState.mode}
            defaultValues={
              editState.mode === "edit" && editState.debt
                ? {
                    name: editState.debt.name,
                    creditor: editState.debt.creditor,
                    originalAmountCents: editState.debt.original_amount_cents,
                    interestRate: editState.debt.interest_rate,
                    minimumPaymentCents: editState.debt.minimum_payment_cents,
                    dueDay: editState.debt.due_day,
                    notes: editState.debt.notes,
                  }
                : undefined
            }
            onSubmit={handleFormSubmit}
            onCancel={() => setEditState(null)}
            submitLabel={editState.mode === "create" ? "Criar dívida" : "Salvar alterações"}
          />
        </Dialog>
      )}

      {payTarget && (
        <Dialog open onOpenChange={(open) => !open && setPayTarget(null)} title={`Registrar pagamento — ${payTarget.name}`}>
          <DebtPaymentForm currentBalanceCents={payTarget.current_balance_cents} onSubmit={handlePayment} onCancel={() => setPayTarget(null)} />
        </Dialog>
      )}

      {historyTarget && (
        <Dialog open onOpenChange={(open) => !open && setHistoryTarget(null)} title={`Histórico — ${historyTarget.name}`}>
          {historyLoading ? (
            <ListSkeleton rows={3} />
          ) : history.length === 0 ? (
            <EmptyState title="Nenhum pagamento registrado" description="Os pagamentos registrados aparecerão aqui." />
          ) : (
            <ul className="space-y-2">
              {history.map((payment) => (
                <li key={payment.id} className="flex items-center justify-between gap-3 border-brutal rounded-brutal px-3 py-2.5 bg-background-alt">
                  <span className="text-sm font-semibold">{formatDateBR(payment.payment_date)}</span>
                  <span className="font-bold tabular-nums">{centsToBRL(payment.amount_cents)}</span>
                </li>
              ))}
            </ul>
          )}
        </Dialog>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Excluir dívida"
        description={`Tem certeza que deseja excluir "${deleteTarget?.name}"? Todo o histórico de pagamentos será excluído permanentemente.`}
        confirmLabel="Excluir"
        loading={deleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}
