"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, PiggyBank, History, Pause, Play, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Dialog } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { ListSkeleton } from "@/components/ui/loading-skeleton";
import { SavingsGoalForm } from "@/components/finance/savings-goal-form";
import { SavingsMovementForm } from "@/components/finance/savings-movement-form";
import {
  createSavingsGoalAction,
  updateSavingsGoalAction,
  deleteSavingsGoalAction,
  setSavingsGoalStatusAction,
  registerSavingsMovementAction,
  listSavingsContributionsAction,
} from "@/lib/actions/savings-goals";
import { centsToBRL } from "@/lib/formatters/currency";
import { formatDateBR, parseDateOnly } from "@/lib/formatters/date";
import { computeGoalProgress, monthlyAmountNeeded } from "@/lib/finance/goals";
import type { SavingsGoalFormValues, SavingsMovementFormValues } from "@/lib/validations/savings-goal";
import type { SavingsGoal, SavingsContribution } from "@/types/entities";

interface EditState {
  mode: "create" | "edit";
  goal?: SavingsGoal;
}

export function SavingsGoalsManager({ goals }: { goals: SavingsGoal[] }) {
  const router = useRouter();
  const [editState, setEditState] = useState<EditState | null>(null);
  const [movementTarget, setMovementTarget] = useState<SavingsGoal | null>(null);
  const [historyTarget, setHistoryTarget] = useState<SavingsGoal | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [history, setHistory] = useState<SavingsContribution[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<SavingsGoal | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function handleFormSubmit(values: SavingsGoalFormValues) {
    if (!editState) return;
    const result =
      editState.mode === "create" ? await createSavingsGoalAction(values) : await updateSavingsGoalAction(editState.goal!.id, values);
    if (!result.success) {
      toast.error(result.message ?? "Não foi possível salvar a meta.");
      return;
    }
    toast.success(editState.mode === "create" ? "Meta criada." : "Meta atualizada.");
    setEditState(null);
    router.refresh();
  }

  async function handleMovement(values: SavingsMovementFormValues) {
    if (!movementTarget) return;
    const result = await registerSavingsMovementAction(movementTarget.id, values);
    if (!result.success) {
      toast.error(result.message ?? "Não foi possível registrar a movimentação.");
      return;
    }
    toast.success(result.data?.status === "completed" ? "Movimentação registrada. Meta concluída!" : "Movimentação registrada.");
    setMovementTarget(null);
    router.refresh();
  }

  async function openHistory(goal: SavingsGoal) {
    setHistoryTarget(goal);
    setHistoryLoading(true);
    const result = await listSavingsContributionsAction(goal.id);
    setHistoryLoading(false);
    if (!result.success) {
      toast.error(result.message ?? "Não foi possível carregar o histórico.");
      setHistory([]);
      return;
    }
    setHistory(result.data ?? []);
  }

  async function handleStatusChange(goal: SavingsGoal, status: "active" | "paused") {
    setBusyId(goal.id);
    const result = await setSavingsGoalStatusAction(goal.id, status);
    setBusyId(null);
    if (!result.success) {
      toast.error(result.message ?? "Não foi possível atualizar a meta.");
      return;
    }
    toast.success(status === "paused" ? "Meta pausada." : "Meta retomada.");
    router.refresh();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const result = await deleteSavingsGoalAction(deleteTarget.id);
    setDeleting(false);
    if (!result.success) {
      toast.error(result.message ?? "Não foi possível excluir a meta.");
      return;
    }
    toast.success("Meta excluída.");
    setDeleteTarget(null);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-center justify-between gap-3 mb-5">
          <h2 className="text-lg font-bold font-display">Suas metas</h2>
          <Button onClick={() => setEditState({ mode: "create" })}>
            <Plus className="size-4" aria-hidden="true" />
            <span className="hidden sm:inline">Nova meta</span>
          </Button>
        </div>

        {goals.length === 0 ? (
          <EmptyState
            title="Nenhuma meta cadastrada"
            description="Crie metas para juntar dinheiro com um objetivo claro, como uma viagem ou reserva de emergência."
            action={
              <Button onClick={() => setEditState({ mode: "create" })}>
                <Plus className="size-4" aria-hidden="true" />
                Nova meta
              </Button>
            }
          />
        ) : (
          <ul className="grid gap-4 lg:grid-cols-2">
            {goals.map((goal) => {
              const progress = computeGoalProgress(goal.current_amount_cents, goal.target_amount_cents);
              const monthly = monthlyAmountNeeded(
                goal.current_amount_cents,
                goal.target_amount_cents,
                goal.target_date ? parseDateOnly(goal.target_date) : null
              );
              const isBusy = busyId === goal.id;

              return (
                <li key={goal.id} className="neu-surface neu-rounded p-4 bg-background-alt">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold font-display truncate">{goal.name}</p>
                        {goal.status === "completed" && (
                          <Badge variant="success">
                            <CheckCircle2 className="size-3.5" aria-hidden="true" />
                            Concluída
                          </Badge>
                        )}
                        {goal.status === "paused" && <Badge variant="neutral">Pausada</Badge>}
                      </div>
                      {goal.target_date && <p className="text-xs text-muted-foreground mt-0.5">Prazo: {formatDateBR(goal.target_date)}</p>}
                    </div>
                  </div>

                  <div className="mt-3">
                    <ProgressBar percent={progress.percent} variant={goal.status === "completed" ? "success" : "secondary"} />
                    <div className="flex items-center justify-between mt-1.5 text-xs">
                      <span className="font-bold">{progress.percent.toFixed(0)}%</span>
                      <span className="text-muted-foreground">
                        {centsToBRL(goal.current_amount_cents)} de {centsToBRL(goal.target_amount_cents)}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-x-5 gap-y-1 mt-3 text-xs text-muted-foreground">
                    <span>Restante: {centsToBRL(progress.remainingCents)}</span>
                    {monthly !== null && monthly > 0 && <span>Necessário/mês: {centsToBRL(monthly)}</span>}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mt-3.5 pt-3.5 border-t border-border/40">
                    <Button size="sm" variant="secondary" onClick={() => setMovementTarget(goal)}>
                      <PiggyBank className="size-4" aria-hidden="true" />
                      Movimentar
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => openHistory(goal)}>
                      <History className="size-4" aria-hidden="true" />
                      Histórico
                    </Button>

                    {goal.status !== "completed" &&
                      (goal.status === "paused" ? (
                        <button
                          type="button"
                          aria-label="Retomar"
                          disabled={isBusy}
                          onClick={() => handleStatusChange(goal, "active")}
                          className="size-9 grid place-items-center neu-rounded neu-surface bg-card neu-press cursor-pointer disabled:opacity-50"
                        >
                          <Play className="size-4" aria-hidden="true" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          aria-label="Pausar"
                          disabled={isBusy}
                          onClick={() => handleStatusChange(goal, "paused")}
                          className="size-9 grid place-items-center neu-rounded neu-surface bg-card neu-press cursor-pointer disabled:opacity-50"
                        >
                          <Pause className="size-4" aria-hidden="true" />
                        </button>
                      ))}

                    <button
                      type="button"
                      aria-label="Editar"
                      onClick={() => setEditState({ mode: "edit", goal })}
                      className="size-9 grid place-items-center neu-rounded neu-surface bg-card neu-press cursor-pointer"
                    >
                      <Pencil className="size-4" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      aria-label="Excluir"
                      onClick={() => setDeleteTarget(goal)}
                      className="size-9 grid place-items-center neu-rounded neu-surface bg-card neu-press cursor-pointer"
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
        <Dialog open onOpenChange={(open) => !open && setEditState(null)} title={editState.mode === "create" ? "Nova meta" : "Editar meta"}>
          <SavingsGoalForm
            defaultValues={
              editState.mode === "edit" && editState.goal
                ? {
                    name: editState.goal.name,
                    targetAmountCents: editState.goal.target_amount_cents,
                    targetDate: editState.goal.target_date,
                    notes: editState.goal.notes,
                  }
                : undefined
            }
            onSubmit={handleFormSubmit}
            onCancel={() => setEditState(null)}
            submitLabel={editState.mode === "create" ? "Criar meta" : "Salvar alterações"}
          />
        </Dialog>
      )}

      {movementTarget && (
        <Dialog open onOpenChange={(open) => !open && setMovementTarget(null)} title={`Movimentar — ${movementTarget.name}`}>
          <SavingsMovementForm onSubmit={handleMovement} onCancel={() => setMovementTarget(null)} />
        </Dialog>
      )}

      {historyTarget && (
        <Dialog open onOpenChange={(open) => !open && setHistoryTarget(null)} title={`Histórico — ${historyTarget.name}`}>
          {historyLoading ? (
            <ListSkeleton rows={3} />
          ) : history.length === 0 ? (
            <EmptyState title="Nenhuma movimentação registrada" description="Contribuições e retiradas aparecerão aqui." />
          ) : (
            <ul className="space-y-2">
              {history.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-3 neu-surface neu-rounded px-3 py-2.5 bg-background-alt">
                  <span className="text-sm font-semibold">{formatDateBR(c.contribution_date)}</span>
                  <span className={`font-bold tabular-nums ${c.amount_cents < 0 ? "text-danger" : "text-success"}`}>
                    {c.amount_cents < 0 ? "-" : "+"} {centsToBRL(Math.abs(c.amount_cents))}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Dialog>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Excluir meta"
        description={`Tem certeza que deseja excluir "${deleteTarget?.name}"? Todo o histórico de contribuições será excluído permanentemente.`}
        confirmLabel="Excluir"
        loading={deleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}
