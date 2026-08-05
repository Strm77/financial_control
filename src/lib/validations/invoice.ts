import { z } from "zod";

export const invoiceItemSchema = z.object({
  description: z.string().trim().min(1, "Informe uma descrição").max(140, "Descrição muito longa"),
  amountCents: z.number({ message: "Informe um valor" }).int().positive("O valor deve ser maior que zero"),
  installmentCurrent: z.number().int().positive("Deve ser maior que zero").nullable().optional(),
  installmentTotal: z.number().int().positive("Deve ser maior que zero").nullable().optional(),
});
export type InvoiceItemFormValues = z.infer<typeof invoiceItemSchema>;

export const invoiceSchema = z.object({
  cardId: z.string().uuid("Selecione um cartão"),
  referenceMonth: z.string().min(1, "Informe o mês"),
  notes: z.string().trim().max(500, "Observação muito longa").nullable().optional(),
});
export type InvoiceFormValues = z.infer<typeof invoiceSchema>;
