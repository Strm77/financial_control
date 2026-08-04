/** Representa um período de mês/ano usado nos filtros globais da aplicação. */
export interface MonthPeriod {
  year: number;
  month: number; // 1-12
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
