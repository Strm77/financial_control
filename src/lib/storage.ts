/** Bucket do Supabase Storage usado para anexos de fatura (privado, por usuário). */
export const INVOICE_ATTACHMENTS_BUCKET = "faturas";

/** Monta o caminho de armazenamento de um anexo, isolado por usuário e fatura. */
export function buildInvoiceAttachmentPath(userId: string, invoiceId: string, fileName: string): string {
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `${userId}/${invoiceId}/${Date.now()}-${safeName}`;
}
