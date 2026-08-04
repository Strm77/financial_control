"use server";

import { revalidatePath } from "next/cache";
import { requireUser, SESSION_EXPIRED_MESSAGE } from "@/lib/supabase/require-user";
import { profileSchema, type ProfileFormValues } from "@/lib/validations/profile";
import type { ActionResult, Profile } from "@/types/entities";

export async function updateDisplayNameAction(values: ProfileFormValues): Promise<ActionResult<Profile>> {
  const parsed = profileSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, message: "Verifique os campos destacados.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { supabase, user } = await requireUser();
  if (!user) return { success: false, message: SESSION_EXPIRED_MESSAGE };

  const { data, error } = await supabase
    .from("profiles")
    .update({ display_name: parsed.data.displayName })
    .eq("id", user.id)
    .select()
    .single();

  if (error) return { success: false, message: "Não foi possível atualizar seu nome." };

  revalidatePath("/configuracoes");
  return { success: true, data };
}
