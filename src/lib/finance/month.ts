import { nowInSaoPaulo } from "@/lib/formatters/date";

/** Representa um período de mês/ano usado nos filtros globais da aplicação. */
export interface MonthPeriod {
  year: number;
  month: number; // 1-12
}

/** Mês/ano atual, calculado a partir do horário de São Paulo. */
export function currentMonthPeriod(): MonthPeriod {
  const now = nowInSaoPaulo();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

/** Interpreta o valor da query string `?mes=YYYY-MM`, com fallback para o mês atual. */
export function parseMonthParam(value: string | undefined | null): MonthPeriod {
  if (value && /^\d{4}-\d{2}$/.test(value)) {
    return keyToMonthPeriod(value);
  }
  return currentMonthPeriod();
}

export function monthPeriodToKey(period: MonthPeriod): string {
  return `${period.year}-${String(period.month).padStart(2, "0")}`;
}

export function keyToMonthPeriod(key: string): MonthPeriod {
  const [year, month] = key.split("-").map(Number);
  return { year, month };
}

export function monthPeriodRange(period: MonthPeriod): { start: string; end: string } {
  const start = `${period.year}-${String(period.month).padStart(2, "0")}-01`;
  const lastDay = new Date(period.year, period.month, 0).getDate();
  const end = `${period.year}-${String(period.month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  return { start, end };
}

export function shiftMonthPeriod(period: MonthPeriod, delta: number): MonthPeriod {
  const date = new Date(period.year, period.month - 1 + delta, 1);
  return { year: date.getFullYear(), month: date.getMonth() + 1 };
}
