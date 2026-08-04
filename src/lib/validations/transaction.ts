import { z } from "zod";

export const PAYMENT_METHODS = [
  "dinheiro",
  "pix",
  "cartao_credito",
  "cartao_debito",
  "transferencia",
  "boleto",
  "outro",
] as const;

export const PAYMENT_METHOD_LABELS: Record<(typeof PAYMENT_METHODS)[number], string> = {
  dinheiro: "Dinheiro",
  pix: "Pix",
  cartao_credito: "Cartão de crédito",
  cartao_debito: "Cartão de débito",
  transferencia: "Transferência",
  boleto: "Boleto",
  outro: "Outro",
};

export const transactionSchema = z.object({
  description: z.string().trim().min(1, "Informe uma descrição").max(140, "Descrição muito longa"),
  amountCents: z.number({ message: "Informe um valor" }).int().positive("O valor deve ser maior que zero"),
  type: z.enum(["income", "expense"], { message: "Selecione o tipo" }),
  categoryId: z.string().uuid().nullable().optional(),
  transactionDate: z.string().min(1, "Informe a data"),
  paymentMethod: z.enum(PAYMENT_METHODS).nullable().optional(),
  notes: z.string().trim().max(500, "Observação muito longa").nullable().optional(),
});
export type TransactionFormValues = z.infer<typeof transactionSchema>;
