"use server";

import { revalidatePath } from "next/cache";
import { requireUser, SESSION_EXPIRED_MESSAGE } from "@/lib/supabase/require-user";
import { transactionSchema, type TransactionFormValues } from "@/lib/validations/transaction";
import type { ActionResult, Transaction } from "@/types/entities";

function friendlyDbError(message: string): string {
  if (message.toLowerCase().includes("tipo da categoria")) {
    return "A categoria selecionada não é compatível com o tipo da transação.";
  }
  if (message.toLowerCase().includes("categoria inválida")) {
    return "Categoria inválida.";
  }
  return "Não foi possível salvar a transação.";
}

export async function createTransactionAction(values: TransactionFormValues): Promise<ActionResult<Transaction>> {
  const parsed = transactionSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, message: "Verifique os campos destacados.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { supabase, user } = await requireUser();
  if (!user) return { success: false, message: SESSION_EXPIRED_MESSAGE };

  const { data, error } = await supabase
    .from("transactions")
    .insert({
      user_id: user.id,
      category_id: parsed.data.categoryId ?? null,
      description: parsed.data.description,
      amount_cents: parsed.data.amountCents,
      type: parsed.data.type,
      transaction_date: parsed.data.transactionDate,
      payment_method: parsed.data.paymentMethod ?? null,
      notes: parsed.data.notes ?? null,
    })
    .select()
    .single();

  if (error) return { success: false, message: friendlyDbError(error.message) };

  revalidatePath("/transacoes");
  revalidatePath("/dashboard");
  return { success: true, data };
}

export async function updateTransactionAction(
  id: string,
  values: TransactionFormValues
): Promise<ActionResult<Transaction>> {
  const parsed = transactionSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, message: "Verifique os campos destacados.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { supabase, user } = await requireUser();
  if (!user) return { success: false, message: SESSION_EXPIRED_MESSAGE };

  const { data, error } = await supabase
    .from("transactions")
    .update({
      category_id: parsed.data.categoryId ?? null,
      description: parsed.data.description,
      amount_cents: parsed.data.amountCents,
      type: parsed.data.type,
      transaction_date: parsed.data.transactionDate,
      payment_method: parsed.data.paymentMethod ?? null,
      notes: parsed.data.notes ?? null,
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) return { success: false, message: friendlyDbError(error.message) };

  revalidatePath("/transacoes");
  revalidatePath("/dashboard");
  return { success: true, data };
}

export async function deleteTransactionAction(id: string): Promise<ActionResult> {
  const { supabase, user } = await requireUser();
  if (!user) return { success: false, message: SESSION_EXPIRED_MESSAGE };

  const { error } = await supabase.from("transactions").delete().eq("id", id).eq("user_id", user.id);
  if (error) return { success: false, message: "Não foi possível excluir a transação." };

  revalidatePath("/transacoes");
  revalidatePath("/dashboard");
  return { success: true };
}
