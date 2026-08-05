import { z } from "zod";

export const INCOME_TYPE_LABELS = {
  fixed: "Renda fixa",
  variable: "Renda variável",
} as const;

export const incomeSchema = z.object({
  description: z.string().trim().min(1, "Informe uma descrição").max(140, "Descrição muito longa"),
  type: z.enum(["fixed", "variable"], { message: "Selecione o tipo" }),
  amountCents: z.number({ message: "Informe um valor" }).int().positive("O valor deve ser maior que zero"),
  referenceMonth: z.string().min(1, "Informe o mês"),
  notes: z.string().trim().max(500, "Observação muito longa").nullable().optional(),
});
export type IncomeFormValues = z.infer<typeof incomeSchema>;
