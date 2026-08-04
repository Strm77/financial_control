"use server";

import { revalidatePath } from "next/cache";
import { requireUser, SESSION_EXPIRED_MESSAGE } from "@/lib/supabase/require-user";
import { debtSchema, debtPaymentSchema, type DebtFormValues, type DebtPaymentFormValues } from "@/lib/validations/debt";
import type { ActionResult, Debt, DebtPayment } from "@/types/entities";

export async function createDebtAction(values: DebtFormValues): Promise<ActionResult<Debt>> {
  const parsed = debtSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, message: "Verifique os campos destacados.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { supabase, user } = await requireUser();
  if (!user) return { success: false, message: SESSION_EXPIRED_MESSAGE };

  const { data, error } = await supabase
    .from("debts")
    .insert({
      user_id: user.id,
      name: parsed.data.name,
      creditor: parsed.data.creditor ?? null,
      original_amount_cents: parsed.data.originalAmountCents,
      current_balance_cents: parsed.data.originalAmountCents,
      interest_rate: parsed.data.interestRate ?? null,
      minimum_payment_cents: parsed.data.minimumPaymentCents ?? null,
      due_day: parsed.data.dueDay ?? null,
      notes: parsed.data.notes ?? null,
    })
    .select()
    .single();

  if (error) return { success: false, message: "Não foi possível criar a dívida." };

  revalidatePath("/dividas");
  revalidatePath("/dashboard");
  return { success: true, data };
}

export async function updateDebtAction(id: string, values: DebtFormValues): Promise<ActionResult<Debt>> {
  const parsed = debtSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, message: "Verifique os campos destacados.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { supabase, user } = await requireUser();
  if (!user) return { success: false, message: SESSION_EXPIRED_MESSAGE };

  const { data, error } = await supabase
    .from("debts")
    .update({
      name: parsed.data.name,
      creditor: parsed.data.creditor ?? null,
      interest_rate: parsed.data.interestRate ?? null,
      minimum_payment_cents: parsed.data.minimumPaymentCents ?? null,
      due_day: parsed.data.dueDay ?? null,
      notes: parsed.data.notes ?? null,
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) return { success: false, message: "Não foi possível atualizar a dívida." };

  revalidatePath("/dividas");
  revalidatePath("/dashboard");
  return { success: true, data };
}

export async function deleteDebtAction(id: string): Promise<ActionResult> {
  const { supabase, user } = await requireUser();
  if (!user) return { success: false, message: SESSION_EXPIRED_MESSAGE };

  const { error } = await supabase.from("debts").delete().eq("id", id).eq("user_id", user.id);
  if (error) return { success: false, message: "Não foi possível excluir a dívida." };

  revalidatePath("/dividas");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function registerDebtPaymentAction(debtId: string, values: DebtPaymentFormValues): Promise<ActionResult<Debt>> {
  const parsed = debtPaymentSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, message: "Verifique os campos destacados.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { supabase, user } = await requireUser();
  if (!user) return { success: false, message: SESSION_EXPIRED_MESSAGE };

  const { data, error } = await supabase.rpc("register_debt_payment", {
    p_debt_id: debtId,
    p_amount_cents: parsed.data.amountCents,
    p_payment_date: parsed.data.paymentDate,
    p_notes: parsed.data.notes ?? null,
  });

  if (error) {
    const message = error.message.includes("maior que o saldo")
      ? "O valor do pagamento é maior que o saldo devedor atual."
      : "Não foi possível registrar o pagamento.";
    return { success: false, message };
  }

  revalidatePath("/dividas");
  revalidatePath("/dashboard");
  return { success: true, data: data ?? undefined };
}

export async function listDebtPaymentsAction(debtId: string): Promise<ActionResult<DebtPayment[]>> {
  const { supabase, user } = await requireUser();
  if (!user) return { success: false, message: SESSION_EXPIRED_MESSAGE };

  const { data, error } = await supabase
    .from("debt_payments")
    .select("*")
    .eq("debt_id", debtId)
    .order("payment_date", { ascending: false });

  if (error) return { success: false, message: "Não foi possível carregar o histórico." };
  return { success: true, data: data ?? [] };
}
