"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, CreditCard, ChevronDown, ChevronUp, CheckCircle2, Receipt } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { ListSkeleton } from "@/components/ui/loading-skeleton";
import { CardForm } from "@/components/finance/card-form";
import { InvoiceItemForm } from "@/components/finance/invoice-item-form";
import { InvoiceFileUpload } from "@/components/finance/invoice-file-upload";
import { createCardAction, updateCardAction, deleteCardAction } from "@/lib/actions/cards";
import {
  createInvoiceAction,
  setInvoiceStatusAction,
  deleteInvoiceAction,
  listInvoiceItemsAction,
  addInvoiceItemAction,
  deleteInvoiceItemAction,
} from "@/lib/actions/invoices";
import { centsToBRL } from "@/lib/formatters/currency";
import { CARD_TYPE_LABELS, type CardFormValues } from "@/lib/validations/card";
import type { InvoiceItemFormValues } from "@/lib/validations/invoice";
import type { Card as CardEntity, Invoice, InvoiceItem } from "@/types/entities";

interface CardDialogState {
  mode: "create" | "edit";
  card?: CardEntity;
}

export function FaturasManager({
  cards,
  invoicesByCardId,
  referenceMonth,
}: {
  cards: CardEntity[];
  invoicesByCardId: Record<string, Invoice>;
  referenceMonth: string;
}) {
  const router = useRouter();
  const [cardDialogState, setCardDialogState] = useState<CardDialogState | null>(null);
  const [deleteCardTarget, setDeleteCardTarget] = useState<CardEntity | null>(null);
  const [deletingCard, setDeletingCard] = useState(false);

  const [expandedInvoiceId, setExpandedInvoiceId] = useState<string | null>(null);
  const [itemsByInvoiceId, setItemsByInvoiceId] = useState<Record<string, InvoiceItem[]>>({});
  const [loadingItemsId, setLoadingItemsId] = useState<string | null>(null);
  const [addItemInvoiceId, setAddItemInvoiceId] = useState<string | null>(null);
  const [busyInvoiceId, setBusyInvoiceId] = useState<string | null>(null);

  async function handleCardFormSubmit(values: CardFormValues) {
    if (!cardDialogState) return;
    const result =
      cardDialogState.mode === "create" ? await createCardAction(values) : await updateCardAction(cardDialogState.card!.id, values);
    if (!result.success) {
      toast.error(result.message ?? "Não foi possível salvar o cartão.");
      return;
    }
    toast.success(cardDialogState.mode === "create" ? "Cartão criado." : "Cartão atualizado.");
    setCardDialogState(null);
    router.refresh();
  }

  async function handleDeleteCard() {
    if (!deleteCardTarget) return;
    setDeletingCard(true);
    const result = await deleteCardAction(deleteCardTarget.id);
    setDeletingCard(false);
    if (!result.success) {
      toast.error(result.message ?? "Não foi possível excluir o cartão.");
      return;
    }
    toast.success("Cartão excluído.");
    setDeleteCardTarget(null);
    router.refresh();
  }

  async function handleCreateInvoice(cardId: string) {
    setBusyInvoiceId(cardId);
    const result = await createInvoiceAction({ cardId, referenceMonth, notes: null });
    setBusyInvoiceId(null);
    if (!result.success) {
      toast.error(result.message ?? "Não foi possível criar a fatura.");
      return;
    }
    toast.success("Fatura criada.");
    router.refresh();
  }

  async function toggleExpand(invoice: Invoice) {
    if (expandedInvoiceId === invoice.id) {
      setExpandedInvoiceId(null);
      return;
    }
    setExpandedInvoiceId(invoice.id);
    if (!itemsByInvoiceId[invoice.id]) {
      setLoadingItemsId(invoice.id);
      const result = await listInvoiceItemsAction(invoice.id);
      setLoadingItemsId(null);
      if (!result.success) {
        toast.error(result.message ?? "Não foi possível carregar os itens.");
        return;
      }
      setItemsByInvoiceId((prev) => ({ ...prev, [invoice.id]: result.data ?? [] }));
    }
  }

  async function refreshItems(invoiceId: string) {
    const result = await listInvoiceItemsAction(invoiceId);
    if (result.success) {
      setItemsByInvoiceId((prev) => ({ ...prev, [invoiceId]: result.data ?? [] }));
    }
  }

  async function handleAddItem(values: InvoiceItemFormValues) {
    if (!addItemInvoiceId) return;
    const result = await addInvoiceItemAction(addItemInvoiceId, values);
    if (!result.success) {
      toast.error(result.message ?? "Não foi possível adicionar o item.");
      return;
    }
    toast.success("Item adicionado.");
    await refreshItems(addItemInvoiceId);
    setAddItemInvoiceId(null);
    router.refresh();
  }

  async function handleDeleteItem(invoiceId: string, itemId: string) {
    const result = await deleteInvoiceItemAction(itemId);
    if (!result.success) {
      toast.error(result.message ?? "Não foi possível excluir o item.");
      return;
    }
    toast.success("Item excluído.");
    await refreshItems(invoiceId);
    router.refresh();
  }

  async function handleToggleInvoiceStatus(invoice: Invoice) {
    setBusyInvoiceId(invoice.id);
    const nextStatus = invoice.status === "paga" ? "aberta" : "paga";
    const result = await setInvoiceStatusAction(invoice.id, nextStatus);
    setBusyInvoiceId(null);
    if (!result.success) {
      toast.error(result.message ?? "Não foi possível atualizar a fatura.");
      return;
    }
    toast.success(nextStatus === "paga" ? "Fatura marcada como paga." : "Fatura reaberta.");
    router.refresh();
  }

  async function handleDeleteInvoice(invoiceId: string) {
    setBusyInvoiceId(invoiceId);
    const result = await deleteInvoiceAction(invoiceId);
    setBusyInvoiceId(null);
    if (!result.success) {
      toast.error(result.message ?? "Não foi possível excluir a fatura.");
      return;
    }
    toast.success("Fatura excluída.");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-center justify-between gap-3 mb-5">
          <h2 className="text-lg font-bold font-display">Seus cartões</h2>
          <Button onClick={() => setCardDialogState({ mode: "create" })}>
            <Plus className="size-4" aria-hidden="true" />
            <span className="hidden sm:inline">Novo cartão</span>
          </Button>
        </div>

        {cards.length === 0 ? (
          <EmptyState
            title="Nenhum cartão cadastrado"
            description="Cadastre seus cartões de crédito ou de loja para acompanhar as faturas mês a mês."
            action={
              <Button onClick={() => setCardDialogState({ mode: "create" })}>
                <Plus className="size-4" aria-hidden="true" />
                Novo cartão
              </Button>
            }
          />
        ) : (
          <ul className="space-y-4">
            {cards.map((card) => {
              const invoice = invoicesByCardId[card.id];
              const items = invoice ? itemsByInvoiceId[invoice.id] : undefined;
              const itemsTotal = items?.reduce((sum, i) => sum + i.amount_cents, 0) ?? 0;
              const isExpanded = invoice && expandedInvoiceId === invoice.id;
              const isBusy = invoice ? busyInvoiceId === invoice.id : busyInvoiceId === card.id;

              return (
                <li key={card.id} className="border-brutal rounded-brutal bg-background-alt overflow-hidden">
                  <div className="p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex items-center gap-2.5">
                        <span className="size-9 rounded-brutal border-brutal bg-card grid place-items-center shrink-0">
                          <CreditCard className="size-4" aria-hidden="true" />
                        </span>
                        <div className="min-w-0">
                          <p className="font-bold font-display truncate">{card.name}</p>
                          <p className="text-xs text-muted-foreground">{CARD_TYPE_LABELS[card.card_type]}</p>
                        </div>
                        {invoice && (
                          <Badge variant={invoice.status === "paga" ? "success" : "warning"}>
                            {invoice.status === "paga" ? "Paga" : "Aberta"}
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          aria-label="Editar cartão"
                          onClick={() => setCardDialogState({ mode: "edit", card })}
                          className="size-9 grid place-items-center rounded-brutal border-brutal bg-card press-brutal cursor-pointer"
                        >
                          <Pencil className="size-4" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          aria-label="Excluir cartão"
                          onClick={() => setDeleteCardTarget(card)}
                          className="size-9 grid place-items-center rounded-brutal border-brutal bg-card press-brutal cursor-pointer"
                        >
                          <Trash2 className="size-4" aria-hidden="true" />
                        </button>
                      </div>
                    </div>

                    {!invoice ? (
                      <div className="mt-4">
                        <Button size="sm" variant="secondary" loading={isBusy} onClick={() => handleCreateInvoice(card.id)}>
                          <Receipt className="size-4" aria-hidden="true" />
                          Criar fatura deste mês
                        </Button>
                      </div>
                    ) : (
                      <div className="mt-4 space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <InvoiceFileUpload invoiceId={invoice.id} hasAttachment={!!invoice.attachment_path} />
                          <Button
                            size="sm"
                            variant="outline"
                            loading={isBusy}
                            onClick={() => handleToggleInvoiceStatus(invoice)}
                          >
                            <CheckCircle2 className="size-4" aria-hidden="true" />
                            {invoice.status === "paga" ? "Reabrir fatura" : "Marcar fatura como paga"}
                          </Button>
                          <button
                            type="button"
                            onClick={() => toggleExpand(invoice)}
                            className="ml-auto inline-flex items-center gap-1 text-sm font-semibold underline underline-offset-2 hover:no-underline cursor-pointer"
                          >
                            {isExpanded ? "Ocultar itens" : "Ver itens"}
                            {isExpanded ? <ChevronUp className="size-4" aria-hidden="true" /> : <ChevronDown className="size-4" aria-hidden="true" />}
                          </button>
                        </div>

                        {isExpanded && (
                          <div className="border-brutal rounded-brutal bg-card p-3.5">
                            {loadingItemsId === invoice.id ? (
                              <ListSkeleton rows={2} />
                            ) : (
                              <>
                                {(items ?? []).length === 0 ? (
                                  <EmptyState title="Nenhum item lançado" description="Adicione os itens da fatura para acompanhar os gastos." />
                                ) : (
                                  <div className="overflow-x-auto brutal-scroll">
                                    <table className="w-full text-sm">
                                      <thead>
                                        <tr className="text-left border-b-[3px] border-b-border">
                                          <th className="py-2 pr-3 font-bold">Descrição</th>
                                          <th className="py-2 pr-3 font-bold">Parcela</th>
                                          <th className="py-2 pr-3 font-bold text-right">Valor</th>
                                          <th className="py-2 pl-3 font-bold text-right">Ações</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {(items ?? []).map((item) => (
                                          <tr key={item.id} className="border-b border-border/40">
                                            <td className="py-2.5 pr-3">{item.description}</td>
                                            <td className="py-2.5 pr-3 text-muted-foreground">
                                              {item.installment_current && item.installment_total
                                                ? `${item.installment_current}/${item.installment_total}`
                                                : "—"}
                                            </td>
                                            <td className="py-2.5 pr-3 text-right font-bold tabular-nums">{centsToBRL(item.amount_cents)}</td>
                                            <td className="py-2.5 pl-3 text-right">
                                              <button
                                                type="button"
                                                aria-label={`Excluir ${item.description}`}
                                                onClick={() => handleDeleteItem(invoice.id, item.id)}
                                                className="size-8 grid place-items-center rounded-brutal border-brutal bg-background-alt press-brutal cursor-pointer"
                                              >
                                                <Trash2 className="size-3.5" aria-hidden="true" />
                                              </button>
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                      <tfoot>
                                        <tr>
                                          <td colSpan={2} className="py-2.5 pr-3 font-bold">
                                            Total
                                          </td>
                                          <td className="py-2.5 pr-3 text-right font-bold tabular-nums">{centsToBRL(itemsTotal)}</td>
                                          <td />
                                        </tr>
                                      </tfoot>
                                    </table>
                                  </div>
                                )}
                                <div className="flex items-center justify-between gap-2 mt-3">
                                  <Button size="sm" variant="outline" onClick={() => setAddItemInvoiceId(invoice.id)}>
                                    <Plus className="size-4" aria-hidden="true" />
                                    Adicionar item
                                  </Button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteInvoice(invoice.id)}
                                    className="text-xs font-semibold text-danger underline underline-offset-2 hover:no-underline cursor-pointer"
                                  >
                                    Excluir esta fatura
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {cardDialogState && (
        <Dialog
          open
          onOpenChange={(open) => !open && setCardDialogState(null)}
          title={cardDialogState.mode === "create" ? "Novo cartão" : "Editar cartão"}
        >
          <CardForm
            defaultValues={
              cardDialogState.mode === "edit" && cardDialogState.card
                ? {
                    name: cardDialogState.card.name,
                    cardType: cardDialogState.card.card_type,
                    closingDay: cardDialogState.card.closing_day,
                    dueDay: cardDialogState.card.due_day,
                    notes: cardDialogState.card.notes,
                  }
                : undefined
            }
            onSubmit={handleCardFormSubmit}
            onCancel={() => setCardDialogState(null)}
            submitLabel={cardDialogState.mode === "create" ? "Criar cartão" : "Salvar alterações"}
          />
        </Dialog>
      )}

      {addItemInvoiceId && (
        <Dialog open onOpenChange={(open) => !open && setAddItemInvoiceId(null)} title="Adicionar item à fatura">
          <InvoiceItemForm onSubmit={handleAddItem} onCancel={() => setAddItemInvoiceId(null)} />
        </Dialog>
      )}

      <ConfirmDialog
        open={!!deleteCardTarget}
        onOpenChange={(open) => !open && setDeleteCardTarget(null)}
        title="Excluir cartão"
        description={`Tem certeza que deseja excluir "${deleteCardTarget?.name}"? Todas as faturas e itens desse cartão serão excluídos permanentemente.`}
        confirmLabel="Excluir"
        loading={deletingCard}
        onConfirm={handleDeleteCard}
      />
    </div>
  );
}
