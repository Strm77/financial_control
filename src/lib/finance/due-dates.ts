import { getDaysInMonth, differenceInCalendarDays } from "date-fns";
import { toDateOnlyString } from "@/lib/formatters/date";

/** Último dia válido de um mês (ex: fevereiro de 2026 -> 28). */
export function lastDayOfMonth(year: number, monthIndex0: number): number {
  return getDaysInMonth(new Date(year, monthIndex0, 1));
}

/**
 * Resolve a data de vencimento de um dia fixo (1-31) dentro de um mês/ano específico.
 * Quando o mês não possui aquele dia (ex: dia 31 em fevereiro), usa o último dia válido.
 */
export function resolveDueDate(dueDay: number, year: number, monthIndex0: number): Date {
  const lastDay = lastDayOfMonth(year, monthIndex0);
  const day = Math.min(Math.max(dueDay, 1), lastDay);
  return new Date(year, monthIndex0, day);
}

export function resolveDueDateString(dueDay: number, year: number, monthIndex0: number): string {
  return toDateOnlyString(resolveDueDate(dueDay, year, monthIndex0));
}

/** Dias restantes até `dueDate` a partir de `from` (negativo quando já venceu). */
export function daysUntilDue(dueDate: Date, from: Date): number {
  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const end = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
  return differenceInCalendarDays(end, start);
}

export type DueUrgency = "overdue" | "today" | "soon" | "upcoming";

/** Classifica a urgência de um vencimento com base nos dias restantes. */
export function classifyDueUrgency(daysRemaining: number): DueUrgency {
  if (daysRemaining < 0) return "overdue";
  if (daysRemaining === 0) return "today";
  if (daysRemaining <= 5) return "soon";
  return "upcoming";
}

export interface UpcomingDue {
  dueDate: Date;
  daysRemaining: number;
  urgency: DueUrgency;
}

/** Calcula o próximo vencimento de uma cobrança de dia fixo a partir de uma data de referência. */
export function nextDueDate(dueDay: number, from: Date): UpcomingDue {
  const candidateThisMonth = resolveDueDate(dueDay, from.getFullYear(), from.getMonth());
  const daysThisMonth = daysUntilDue(candidateThisMonth, from);

  const dueDate = daysThisMonth >= 0
    ? candidateThisMonth
    : resolveDueDate(dueDay, from.getFullYear(), from.getMonth() + 1);

  const daysRemaining = daysUntilDue(dueDate, from);

  return {
    dueDate,
    daysRemaining,
    urgency: classifyDueUrgency(daysRemaining),
  };
}
