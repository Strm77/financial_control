import { resolveDueDate, daysUntilDue, classifyDueUrgency, type DueUrgency } from "@/lib/finance/due-dates";

export type ComputedPaymentStatus = "paid" | "partial" | "pending" | "overdue";

export interface RecurringPaymentMonthInfo {
  dueDate: Date;
  daysRemaining: number;
  urgency: DueUrgency;
  status: ComputedPaymentStatus;
}

/**
 * Calcula a data de vencimento, dias restantes e status (pago/parcial/pendente/atrasado) de uma
 * cobrança recorrente para um mês/ano específico, considerando o último dia válido do mês.
 */
export function computeRecurringPaymentMonthInfo(
  dueDay: number,
  year: number,
  monthIndex0: number,
  recordStatus: "paid" | "partial" | null,
  from: Date
): RecurringPaymentMonthInfo {
  const dueDate = resolveDueDate(dueDay, year, monthIndex0);
  const daysRemaining = daysUntilDue(dueDate, from);
  const urgency = classifyDueUrgency(daysRemaining);

  const status: ComputedPaymentStatus =
    recordStatus === "paid" ? "paid" : recordStatus === "partial" ? "partial" : daysRemaining < 0 ? "overdue" : "pending";

  return { dueDate, daysRemaining, urgency, status };
}
