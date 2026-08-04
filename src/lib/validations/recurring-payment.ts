import { z } from "zod";

export const recurringPaymentSchema = z
  .object({
    description: z.string().trim().min(1, "Informe uma descrição").max(140, "Descrição muito longa"),
    amountCents: z.number({ message: "Informe um valor" }).int().positive("O valor deve ser maior que zero"),
    categoryId: z.string().uuid().nullable().optional(),
    dueDay: z
      .number({ message: "Informe o dia de vencimento" })
      .int()
      .min(1, "O dia deve ser entre 1 e 31")
      .max(31, "O dia deve ser entre 1 e 31"),
    startDate: z.string().min(1, "Informe a data de início"),
    endDate: z.string().nullable().optional(),
    notes: z.string().trim().max(500, "Observação muito longa").nullable().optional(),
  })
  .refine((data) => !data.endDate || data.endDate >= data.startDate, {
    message: "A data final deve ser igual ou posterior à data de início",
    path: ["endDate"],
  });
export type RecurringPaymentFormValues = z.infer<typeof recurringPaymentSchema>;

export const markPaymentPaidSchema = z.object({
  paidAt: z.string().min(1, "Informe a data do pagamento"),
  amountPaidCents: z.number({ message: "Informe o valor pago" }).int().positive("O valor deve ser maior que zero"),
});
export type MarkPaymentPaidFormValues = z.infer<typeof markPaymentPaidSchema>;
