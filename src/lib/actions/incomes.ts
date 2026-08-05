"use server";

import { revalidatePath } from "next/cache";
import { requireUser, SESSION_EXPIRED_MESSAGE } from "@/lib/supabase/require-user";
import { incomeSchema, type IncomeFormValues } from "@/lib/validations/income";
import type { ActionResult, Income } from "@/types/entities";

export async function createIncomeAction(values: IncomeFormValues): Promise<ActionResult<Income>> {
  const parsed = incomeSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, message: "Verifique os campos destacados.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { supabase, user } = await requireUser();
  if (!user) return { success: false, message: SESSION_EXPIRED_MESSAGE };

  const { data, error } = await supabase
    .from("incomes")
    .insert({
      user_id: user.id,
      description: parsed.data.description,
      type: parsed.data.type,
      amount_cents: parsed.data.amountCents,
      reference_month: parsed.data.referenceMonth,
      notes: parsed.data.notes ?? null,
    })
    .select()
    .single();

  if (error) return { success: false, message: "Não foi possível registrar a renda." };

  revalidatePath("/renda");
  revalidatePath("/dashboard");
  return { success: true, data };
}

export async function updateIncomeAction(id: string, values: IncomeFormValues): Promise<ActionResult<Income>> {
  const parsed = incomeSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, message: "Verifique os campos destacados.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { supabase, user } = await requireUser();
  if (!user) return { success: false, message: SESSION_EXPIRED_MESSAGE };

  const { data, error } = await supabase
    .from("incomes")
    .update({
      description: parsed.data.description,
      type: parsed.data.type,
      amount_cents: parsed.data.amountCents,
      reference_month: parsed.data.referenceMonth,
      notes: parsed.data.notes ?? null,
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) return { success: false, message: "Não foi possível atualizar a renda." };

  revalidatePath("/renda");
  revalidatePath("/dashboard");
  return { success: true, data };
}

export async function deleteIncomeAction(id: string): Promise<ActionResult> {
  const { supabase, user } = await requireUser();
  if (!user) return { success: false, message: SESSION_EXPIRED_MESSAGE };

  const { error } = await supabase.from("incomes").delete().eq("id", id).eq("user_id", user.id);
  if (error) return { success: false, message: "Não foi possível excluir a renda." };

  revalidatePath("/renda");
  revalidatePath("/dashboard");
  return { success: true };
}
