"use server";

import { revalidatePath } from "next/cache";
import { requireUser, SESSION_EXPIRED_MESSAGE } from "@/lib/supabase/require-user";
import { categorySchema, type CategoryFormValues } from "@/lib/validations/category";
import type { ActionResult, Category } from "@/types/entities";

export async function createCategoryAction(values: CategoryFormValues): Promise<ActionResult<Category>> {
  const parsed = categorySchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, message: "Verifique os campos destacados.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { supabase, user } = await requireUser();
  if (!user) return { success: false, message: SESSION_EXPIRED_MESSAGE };

  const { data, error } = await supabase
    .from("categories")
    .insert({
      user_id: user.id,
      name: parsed.data.name,
      type: parsed.data.type,
      icon: parsed.data.icon ?? null,
      color: parsed.data.color ?? null,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return {
        success: false,
        message: "Já existe uma categoria com esse nome e tipo.",
        fieldErrors: { name: ["Já existe uma categoria com esse nome e tipo"] },
      };
    }
    return { success: false, message: "Não foi possível criar a categoria." };
  }

  revalidatePath("/categorias");
  return { success: true, data };
}

export async function updateCategoryAction(id: string, values: CategoryFormValues): Promise<ActionResult<Category>> {
  const parsed = categorySchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, message: "Verifique os campos destacados.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { supabase, user } = await requireUser();
  if (!user) return { success: false, message: SESSION_EXPIRED_MESSAGE };

  const { data, error } = await supabase
    .from("categories")
    .update({
      name: parsed.data.name,
      type: parsed.data.type,
      icon: parsed.data.icon ?? null,
      color: parsed.data.color ?? null,
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return {
        success: false,
        message: "Já existe uma categoria com esse nome e tipo.",
        fieldErrors: { name: ["Já existe uma categoria com esse nome e tipo"] },
      };
    }
    return { success: false, message: "Não foi possível atualizar a categoria." };
  }

  revalidatePath("/categorias");
  return { success: true, data };
}

export async function deleteCategoryAction(id: string): Promise<ActionResult> {
  const { supabase, user } = await requireUser();
  if (!user) return { success: false, message: SESSION_EXPIRED_MESSAGE };

  // Desvincula transações e cobranças recorrentes antes de excluir (a FK composta
  // categories(id,user_id) bloqueia a exclusão enquanto houver referências).
  await supabase.from("transactions").update({ category_id: null }).eq("category_id", id).eq("user_id", user.id);
  await supabase
    .from("recurring_payments")
    .update({ category_id: null })
    .eq("category_id", id)
    .eq("user_id", user.id);

  const { error } = await supabase.from("categories").delete().eq("id", id).eq("user_id", user.id);
  if (error) {
    return { success: false, message: "Não foi possível excluir a categoria." };
  }

  revalidatePath("/categorias");
  revalidatePath("/transacoes");
  revalidatePath("/pagamentos");
  return { success: true };
}

export async function seedDefaultCategoriesAction(): Promise<ActionResult> {
  const { supabase, user } = await requireUser();
  if (!user) return { success: false, message: SESSION_EXPIRED_MESSAGE };

  const { error } = await supabase.rpc("seed_default_categories");
  if (error) {
    return { success: false, message: "Não foi possível criar as categorias padrão." };
  }

  revalidatePath("/categorias");
  return { success: true };
}
