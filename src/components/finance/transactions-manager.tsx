"use client";

import { useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Search, ChevronLeft, ChevronRight, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Dialog } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { MetricCard } from "@/components/ui/metric-card";
import { CategoryBadge } from "@/components/finance/category-badge";
import { TransactionForm } from "@/components/finance/transaction-form";
import { createTransactionAction, updateTransactionAction, deleteTransactionAction } from "@/lib/actions/transactions";
import { centsToBRL } from "@/lib/formatters/currency";
import { formatDateBR } from "@/lib/formatters/date";
import { PAYMENT_METHOD_LABELS } from "@/lib/validations/transaction";
import type { TransactionFormValues } from "@/lib/validations/transaction";
import type { Category, Transaction } from "@/types/entities";

interface DialogState {
  mode: "create" | "edit";
  transaction?: Transaction;
}

export function TransactionsManager({
  transactions,
  categories,
  totals,
  totalCount,
  page,
  pageSize,
  filters,
}: {
  transactions: Transaction[];
  categories: Category[];
  totals: { incomeCents: number; expenseCents: number; balanceCents: number };
  totalCount: number;
  page: number;
  pageSize: number;
  filters: { type: string; categoryId: string; search: string };
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [dialogState, setDialogState] = useState<DialogState | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [searchValue, setSearchValue] = useState(filters.search);

  const categoriesById = new Map(categories.map((c) => [c.id, c]));
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  function updateParams(patch: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (value === null || value === "") params.delete(key);
      else params.set(key, value);
    }
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  }

  async function handleSubmit(values: TransactionFormValues) {
    if (!dialogState) return;
    const result =
      dialogState.mode === "create"
        ? await createTransactionAction(values)
        : await updateTransactionAction(dialogState.transaction!.id, values);

    if (!result.success) {
      toast.error(result.message ?? "Não foi possível salvar a transação.");
      return;
    }
    toast.success(dialogState.mode === "create" ? "Transação criada." : "Transação atualizada.");
    setDialogState(null);
    router.refresh();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const result = await deleteTransactionAction(deleteTarget.id);
    setDeleting(false);
    if (!result.success) {
      toast.error(result.message ?? "Não foi possível excluir a transação.");
      return;
    }
    toast.success("Transação excluída.");
    setDeleteTarget(null);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard label="Receitas do período" value={centsToBRL(totals.incomeCents)} tone="success" icon={ArrowUpCircle} />
        <MetricCard label="Despesas do período" value={centsToBRL(totals.expenseCents)} tone="danger" icon={ArrowDownCircle} />
        <MetricCard label="Saldo do período" value={centsToBRL(totals.balanceCents)} tone="primary" />
      </div>

      <Card>
        <div className="flex flex-col lg:flex-row lg:items-end gap-3 mb-5">
          <form
            className="flex-1 min-w-0"
            onSubmit={(e) => {
              e.preventDefault();
              updateParams({ q: searchValue || null, pagina: null });
            }}
          >
            <label htmlFor="search" className="sr-only">
              Buscar por descrição
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" aria-hidden="true" />
              <Input
                id="search"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="Buscar por descrição..."
                className="pl-10"
              />
            </div>
          </form>

          <div className="flex gap-3">
            <Select
              aria-label="Filtrar por tipo"
              value={filters.type}
              onChange={(e) => updateParams({ tipo: e.target.value || null, pagina: null })}
              className="w-40"
            >
              <option value="">Todos os tipos</option>
              <option value="income">Receitas</option>
              <option value="expense">Despesas</option>
            </Select>

            <Select
              aria-label="Filtrar por categoria"
              value={filters.categoryId}
              onChange={(e) => updateParams({ categoria: e.target.value || null, pagina: null })}
              className="w-44"
            >
              <option value="">Todas categorias</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>

            <Button type="button" onClick={() => setDialogState({ mode: "create" })} className="shrink-0">
              <Plus className="size-4" aria-hidden="true" />
              <span className="hidden sm:inline">Nova transação</span>
            </Button>
          </div>
        </div>

        {transactions.length === 0 ? (
          <EmptyState
            title="Nenhuma transação encontrada"
            description="Ajuste os filtros ou cadastre uma nova transação para este período."
            action={
              <Button onClick={() => setDialogState({ mode: "create" })}>
                <Plus className="size-4" aria-hidden="true" />
                Nova transação
              </Button>
            }
          />
        ) : (
          <>
            {/* Desktop: tabela */}
            <div className="hidden md:block overflow-x-auto brutal-scroll">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b-[3px] border-b-border">
                    <th className="py-2 pr-3 font-bold">Data</th>
                    <th className="py-2 pr-3 font-bold">Descrição</th>
                    <th className="py-2 pr-3 font-bold">Categoria</th>
                    <th className="py-2 pr-3 font-bold">Forma de pagamento</th>
                    <th className="py-2 pr-3 font-bold text-right">Valor</th>
                    <th className="py-2 pl-3 font-bold text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t) => {
                    const category = t.category_id ? categoriesById.get(t.category_id) : undefined;
                    return (
                      <tr key={t.id} className="border-b border-border/40">
                        <td className="py-3 pr-3 whitespace-nowrap">{formatDateBR(t.transaction_date)}</td>
                        <td className="py-3 pr-3">{t.description}</td>
                        <td className="py-3 pr-3">
                          <CategoryBadge name={category?.name ?? null} color={category?.color} icon={category?.icon} />
                        </td>
                        <td className="py-3 pr-3 text-muted-foreground">
                          {t.payment_method ? PAYMENT_METHOD_LABELS[t.payment_method as keyof typeof PAYMENT_METHOD_LABELS] : "—"}
                        </td>
                        <td
                          className={`py-3 pr-3 text-right font-bold tabular-nums ${t.type === "income" ? "text-success" : "text-danger"}`}
                        >
                          {t.type === "income" ? "+" : "-"} {centsToBRL(t.amount_cents)}
                        </td>
                        <td className="py-3 pl-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              aria-label={`Editar ${t.description}`}
                              onClick={() => setDialogState({ mode: "edit", transaction: t })}
                              className="size-9 grid place-items-center rounded-brutal border-brutal bg-card press-brutal cursor-pointer"
                            >
                              <Pencil className="size-4" aria-hidden="true" />
                            </button>
                            <button
                              type="button"
                              aria-label={`Excluir ${t.description}`}
                              onClick={() => setDeleteTarget(t)}
                              className="size-9 grid place-items-center rounded-brutal border-brutal bg-card press-brutal cursor-pointer"
                            >
                              <Trash2 className="size-4" aria-hidden="true" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile: cards */}
            <ul className="md:hidden space-y-3">
              {transactions.map((t) => {
                const category = t.category_id ? categoriesById.get(t.category_id) : undefined;
                return (
                  <li key={t.id} className="border-brutal rounded-brutal p-3 bg-background-alt">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold truncate">{t.description}</p>
                        <p className="text-xs text-muted-foreground">{formatDateBR(t.transaction_date)}</p>
                      </div>
                      <span className={`font-bold tabular-nums shrink-0 ${t.type === "income" ? "text-success" : "text-danger"}`}>
                        {t.type === "income" ? "+" : "-"} {centsToBRL(t.amount_cents)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-2.5">
                      <CategoryBadge name={category?.name ?? null} color={category?.color} icon={category?.icon} />
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          aria-label={`Editar ${t.description}`}
                          onClick={() => setDialogState({ mode: "edit", transaction: t })}
                          className="size-9 grid place-items-center rounded-brutal border-brutal bg-card press-brutal cursor-pointer"
                        >
                          <Pencil className="size-4" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          aria-label={`Excluir ${t.description}`}
                          onClick={() => setDeleteTarget(t)}
                          className="size-9 grid place-items-center rounded-brutal border-brutal bg-card press-brutal cursor-pointer"
                        >
                          <Trash2 className="size-4" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="flex items-center justify-between gap-3 mt-5 pt-4 border-t-[3px] border-t-border">
              <span className="text-sm text-muted-foreground">
                Página {page} de {totalPages} · {totalCount} {totalCount === 1 ? "transação" : "transações"}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page <= 1 || isPending}
                  onClick={() => updateParams({ pagina: String(page - 1) })}
                >
                  <ChevronLeft className="size-4" aria-hidden="true" />
                  Anterior
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages || isPending}
                  onClick={() => updateParams({ pagina: String(page + 1) })}
                >
                  Próxima
                  <ChevronRight className="size-4" aria-hidden="true" />
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>

      {dialogState && (
        <Dialog
          open
          onOpenChange={(open) => !open && setDialogState(null)}
          title={dialogState.mode === "create" ? "Nova transação" : "Editar transação"}
        >
          <TransactionForm
            categories={categories}
            defaultValues={
              dialogState.mode === "edit" && dialogState.transaction
                ? {
                    description: dialogState.transaction.description,
                    amountCents: dialogState.transaction.amount_cents,
                    type: dialogState.transaction.type,
                    categoryId: dialogState.transaction.category_id,
                    transactionDate: dialogState.transaction.transaction_date,
                    paymentMethod: dialogState.transaction.payment_method as TransactionFormValues["paymentMethod"],
                    notes: dialogState.transaction.notes,
                  }
                : undefined
            }
            onSubmit={handleSubmit}
            onCancel={() => setDialogState(null)}
            submitLabel={dialogState.mode === "create" ? "Criar transação" : "Salvar alterações"}
          />
        </Dialog>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Excluir transação"
        description={`Tem certeza que deseja excluir "${deleteTarget?.description}"? Essa ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        loading={deleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}
