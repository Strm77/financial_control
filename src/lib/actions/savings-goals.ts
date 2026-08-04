"use server";

import { revalidatePath } from "next/cache";
import { requireUser, SESSION_EXPIRED_MESSAGE } from "@/lib/supabase/require-user";
import {
  savingsGoalSchema,
  savingsMovementSchema,
  type SavingsGoalFormValues,
  type SavingsMovementFormValues,
} from "@/lib/validations/savings-goal";
import type { ActionResult, SavingsGoal, SavingsContribution } from "@/types/entities";
import type { SavingsGoalStatus } from "@/types/database";

export async function createSavingsGoalAction(values: SavingsGoalFormValues): Promise<ActionResult<SavingsGoal>> {
  const parsed = savingsGoalSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, message: "Verifique os campos destacados.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { supabase, user } = await requireUser();
  if (!user) return { success: false, message: SESSION_EXPIRED_MESSAGE };

  const { data, error } = await supabase
    .from("savings_goals")
    .insert({
      user_id: user.id,
      name: parsed.data.name,
      target_amount_cents: parsed.data.targetAmountCents,
      target_date: parsed.data.targetDate ?? null,
      notes: parsed.data.notes ?? null,
    })
    .select()
    .single();

  if (error) return { success: false, message: "Não foi possível criar a meta." };

  revalidatePath("/metas");
  revalidatePath("/dashboard");
  return { success: true, data };
}

export async function updateSavingsGoalAction(id: string, values: SavingsGoalFormValues): Promise<ActionResult<SavingsGoal>> {
  const parsed = savingsGoalSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, message: "Verifique os campos destacados.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { supabase, user } = await requireUser();
  if (!user) return { success: false, message: SESSION_EXPIRED_MESSAGE };

  const { data, error } = await supabase
    .from("savings_goals")
    .update({
      name: parsed.data.name,
      target_amount_cents: parsed.data.targetAmountCents,
      target_date: parsed.data.targetDate ?? null,
      notes: parsed.data.notes ?? null,
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) return { success: false, message: "Não foi possível atualizar a meta." };

  revalidatePath("/metas");
  revalidatePath("/dashboard");
  return { success: true, data };
}

export async function deleteSavingsGoalAction(id: string): Promise<ActionResult> {
  const { supabase, user } = await requireUser();
  if (!user) return { success: false, message: SESSION_EXPIRED_MESSAGE };

  const { error } = await supabase.from("savings_goals").delete().eq("id", id).eq("user_id", user.id);
  if (error) return { success: false, message: "Não foi possível excluir a meta." };

  revalidatePath("/metas");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function setSavingsGoalStatusAction(id: string, status: SavingsGoalStatus): Promise<ActionResult> {
  const { supabase, user } = await requireUser();
  if (!user) return { success: false, message: SESSION_EXPIRED_MESSAGE };

  const { error } = await supabase.from("savings_goals").update({ status }).eq("id", id).eq("user_id", user.id);
  if (error) return { success: false, message: "Não foi possível atualizar o status da meta." };

  revalidatePath("/metas");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function registerSavingsMovementAction(
  goalId: string,
  values: SavingsMovementFormValues
): Promise<ActionResult<SavingsGoal>> {
  const parsed = savingsMovementSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, message: "Verifique os campos destacados.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { supabase, user } = await requireUser();
  if (!user) return { success: false, message: SESSION_EXPIRED_MESSAGE };

  const signedAmount = parsed.data.kind === "withdrawal" ? -Math.abs(parsed.data.amountCents) : Math.abs(parsed.data.amountCents);

  const { data, error } = await supabase.rpc("register_savings_movement", {
    p_goal_id: goalId,
    p_amount_cents: signedAmount,
    p_contribution_date: parsed.data.contributionDate,
    p_notes: parsed.data.notes ?? null,
  });

  if (error) {
    const message = error.message.toLowerCase().includes("saldo insuficiente")
      ? "Saldo insuficiente para essa retirada."
      : "Não foi possível registrar a movimentação.";
    return { success: false, message };
  }

  revalidatePath("/metas");
  revalidatePath("/dashboard");
  return { success: true, data: data ?? undefined };
}

export async function listSavingsContributionsAction(goalId: string): Promise<ActionResult<SavingsContribution[]>> {
  const { supabase, user } = await requireUser();
  if (!user) return { success: false, message: SESSION_EXPIRED_MESSAGE };

  const { data, error } = await supabase
    .from("savings_contributions")
    .select("*")
    .eq("savings_goal_id", goalId)
    .order("contribution_date", { ascending: false });

  if (error) return { success: false, message: "Não foi possível carregar o histórico." };
  return { success: true, data: data ?? [] };
}
