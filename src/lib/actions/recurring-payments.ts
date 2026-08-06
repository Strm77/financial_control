"use server";

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireUser, SESSION_EXPIRED_MESSAGE } from "@/lib/supabase/require-user";
import {
  recurringPaymentSchema,
  markPaymentPaidSchema,
  type RecurringPaymentFormValues,
  type MarkPaymentPaidFormValues,
} from "@/lib/validations/recurring-payment";
import { inferPaymentStatus } from "@/lib/finance/payment-progress";
import type { ActionResult, RecurringPayment } from "@/types/entities";
import type { Database, RecurringPaymentStatus } from "@/types/database";
import type { CardType } from "@/types/database";

function friendlyDbError(message: string): string {
  if (message.toLowerCase().includes("despesa")) {
    return "A categoria de uma cobrança recorrente deve ser do tipo despesa.";
  }
  return "Não foi possível salvar a cobrança recorrente.";
}

const CARD_CATEGORY_TYPE: Record<string, CardType> = {
  "Cartão de Crédito": "credito",
  "Cartão de Loja": "loja",
};

/**
 * Quando a categoria selecionada é "Cartão de Crédito" ou "Cartão de Loja", garante que
 * exista um Cartão (menu Faturas) com o mesmo nome da descrição do pagamento e retorna o
 * id dele — criando o cartão automaticamente se ainda não existir. Fora desse caso, respeita
 * o vínculo manual de cartão escolhido no formulário (se houver).
 */
async function resolveCardId(
  supabase: SupabaseClient<Database>,
  userId: string,
  categoryId: string | null | undefined,
  description: string,
  manualCardId: string | null | undefined
): Promise<string | null> {
  if (!categoryId) return manualCardId ?? null;

  const { data: category } = await supabase.from("categories").select("name").eq("id", categoryId).eq("user_id", userId).single();

  const cardType = category ? CARD_CATEGORY_TYPE[category.name] : undefined;
  if (!cardType) return manualCardId ?? null;

  const { data: existingCard } = await supabase
    .from("cards")
    .select("id")
    .eq("user_id", userId)
    .eq("name", description)
    .maybeSingle();

  if (existingCard) return existingCard.id;

  const { data: newCard } = await supabase
    .from("cards")
    .insert({ user_id: userId, name: description, card_type: cardType })
    .select("id")
    .single();

  return newCard?.id ?? manualCardId ?? null;
}

export async function createRecurringPaymentAction(
  values: RecurringPaymentFormValues
): Promise<ActionResult<RecurringPayment>> {
  const parsed = recurringPaymentSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, message: "Verifique os campos destacados.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { supabase, user } = await requireUser();
  if (!user) return { success: false, message: SESSION_EXPIRED_MESSAGE };

  const cardId = await resolveCardId(supabase, user.id, parsed.data.categoryId, parsed.data.description, parsed.data.cardId);

  const { data, error } = await supabase
    .from("recurring_payments")
    .insert({
      user_id: user.id,
      category_id: parsed.data.categoryId ?? null,
      card_id: cardId,
      debt_id: parsed.data.debtId ?? null,
      description: parsed.data.description,
      payment_type: parsed.data.paymentType,
      amount_cents: parsed.data.amountCents,
      due_day: parsed.data.dueDay,
      start_date: parsed.data.startDate,
      end_date: parsed.data.endDate ?? null,
      notes: parsed.data.notes ?? null,
    })
    .select()
    .single();

  if (error) return { success: false, message: friendlyDbError(error.message) };

  revalidatePath("/pagamentos");
  revalidatePath("/dashboard");
  revalidatePath("/faturas");
  return { success: true, data };
}

