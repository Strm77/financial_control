"use server";

import { revalidatePath } from "next/cache";
import { requireUser, SESSION_EXPIRED_MESSAGE } from "@/lib/supabase/require-user";
import { cardSchema, type CardFormValues } from "@/lib/validations/card";
import type { ActionResult, Card } from "@/types/entities";

export async function createCardAction(values: CardFormValues): Promise<ActionResult<Card>> {
  const parsed = cardSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, message: "Verifique os campos destacados.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { supabase, user } = await requireUser();
  if (!user) return { success: false, message: SESSION_EXPIRED_MESSAGE };

  const { data, error } = await supabase
    .from("cards")
    .insert({
      user_id: user.id,
      name: parsed.data.name,
      card_type: parsed.data.cardType,
      closing_day: parsed.data.closingDay ?? null,
      due_day: parsed.data.dueDay ?? null,
      notes: parsed.data.notes ?? null,
    })
    .select()
    .single();

  if (error) return { success: false, message: "Não foi possível criar o cartão." };

  revalidatePath("/faturas");
  revalidatePath("/pagamentos");
  return { success: true, data };
}

export async function updateCardAction(id: string, values: CardFormValues): Promise<ActionResult<Card>> {
  const parsed = cardSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, message: "Verifique os campos destacados.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { supabase, user } = await requireUser();
  if (!user) return { success: false, message: SESSION_EXPIRED_MESSAGE };

  const { data, error } = await supabase
    .from("cards")
    .update({
      name: parsed.data.name,
      card_type: parsed.data.cardType,
      closing_day: parsed.data.closingDay ?? null,
      due_day: parsed.data.dueDay ?? null,
      notes: parsed.data.notes ?? null,
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) return { success: false, message: "Não foi possível atualizar o cartão." };

  revalidatePath("/faturas");
  revalidatePath("/pagamentos");
  return { success: true, data };
}

export async function deleteCardAction(id: string): Promise<ActionResult> {
  const { supabase, user } = await requireUser();
  if (!user) return { success: false, message: SESSION_EXPIRED_MESSAGE };

  // Desvincula cobranças recorrentes que apontam para este cartão (a FK composta bloqueia
  // a exclusão enquanto houver referência). As faturas do cartão são excluídas em cascata.
  await supabase.from("recurring_payments").update({ card_id: null }).eq("card_id", id).eq("user_id", user.id);

  const { error } = await supabase.from("cards").delete().eq("id", id).eq("user_id", user.id);
  if (error) return { success: false, message: "Não foi possível excluir o cartão." };

  revalidatePath("/faturas");
  revalidatePath("/pagamentos");
  return { success: true };
}
