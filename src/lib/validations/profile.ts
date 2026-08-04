import { z } from "zod";

export const profileSchema = z.object({
  displayName: z.string().trim().min(1, "Informe seu nome").max(80, "Nome muito longo"),
});
export type ProfileFormValues = z.infer<typeof profileSchema>;
