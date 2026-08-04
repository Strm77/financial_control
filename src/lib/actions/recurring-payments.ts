"use server";

import { revalidatePath } from "next/cache";
import { requireUser, SESSION_EXPIRED_MESSAGE } from "@/lib/supabase/require-user";
import {
  recurringPaymentSchema,
  markPaymentPaidSchema,
  type RecurringPaymentFormValues,
  type MarkPaymentPaidFormValues,
} from "@/lib/validations/recurring-payment";
import type { ActionResult, RecurringPayment } from "@/types/entities";
import type { RecurringPaymentStatus } from "@/types/database";

function friendlyDbError(message: string): string {
  if (message.toLowerCase().includes("despesa")) {
    return "A categoria de uma cobrança recorrente deve ser do tipo despesa.";
  }
  return "Não foi possível salvar a cobrança recorrente.";
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

  const { data, error } = await supabase
    .from("recurring_payments")
    .insert({
      user_id: user.id,
      category_id: parsed.data.categoryId ?? null,
      description: parsed.data.description,
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

  const { data, error } = await supabase
    .from("recurring_payments")
    .update({
      category_id: parsed.data.categoryId ?? null,
      description: parsed.data.description,
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
  return { success: true, data };
}

export async function deleteRecurringPaymentAction(id: string): Promise<ActionResult> {
  const { supabase, user } = await requireUser();
  if (!user) return { success: false, message: SESSION_EXPIRED_MESSAGE };

  const { error } = await supabase.from("recurring_payments").delete().eq("id", id).eq("user_id", user.id);
  if (error) return { success: false, message: "Não foi possível excluir a cobrança." };

  revalidatePath("/pagamentos");
  revalidatePath("/dashboard");
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

  const { error } = await supabase.from("payment_records").upsert(
    {
      user_id: user.id,
      recurring_payment_id: recurringPaymentId,
      reference_month: referenceMonth,
      paid_at: parsed.data.paidAt,
      amount_paid_cents: parsed.data.amountPaidCents,
      status: "paid",
    },
    { onConflict: "recurring_payment_id,reference_month" }
  );

  if (error) return { success: false, message: "Não foi possível registrar o pagamento." };

  revalidatePath("/pagamentos");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function undoPaymentAction(recurringPaymentId: string, referenceMonth: string): Promise<ActionResult> {
  const { supabase, user } = await requireUser();
  if (!user) return { success: false, message: SESSION_EXPIRED_MESSAGE };

  const { error } = await supabase
    .from("payment_records")
    .delete()
    .eq("recurring_payment_id", recurringPaymentId)
    .eq("reference_month", referenceMonth)
    .eq("user_id", user.id);

  if (error) return { success: false, message: "Não foi possível desfazer o pagamento." };

  revalidatePath("/pagamentos");
  revalidatePath("/dashboard");
  return { success: true };
}
