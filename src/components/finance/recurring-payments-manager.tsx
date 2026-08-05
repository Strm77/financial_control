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
  Wallet,
  PiggyBank,
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
import { computeDiscountCents } from "@/lib/finance/payment-progress";
import { centsToBRL } from "@/lib/formatters/currency";
import { formatDateBR } from "@/lib/formatters/date";
import { PAYMENT_TYPE_LABELS, type RecurringPaymentFormValues, type MarkPaymentPaidFormValues } from "@/lib/validations/recurring-payment";
import type { Category, Card as CardEntity, PaymentRecord, RecurringPayment } from "@/types/entities";
import { monthPeriodRange, type MonthPeriod } from "@/lib/finance/month";
import { cn } from "@/lib/utils";

interface EditDialogState {
  mode: "create" | "edit";
  payment?: RecurringPayment;
}

const STATUS_BADGE: Record<ComputedPaymentStatus, { label: string; variant: "success" | "warning" | "danger" }> = {
  paid: { label: "Pago", variant: "success" },
  partial: { label: "Parcial", variant: "warning" },
  pending: { label: "Pendente", variant: "warning" },
  overdue: { label: "Atrasado", variant: "danger" },
};

export function RecurringPaymentsManager({
  recurringPayments,
  paymentRecords,
  expenseCategories,
  categoriesById,
  cards,
  period,
  referenceMonth,
  now,
  incomeTotalCents,
}: {
  recurringPayments: RecurringPayment[];
  paymentRecords: PaymentRecord[];
  expenseCategories: Category[];
  categoriesById: Map<string, Category>;
  cards: CardEntity[];
  period: MonthPeriod;
  referenceMonth: string;
  now: Date;
  incomeTotalCents: number;
}) {
  const router = useRouter();
  const [editState, setEditState] = useState<EditDialogState | null>(null);
  const [payTarget, setPayTarget] = useState<{ payment: RecurringPayment; record?: PaymentRecord } | null>(null);
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
        record?.status === "paid" ? "paid" : record?.status === "partial" ? "partial" : null,
        now
      );
      return { payment, record, info };
    })
    .sort((a, b) => a.info.dueDate.getTime() - b.info.dueDate.getTime());

  const totalPaidCents = items
    .filter((i) => i.info.status === "paid" || i.info.status === "partial")
    .reduce((sum, i) => sum + (i.record?.amount_paid_cents ?? 0), 0);
  const totalPendingCents = items
    .filter((i) => i.payment.status === "active" && i.info.status !== "paid")
    .reduce((sum, i) => sum + (i.payment.amount_cents - (i.record?.amount_paid_cents ?? 0)), 0);
  const remainingIncomeCents = incomeTotalCents - (totalPaidCents + totalPendingCents);

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
    const result = await markPaymentPaidAction(payTarget.payment.id, referenceMonth, values);
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

  function ActionButtons({ payment, record, info }: (typeof items)[number]) {
    const isBusy = busyId === payment.id;
    const isPaused = payment.status === "paused";

    return (
      <div className="flex flex-wrap items-center gap-1.5">
        {info.status === "paid" ? (
          <Button size="sm" variant="outline" loading={isBusy} onClick={() => handleUndo(payment)}>
            <Undo2 className="size-3.5" aria-hidden="true" />
            Desfazer
          </Button>
        ) : info.status === "partial" ? (
          <>
            <Button size="sm" variant="secondary" onClick={() => setPayTarget({ payment, record })}>
              <CheckCircle2 className="size-3.5" aria-hidden="true" />
              Atualizar
            </Button>
            <Button size="sm" variant="outline" loading={isBusy} onClick={() => handleUndo(payment)}>
              <Undo2 className="size-3.5" aria-hidden="true" />
            </Button>
          </>
        ) : (
          <Button size="sm" variant="secondary" disabled={isPaused} onClick={() => setPayTarget({ payment, record })}>
            <CheckCircle2 className="size-3.5" aria-hidden="true" />
            Pagar
          </Button>
        )}

        <button
          type="button"
          aria-label="Editar"
          onClick={() => setEditState({ mode: "edit", payment })}
          className="size-8 grid place-items-center rounded-brutal border-brutal bg-card press-brutal cursor-pointer"
        >
          <Pencil className="size-3.5" aria-hidden="true" />
        </button>

        {isPaused ? (
          <button
            type="button"
            aria-label="Reativar"
            onClick={() => handleStatusChange(payment, "active")}
            className="size-8 grid place-items-center rounded-brutal border-brutal bg-card press-brutal cursor-pointer"
          >
            <Play className="size-3.5" aria-hidden="true" />
          </button>
        ) : (
          <button
            type="button"
            aria-label="Pausar"
            onClick={() => handleStatusChange(payment, "paused")}
            className="size-8 grid place-items-center rounded-brutal border-brutal bg-card press-brutal cursor-pointer"
          >
            <Pause className="size-3.5" aria-hidden="true" />
          </button>
        )}

        <button
          type="button"
          aria-label="Encerrar cobrança"
          onClick={() => handleStatusChange(payment, "finished")}
          className="size-8 grid place-items-center rounded-brutal border-brutal bg-card press-brutal cursor-pointer"
        >
          <CircleOff className="size-3.5" aria-hidden="true" />
        </button>

        <button
          type="button"
          aria-label="Excluir"
          onClick={() => setDeleteTarget(payment)}
          className="size-8 grid place-items-center rounded-brutal border-brutal bg-card press-brutal cursor-pointer"
        >
          <Trash2 className="size-3.5" aria-hidden="true" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold font-display mb-3">Meus Pagamentos</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard label="Total pendente no mês" value={centsToBRL(totalPendingCents)} tone="warning" icon={Clock} />
          <MetricCard label="Total pago no mês" value={centsToBRL(totalPaidCents)} tone="success" icon={CheckCircle2} />
          <MetricCard label="Renda total do mês" value={centsToBRL(incomeTotalCents)} tone="secondary" icon={Wallet} />
          <MetricCard
            label="Renda restante"
            value={centsToBRL(remainingIncomeCents)}
            tone={remainingIncomeCents < 0 ? "danger" : "neutral"}
            icon={PiggyBank}
            hint="Renda − (pago + pendente)"
          />
        </div>
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
          <>
            {/* Desktop: tabela compacta */}
            <div className="hidden lg:block overflow-x-auto brutal-scroll">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b-[3px] border-b-border">
                    <th className="py-2 pr-3 font-bold">Descrição</th>
                    <th className="py-2 pr-3 font-bold">Categoria</th>
                    <th className="py-2 pr-3 font-bold">Vencimento</th>
                    <th className="py-2 pr-3 font-bold text-right">Valor</th>
                    <th className="py-2 pr-3 font-bold">Status</th>
                    <th className="py-2 pl-3 font-bold text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => {
                    const { payment, record, info } = item;
                    const category = payment.category_id ? categoriesById.get(payment.category_id) : undefined;
                    const badge = STATUS_BADGE[info.status];
                    const isPaused = payment.status === "paused";
                    const discountCents =
                      record?.amount_paid_cents != null ? computeDiscountCents(payment.amount_cents, record.amount_paid_cents) : null;

                    return (
                      <tr key={payment.id} className={cn("border-b border-border/40 align-top", isPaused && "opacity-60")}>
                        <td className="py-2.5 pr-3">
                          <p className="font-semibold">{payment.description}</p>
                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            <Badge variant="neutral">{PAYMENT_TYPE_LABELS[payment.payment_type]}</Badge>
                            {isPaused && <Badge variant="neutral">Pausada</Badge>}
                          </div>
                        </td>
                        <td className="py-2.5 pr-3">
                          <CategoryBadge name={category?.name ?? null} color={category?.color} icon={category?.icon} />
                        </td>
                        <td className="py-2.5 pr-3 whitespace-nowrap">
                          <p>{formatDateBR(info.dueDate)}</p>
                          {info.status === "overdue" && (
                            <span className="inline-flex items-center gap-1 text-danger text-xs font-bold">
                              <AlertTriangle className="size-3" aria-hidden="true" />
                              {Math.abs(info.daysRemaining)}d em atraso
                            </span>
                          )}
                          {info.status === "pending" && info.daysRemaining >= 0 && (
                            <span className="text-xs text-muted-foreground">
                              {info.daysRemaining === 0 ? "Vence hoje" : `${info.daysRemaining}d restantes`}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 pr-3 text-right">
                          <p className="font-bold tabular-nums">{centsToBRL(payment.amount_cents)}</p>
                          {record?.amount_paid_cents != null && (
                            <p className="text-xs text-muted-foreground">Pago: {centsToBRL(record.amount_paid_cents)}</p>
                          )}
                          {discountCents !== null && discountCents !== 0 && (
                            <p className={cn("text-xs font-semibold", discountCents > 0 ? "text-success" : "text-danger")}>
                              {discountCents > 0 ? `Desc. ${centsToBRL(discountCents)}` : `Acrésc. ${centsToBRL(Math.abs(discountCents))}`}
                            </p>
                          )}
                        </td>
                        <td className="py-2.5 pr-3">
                          <Badge variant={badge.variant}>{badge.label}</Badge>
                        </td>
                        <td className="py-2.5 pl-3">
                          <ActionButtons {...item} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile/tablet: linhas compactas empilhadas */}
            <ul className="lg:hidden space-y-2">
              {items.map((item) => {
                const { payment, info } = item;
                const category = payment.category_id ? categoriesById.get(payment.category_id) : undefined;
                const badge = STATUS_BADGE[info.status];
                const isPaused = payment.status === "paused";

                return (
                  <li
                    key={payment.id}
                    className={cn("border-brutal rounded-brutal p-3 bg-background-alt", isPaused && "opacity-60")}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold truncate">{payment.description}</p>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          <Badge variant={badge.variant}>{badge.label}</Badge>
                          <Badge variant="neutral">{PAYMENT_TYPE_LABELS[payment.payment_type]}</Badge>
                        </div>
                      </div>
                      <span className="font-bold tabular-nums shrink-0">{centsToBRL(payment.amount_cents)}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <CategoryBadge name={category?.name ?? null} color={category?.color} icon={category?.icon} />
                      <span className="text-xs text-muted-foreground">{formatDateBR(info.dueDate)}</span>
                    </div>
                    <div className="mt-2.5 pt-2.5 border-t border-border/40">
                      <ActionButtons {...item} />
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
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
            cards={cards}
            defaultValues={
              editState.mode === "edit" && editState.payment
                ? {
                    description: editState.payment.description,
                    paymentType: editState.payment.payment_type,
                    amountCents: editState.payment.amount_cents,
                    categoryId: editState.payment.category_id,
                    cardId: editState.payment.card_id,
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
        <Dialog open onOpenChange={(open) => !open && setPayTarget(null)} title={`Registrar pagamento — ${payTarget.payment.description}`}>
          <MarkPaidForm
            expectedAmountCents={payTarget.payment.amount_cents}
            defaultAmountCents={payTarget.record?.amount_paid_cents ?? payTarget.payment.amount_cents}
            defaultHasDiscount={payTarget.record?.status === "paid" && (payTarget.record?.amount_paid_cents ?? 0) < payTarget.payment.amount_cents}
            onSubmit={handleMarkPaid}
            onCancel={() => setPayTarget(null)}
          />
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
