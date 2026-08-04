import { z } from "zod";

export const savingsGoalSchema = z.object({
  name: z.string().trim().min(1, "Informe um nome").max(140, "Nome muito longo"),
  targetAmountCents: z
    .number({ message: "Informe o valor da meta" })
    .int()
    .positive("O valor deve ser maior que zero"),
  targetDate: z.string().nullable().optional(),
  notes: z.string().trim().max(500, "Observação muito longa").nullable().optional(),
});
export type SavingsGoalFormValues = z.infer<typeof savingsGoalSchema>;

export const savingsMovementSchema = z.object({
  kind: z.enum(["contribution", "withdrawal"]),
  amountCents: z.number({ message: "Informe um valor" }).int().positive("O valor deve ser maior que zero"),
  contributionDate: z.string().min(1, "Informe a data"),
  notes: z.string().trim().max(500, "Observação muito longa").nullable().optional(),
});
export type SavingsMovementFormValues = z.infer<typeof savingsMovementSchema>;