export async function updateRecurringPaymentAction(
  id: string,
  values: RecurringPaymentFormValues
): Promise<ActionResult<RecurringPayment>> {
  const parsed = recurringPaymentSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, message: "Verifique os campos destacados.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { supabase, user } = await requireUser();
  if (!user) return { success: false, message: SESSION_EXPIRED_MESSAGE };

  const cardId = await resolveCardId(supabase, user.id, parsed.data.categoryId, parsed.data.description, parsed.data.cardId);

  const { data, error } = await supabase
    .from("recurring_payments")
    .update({
      category_id: parsed.data.categoryId ?? null,
      card_id: cardId,
      debt_id: parsed.data.debtId ?? null,
      description: parsed.data.description,
      payment_type: parsed.data.paymentType,
      amount_cents: parsed.data.amountCents,
      due_day: parsed.data.dueDay,
      start_date: parsed.data.startDate,
      end_date: parsed.data.endDate ?? null,
      notes: parsed.data.notes ?? null,
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) return { success: false, message: friendlyDbError(error.message) };

  revalidatePath("/pagamentos");
  revalidatePath("/dashboard");
  revalidatePath("/faturas");
  return { success: true, data };
}

export async function deleteRecurringPaymentAction(id: string): Promise<ActionResult> {
  const { supabase, user } = await requireUser();
  if (!user) return { success: false, message: SESSION_EXPIRED_MESSAGE };

  const { error } = await supabase.rpc("delete_recurring_payment", { p_id: id });
  if (error) return { success: false, message: "Não foi possível excluir a cobrança." };

  revalidatePath("/pagamentos");
  revalidatePath("/dashboard");
  revalidatePath("/dividas");
  return { success: true };
}

export async function setRecurringPaymentStatusAction(
  id: string,
  status: RecurringPaymentStatus
): Promise<ActionResult> {
  const { supabase, user } = await requireUser();
  if (!user) return { success: false, message: SESSION_EXPIRED_MESSAGE };

  const { error } = await supabase
    .from("recurring_payments")
    .update({ status })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { success: false, message: "Não foi possível atualizar o status da cobrança." };

  revalidatePath("/pagamentos");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function markPaymentPaidAction(
  recurringPaymentId: string,
  referenceMonth: string,
  values: MarkPaymentPaidFormValues
): Promise<ActionResult> {
  const parsed = markPaymentPaidSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, message: "Verifique os campos destacados.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { supabase, user } = await requireUser();
  if (!user) return { success: false, message: SESSION_EXPIRED_MESSAGE };

  const { data: recurringPayment, error: fetchError } = await supabase
    .from("recurring_payments")
    .select("amount_cents")
    .eq("id", recurringPaymentId)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !recurringPayment) {
    return { success: false, message: "Cobrança não encontrada." };
  }

  const status = inferPaymentStatus(recurringPayment.amount_cents, parsed.data.amountPaidCents, parsed.data.hasDiscount ?? false);

  const { error } = await supabase.rpc("mark_recurring_payment_paid", {
    p_recurring_payment_id: recurringPaymentId,
    p_reference_month: referenceMonth,
    p_paid_at: parsed.data.paidAt,
    p_amount_paid_cents: parsed.data.amountPaidCents,
    p_status: status,
  });

  if (error) {
    const message = error.message.includes("maior que o saldo devedor")
      ? "O valor pago é maior que o saldo devedor da dívida vinculada."
      : "Não foi possível registrar o pagamento.";
    return { success: false, message };
  }

  revalidatePath("/pagamentos");
  revalidatePath("/dashboard");
  revalidatePath("/dividas");
  return { success: true };
}

export async function undoPaymentAction(recurringPaymentId: string, referenceMonth: string): Promise<ActionResult> {
  const { supabase, user } = await requireUser();
  if (!user) return { success: false, message: SESSION_EXPIRED_MESSAGE };

  const { error } = await supabase.rpc("undo_recurring_payment", {
    p_recurring_payment_id: recurringPaymentId,
    p_reference_month: referenceMonth,
  });

  if (error) return { success: false, message: "Não foi possível desfazer o pagamento." };

  revalidatePath("/pagamentos");
  revalidatePath("/dashboard");
  revalidatePath("/dividas");
  return { success: true };
}
