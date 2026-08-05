import { z } from "zod";

export const CARD_TYPE_LABELS = {
  credito: "Cartão de crédito",
  loja: "Cartão de loja",
} as const;

export const cardSchema = z.object({
  name: z.string().trim().min(1, "Informe um nome").max(60, "Nome muito longo"),
  cardType: z.enum(["credito", "loja"], { message: "Selecione o tipo" }),
  closingDay: z.number().int().min(1, "Dia entre 1 e 31").max(31, "Dia entre 1 e 31").nullable().optional(),
  dueDay: z.number().int().min(1, "Dia entre 1 e 31").max(31, "Dia entre 1 e 31").nullable().optional(),
  notes: z.string().trim().max(500, "Observação muito longa").nullable().optional(),
});
export type CardFormValues = z.infer<typeof cardSchema>;
