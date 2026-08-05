import { z } from "zod";

export const debtSchema = z
  .object({
    name: z.string().trim().min(1, "Informe um nome").max(140, "Nome muito longo"),
    creditor: z.string().trim().max(140, "Nome muito longo").nullable().optional(),
    originalAmountCents: z
      .number({ message: "Informe o valor original" })
      .int()
      .positive("O valor deve ser maior que zero"),
    currentBalanceCents: z.number().int().min(0, "O saldo não pode ser negativo").nullable().optional(),
    interestRate: z.number().min(0, "A taxa não pode ser negativa").nullable().optional(),
    minimumPaymentCents: z.number().int().positive("O valor deve ser maior que zero").nullable().optional(),
    installmentAmountCents: z.number().int().positive("O valor deve ser maior que zero").nullable().optional(),
    totalInstallments: z.number().int().positive("Informe um número de parcelas válido").nullable().optional(),
    initialInstallmentsPaid: z.number().int().min(0, "Não pode ser negativo").nullable().optional(),
    dueDay: z.number().int().min(1, "O dia deve ser entre 1 e 31").max(31, "O dia deve ser entre 1 e 31").nullable().optional(),
    notes: z.string().trim().max(500, "Observação muito longa").nullable().optional(),
  })
  .refine((data) => data.currentBalanceCents == null || data.currentBalanceCents <= data.originalAmountCents, {
    message: "O saldo devedor atual não pode ser maior que o valor original",
    path: ["currentBalanceCents"],
  })
  .refine(
    (data) =>
      data.initialInstallmentsPaid == null || data.totalInstallments == null || data.initialInstallmentsPaid <= data.totalInstallments,
    {
      message: "Não pode ser maior que o número total de parcelas",
      path: ["initialInstallmentsPaid"],
    }
  );
export type DebtFormValues = z.infer<typeof debtSchema>;

export const debtPaymentSchema = z.object({
  amountCents: z.number({ message: "Informe o valor pago" }).int().positive("O valor deve ser maior que zero"),
  paymentDate: z.string().min(1, "Informe a data do pagamento"),
  notes: z.string().trim().max(500, "Observação muito longa").nullable().optional(),
});
export type DebtPaymentFormValues = z.infer<typeof debtPaymentSchema>;
