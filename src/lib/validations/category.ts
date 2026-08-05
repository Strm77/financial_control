import { z } from "zod";

export const CATEGORY_ICONS = [
  "home",
  "utensils",
  "car",
  "heart-pulse",
  "party-popper",
  "repeat",
  "graduation-cap",
  "shopping-bag",
  "more-horizontal",
  "wallet",
  "briefcase",
  "trending-up",
  "rotate-ccw",
  "gift",
  "plane",
  "dumbbell",
  "dog",
  "baby",
  "book-open",
  "phone",
  "piggy-bank",
  "landmark",
  "shirt",
  "wrench",
  "credit-card",
] as const;

export const CATEGORY_COLORS = [
  "#ff6b6b",
  "#ffb020",
  "#7cc6fe",
  "#e8433a",
  "#a78bfa",
  "#4fb85f",
  "#f472b6",
  "#fb923c",
  "#9ca3af",
  "#ffd23f",
  "#34d399",
  "#60a5fa",
] as const;

export const categorySchema = z.object({
  name: z.string().trim().min(1, "Informe um nome").max(40, "Nome muito longo (máx. 40 caracteres)"),
  type: z.enum(["income", "expense"], { message: "Selecione o tipo" }),
  icon: z.string().max(40).nullable().optional(),
  color: z.string().max(20).nullable().optional(),
});
export type CategoryFormValues = z.infer<typeof categorySchema>;
