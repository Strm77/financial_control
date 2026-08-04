"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  Pause,
  Play,
  CircleOff,
  CheckCircle2,
  Undo2,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { MetricCard } from "@/components/ui/metric-card";
import { CategoryBadge } from "@/components/finance/category-badge";
import { RecurringPaymentForm } from "@/components/finance/recurring-payment-form";
import { MarkPaidForm } from "@/components/finance/mark-paid-form";
import {
  createRecurringPaymentAction,
  updateRecurringPaymentAction,
  deleteRecurringPaymentAction,
  setRecurringPaymentStatusAction,
  markPaymentPaidAction,
  undoPaymentAction,
} from "@/lib/actions/recurring-payments";
import { computeRecurringPaymentMonthInfo, type ComputedPaymentStatus } from "@/lib/finance/recurring";
import { centsToBRL } from "@/lib/formatters/currency";
import { formatDateBR } from "@/lib/formatters/date";
import type { RecurringPaymentFormValues, MarkPaymentPaidFormValues } from "@/lib/validations/recurring-payment";
import type { Category, PaymentRecord, RecurringPayment } from "@/types/entities";
import { monthPeriodRange, type MonthPeriod } from "@/lib/finance/month";
import { cn } from "@/lib/utils";

interface EditDialogState {
  mode: "create" | "edit";
  payment?: RecurringPayment;
}

const STATUS_BADGE: Record<ComputedPaymentStatus, { label: string; variant: "success" | "warning" | "danger" }> = {
  paid: { label: "Pago", variant: "success" },
  pending: { label: "Pendente", variant: "warning" },
  overdue: { label: "Atrasado", variant: "danger" },
};

