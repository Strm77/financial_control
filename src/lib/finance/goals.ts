import { differenceInCalendarMonths, startOfMonth } from "date-fns";

export interface GoalProgress {
  percent: number;
  remainingCents: number;
  isComplete: boolean;
}

/** Calcula percentual concluído (0-100) e valor restante de uma meta financeira. */
export function computeGoalProgress(currentCents: number, targetCents: number): GoalProgress {
  if (targetCents <= 0) {
    return { percent: 0, remainingCents: 0, isComplete: false };
  }

  const rawPercent = (currentCents / targetCents) * 100;
  const percent = Math.min(100, Math.max(0, Math.round(rawPercent * 100) / 100));
  const remainingCents = Math.max(0, targetCents - currentCents);

  return {
    percent,
    remainingCents,
    isComplete: currentCents >= targetCents,
  };
}

/**
 * Valor mensal necessário (em centavos) para atingir a meta até `targetDate`, considerando
 * o mês corrente como o primeiro mês disponível para contribuir. Retorna `null` quando não
 * há prazo definido.
 */
export function monthlyAmountNeeded(
  currentCents: number,
  targetCents: number,
  targetDate: Date | null,
  from: Date = new Date()
): number | null {
  if (!targetDate) return null;

  const remaining = targetCents - currentCents;
  if (remaining <= 0) return 0;

  const monthsRemaining = differenceInCalendarMonths(startOfMonth(targetDate), startOfMonth(from));

  if (monthsRemaining <= 0) return remaining;

  return Math.ceil(remaining / (monthsRemaining + 1));
}
