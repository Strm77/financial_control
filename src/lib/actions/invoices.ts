"use server";

import { revalidatePath } from "next/cache";
import { requireUser, SESSION_EXPIRED_MESSAGE } from "@/lib/supabase/require-user";
import { invoiceSchema, invoiceItemSchema, type InvoiceFormValues, type InvoiceItemFormValues } from "@/lib/validations/invoice";
import type { ActionResult, Invoice, InvoiceItem } from "@/types/entities";
import type { InvoiceStatus } from "@/types/database";
import { INVOICE_ATTACHMENTS_BUCKET as STORAGE_BUCKET } from "@/lib/storage";

export async function createInvoiceAction(values: InvoiceFormValues): Promise<ActionResult<Invoice>> {
  const parsed = invoiceSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, message: "Verifique os campos destacados.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { supabase, user } = await requireUser();
  if (!user) return { success: false, message: SESSION_EXPIRED_MESSAGE };

  const { data, error } = await supabase
    .from("invoices")
    .insert({
      user_id: user.id,
      card_id: parsed.data.cardId,
      reference_month: parsed.data.referenceMonth,
      notes: parsed.data.notes ?? null,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return { success: false, message: "Já existe uma fatura desse cartão neste mês." };
    }
    return { success: false, message: "Não foi possível criar a fatura." };
  }

  revalidatePath("/faturas");
  return { success: true, data };
}

export async function setInvoiceStatusAction(invoiceId: string, status: InvoiceStatus): Promise<ActionResult> {
  const { supabase, user } = await requireUser();
  if (!user) return { success: false, message: SESSION_EXPIRED_MESSAGE };

  const { error } = await supabase
    .from("invoices")
    .update({ status, paid_at: status === "paga" ? new Date().toISOString().slice(0, 10) : null })
    .eq("id", invoiceId)
    .eq("user_id", user.id);

  if (error) return { success: false, message: "Não foi possível atualizar o status da fatura." };

  revalidatePath("/faturas");
  return { success: true };
}

export async function deleteInvoiceAction(invoiceId: string): Promise<ActionResult> {
  const { supabase, user } = await requireUser();
  if (!user) return { success: false, message: SESSION_EXPIRED_MESSAGE };

  const { data: invoice } = await supabase
    .from("invoices")
    .select("attachment_path")
    .eq("id", invoiceId)
    .eq("user_id", user.id)
    .single();

  if (invoice?.attachment_path) {
    await supabase.storage.from(STORAGE_BUCKET).remove([invoice.attachment_path]);
  }

  const { error } = await supabase.from("invoices").delete().eq("id", invoiceId).eq("user_id", user.id);
  if (error) return { success: false, message: "Não foi possível excluir a fatura." };

  revalidatePath("/faturas");
  return { success: true };
}

export async function recordInvoiceAttachmentAction(invoiceId: string, path: string): Promise<ActionResult> {
  const { supabase, user } = await requireUser();
  if (!user) return { success: false, message: SESSION_EXPIRED_MESSAGE };

  const { data: invoice } = await supabase
    .from("invoices")
    .select("attachment_path")
    .eq("id", invoiceId)
    .eq("user_id", user.id)
    .single();

  if (invoice?.attachment_path && invoice.attachment_path !== path) {
    await supabase.storage.from(STORAGE_BUCKET).remove([invoice.attachment_path]);
  }

  const { error } = await supabase
    .from("invoices")
    .update({ attachment_path: path })
    .eq("id", invoiceId)
    .eq("user_id", user.id);

  if (error) return { success: false, message: "Não foi possível salvar o anexo." };

  revalidatePath("/faturas");
  return { success: true };
}

export async function removeInvoiceAttachmentAction(invoiceId: string): Promise<ActionResult> {
  const { supabase, user } = await requireUser();
  if (!user) return { success: false, message: SESSION_EXPIRED_MESSAGE };

  const { data: invoice } = await supabase
    .from("invoices")
    .select("attachment_path")
    .eq("id", invoiceId)
    .eq("user_id", user.id)
    .single();

  if (invoice?.attachment_path) {
    await supabase.storage.from(STORAGE_BUCKET).remove([invoice.attachment_path]);
  }

  const { error } = await supabase.from("invoices").update({ attachment_path: null }).eq("id", invoiceId).eq("user_id", user.id);
  if (error) return { success: false, message: "Não foi possível remover o anexo." };

  revalidatePath("/faturas");
  return { success: true };
}

export async function getInvoiceFileUrlAction(invoiceId: string): Promise<ActionResult<string>> {
  const { supabase, user } = await requireUser();
  if (!user) return { success: false, message: SESSION_EXPIRED_MESSAGE };

  const { data: invoice } = await supabase
    .from("invoices")
    .select("attachment_path")
    .eq("id", invoiceId)
    .eq("user_id", user.id)
    .single();

  if (!invoice?.attachment_path) {
    return { success: false, message: "Nenhum anexo encontrado." };
  }

  const { data, error } = await supabase.storage.from(STORAGE_BUCKET).createSignedUrl(invoice.attachment_path, 300);
  if (error || !data) return { success: false, message: "Não foi possível gerar o link do anexo." };

  return { success: true, data: data.signedUrl };
}

export async function listInvoiceItemsAction(invoiceId: string): Promise<ActionResult<InvoiceItem[]>> {
  const { supabase, user } = await requireUser();
  if (!user) return { success: false, message: SESSION_EXPIRED_MESSAGE };

  const { data, error } = await supabase
    .from("invoice_items")
    .select("*")
    .eq("invoice_id", invoiceId)
    .order("created_at", { ascending: true });

  if (error) return { success: false, message: "Não foi possível carregar os itens da fatura." };
  return { success: true, data: data ?? [] };
}

export async function addInvoiceItemAction(invoiceId: string, values: InvoiceItemFormValues): Promise<ActionResult<InvoiceItem>> {
  const parsed = invoiceItemSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, message: "Verifique os campos destacados.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { supabase, user } = await requireUser();
  if (!user) return { success: false, message: SESSION_EXPIRED_MESSAGE };

  const { data, error } = await supabase
    .from("invoice_items")
    .insert({
      user_id: user.id,
      invoice_id: invoiceId,
      description: parsed.data.description,
      amount_cents: parsed.data.amountCents,
      installment_current: parsed.data.installmentCurrent ?? null,
      installment_total: parsed.data.installmentTotal ?? null,
    })
    .select()
    .single();

  if (error) return { success: false, message: "Não foi possível adicionar o item." };

  revalidatePath("/faturas");
  return { success: true, data };
}

export async function deleteInvoiceItemAction(itemId: string): Promise<ActionResult> {
  const { supabase, user } = await requireUser();
  if (!user) return { success: false, message: SESSION_EXPIRED_MESSAGE };

  const { error } = await supabase.from("invoice_items").delete().eq("id", itemId).eq("user_id", user.id);
  if (error) return { success: false, message: "Não foi possível excluir o item." };

  revalidatePath("/faturas");
  return { success: true };
}