export function RecurringPaymentsManager({
  recurringPayments,
  paymentRecords,
  expenseCategories,
  categoriesById,
  period,
  referenceMonth,
  now,
}: {
  recurringPayments: RecurringPayment[];
  paymentRecords: PaymentRecord[];
  expenseCategories: Category[];
  categoriesById: Map<string, Category>;
  period: MonthPeriod;
  referenceMonth: string;
  now: Date;
}) {
  const router = useRouter();
  const [editState, setEditState] = useState<EditDialogState | null>(null);
  const [payTarget, setPayTarget] = useState<RecurringPayment | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RecurringPayment | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const recordsByPaymentId = new Map(paymentRecords.map((r) => [r.recurring_payment_id, r]));
  const { start: monthStart, end: monthEnd } = monthPeriodRange(period);

  const items = recurringPayments
    .filter((p) => p.status !== "finished")
    .filter((p) => p.start_date <= monthEnd && (!p.end_date || p.end_date >= monthStart))
    .map((payment) => {
      const record = recordsByPaymentId.get(payment.id);
      const info = computeRecurringPaymentMonthInfo(
        payment.due_day,
        period.year,
        period.month - 1,
        record?.status === "paid",
        now
      );
      return { payment, record, info };
    })
    .sort((a, b) => a.info.dueDate.getTime() - b.info.dueDate.getTime());

  const totalPendingCents = items
    .filter((i) => i.payment.status === "active" && i.info.status !== "paid")
    .reduce((sum, i) => sum + i.payment.amount_cents, 0);
  const totalPaidCents = items
    .filter((i) => i.info.status === "paid")
    .reduce((sum, i) => sum + (i.record?.amount_paid_cents ?? i.payment.amount_cents), 0);

  async function handleFormSubmit(values: RecurringPaymentFormValues) {
    if (!editState) return;
    const result =
      editState.mode === "create"
        ? await createRecurringPaymentAction(values)
        : await updateRecurringPaymentAction(editState.payment!.id, values);

    if (!result.success) {
      toast.error(result.message ?? "Não foi possível salvar a cobrança.");
      return;
    }
    toast.success(editState.mode === "create" ? "Cobrança criada." : "Cobrança atualizada.");
    setEditState(null);
    router.refresh();
  }

  async function handleMarkPaid(values: MarkPaymentPaidFormValues) {
    if (!payTarget) return;
    const result = await markPaymentPaidAction(payTarget.id, referenceMonth, values);
    if (!result.success) {
      toast.error(result.message ?? "Não foi possível registrar o pagamento.");
      return;
    }
    toast.success("Pagamento registrado.");
    setPayTarget(null);
    router.refresh();
  }

  async function handleUndo(payment: RecurringPayment) {
    setBusyId(payment.id);
    const result = await undoPaymentAction(payment.id, referenceMonth);
    setBusyId(null);
    if (!result.success) {
      toast.error(result.message ?? "Não foi possível desfazer o pagamento.");
      return;
    }
    toast.success("Pagamento desfeito.");
    router.refresh();
  }

  async function handleStatusChange(payment: RecurringPayment, status: "active" | "paused" | "finished") {
    setBusyId(payment.id);
    const result = await setRecurringPaymentStatusAction(payment.id, status);
    setBusyId(null);
    if (!result.success) {
      toast.error(result.message ?? "Não foi possível atualizar o status.");
      return;
    }
    const messages = { active: "Cobrança reativada.", paused: "Cobrança pausada.", finished: "Cobrança encerrada." };
    toast.success(messages[status]);
    router.refresh();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const result = await deleteRecurringPaymentAction(deleteTarget.id);
    setDeleting(false);
    if (!result.success) {
      toast.error(result.message ?? "Não foi possível excluir a cobrança.");
      return;
    }
    toast.success("Cobrança excluída.");
    setDeleteTarget(null);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <MetricCard label="Total pendente no mês" value={centsToBRL(totalPendingCents)} tone="warning" icon={Clock} />
        <MetricCard label="Total pago no mês" value={centsToBRL(totalPaidCents)} tone="success" icon={CheckCircle2} />
      </div>

      <Card>
        <div className="flex items-center justify-between gap-3 mb-5">
          <h2 className="text-lg font-bold font-display">Cobranças do mês</h2>
          <Button onClick={() => setEditState({ mode: "create" })}>
            <Plus className="size-4" aria-hidden="true" />
            <span className="hidden sm:inline">Nova cobrança</span>
          </Button>
        </div>

        {items.length === 0 ? (
          <EmptyState
            title="Nenhuma cobrança cadastrada"
            description="Cadastre contas recorrentes, como aluguel, internet ou assinaturas."
            action={
              <Button onClick={() => setEditState({ mode: "create" })}>
                <Plus className="size-4" aria-hidden="true" />
                Nova cobrança
              </Button>
            }
          />
        ) : (
          <ul className="space-y-3">
            {items.map(({ payment, info }) => {
              const category = payment.category_id ? categoriesById.get(payment.category_id) : undefined;
              const badge = STATUS_BADGE[info.status];
              const isBusy = busyId === payment.id;
              const isPaused = payment.status === "paused";

              return (
                <li
                  key={payment.id}
                  className={cn(
                    "border-brutal rounded-brutal p-4 bg-background-alt",
                    isPaused && "opacity-60"
                  )}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold font-display truncate">{payment.description}</p>
                        <Badge variant={badge.variant}>{badge.label}</Badge>
                        {isPaused && <Badge variant="neutral">Pausada</Badge>}
                        {info.status === "overdue" && (
                          <span className="inline-flex items-center gap-1 text-danger text-xs font-bold">
                            <AlertTriangle className="size-3.5" aria-hidden="true" />
                            {Math.abs(info.daysRemaining)} {Math.abs(info.daysRemaining) === 1 ? "dia" : "dias"} em atraso
                          </span>
                        )}
                        {info.status === "pending" && info.daysRemaining >= 0 && (
                          <span className="text-xs font-semibold text-muted-foreground">
                            {info.daysRemaining === 0 ? "Vence hoje" : `Vence em ${info.daysRemaining} dias`}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <CategoryBadge name={category?.name ?? null} color={category?.color} icon={category?.icon} />
                        <span className="text-xs text-muted-foreground">Vencimento: {formatDateBR(info.dueDate)}</span>
                      </div>
                    </div>

                    <span className="text-xl font-bold font-display tabular-nums shrink-0">
                      {centsToBRL(payment.amount_cents)}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mt-3.5 pt-3.5 border-t border-border/40">
                    {info.status === "paid" ? (
                      <Button size="sm" variant="outline" loading={isBusy} onClick={() => handleUndo(payment)}>
                        <Undo2 className="size-4" aria-hidden="true" />
                        Desfazer pagamento
                      </Button>
                    ) : (
                      <Button size="sm" variant="secondary" disabled={isPaused} onClick={() => setPayTarget(payment)}>
                        <CheckCircle2 className="size-4" aria-hidden="true" />
                        Marcar como pago
                      </Button>
                    )}

                    <button
                      type="button"
                      aria-label="Editar"
                      onClick={() => setEditState({ mode: "edit", payment })}
                      className="size-9 grid place-items-center rounded-brutal border-brutal bg-card press-brutal cursor-pointer"
                    >
                      <Pencil className="size-4" aria-hidden="true" />
                    </button>

                    {isPaused ? (
                      <button
                        type="button"
                        aria-label="Reativar"
                        onClick={() => handleStatusChange(payment, "active")}
                        className="size-9 grid place-items-center rounded-brutal border-brutal bg-card press-brutal cursor-pointer"
                      >
                        <Play className="size-4" aria-hidden="true" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        aria-label="Pausar"
                        onClick={() => handleStatusChange(payment, "paused")}
                        className="size-9 grid place-items-center rounded-brutal border-brutal bg-card press-brutal cursor-pointer"
                      >
                        <Pause className="size-4" aria-hidden="true" />
                      </button>
                    )}

                    <button
                      type="button"
                      aria-label="Encerrar cobrança"
                      onClick={() => handleStatusChange(payment, "finished")}
                      className="size-9 grid place-items-center rounded-brutal border-brutal bg-card press-brutal cursor-pointer"
                    >
                      <CircleOff className="size-4" aria-hidden="true" />
                    </button>

                    <button
                      type="button"
                      aria-label="Excluir"
                      onClick={() => setDeleteTarget(payment)}
                      className="size-9 grid place-items-center rounded-brutal border-brutal bg-card press-brutal cursor-pointer"
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {editState && (
        <Dialog
          open
          onOpenChange={(open) => !open && setEditState(null)}
          title={editState.mode === "create" ? "Nova cobrança recorrente" : "Editar cobrança"}
        >
          <RecurringPaymentForm
            expenseCategories={expenseCategories}
            defaultValues={
              editState.mode === "edit" && editState.payment
                ? {
                    description: editState.payment.description,
                    amountCents: editState.payment.amount_cents,
                    categoryId: editState.payment.category_id,
                    dueDay: editState.payment.due_day,
                    startDate: editState.payment.start_date,
                    endDate: editState.payment.end_date,
                    notes: editState.payment.notes,
                  }
                : undefined
            }
            onSubmit={handleFormSubmit}
            onCancel={() => setEditState(null)}
            submitLabel={editState.mode === "create" ? "Criar cobrança" : "Salvar alterações"}
          />
        </Dialog>
      )}

      {payTarget && (
        <Dialog open onOpenChange={(open) => !open && setPayTarget(null)} title={`Marcar "${payTarget.description}" como pago`}>
          <MarkPaidForm defaultAmountCents={payTarget.amount_cents} onSubmit={handleMarkPaid} onCancel={() => setPayTarget(null)} />
        </Dialog>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Excluir cobrança recorrente"
        description={`Tem certeza que deseja excluir "${deleteTarget?.description}"? Todo o histórico de pagamentos dessa cobrança também será excluído.`}
        confirmLabel="Excluir"
        loading={deleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}
