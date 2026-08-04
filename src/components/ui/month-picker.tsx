"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatMonthYearBR } from "@/lib/formatters/date";
import { shiftMonthPeriod, type MonthPeriod } from "@/lib/finance/month";
import { cn } from "@/lib/utils";

export interface MonthPickerProps {
  period: MonthPeriod;
  onChange: (period: MonthPeriod) => void;
  className?: string;
}

export function MonthPicker({ period, onChange, className }: MonthPickerProps) {
  const label = formatMonthYearBR(`${period.year}-${String(period.month).padStart(2, "0")}`);
  const capitalized = label.charAt(0).toUpperCase() + label.slice(1);

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 border-brutal rounded-brutal bg-card shadow-brutal-sm px-1 py-1",
        className
      )}
    >
      <button
        type="button"
        aria-label="Mês anterior"
        onClick={() => onChange(shiftMonthPeriod(period, -1))}
        className="size-9 grid place-items-center rounded-brutal hover:bg-muted press-brutal cursor-pointer"
      >
        <ChevronLeft className="size-4" aria-hidden="true" />
      </button>
      <span className="min-w-36 text-center text-sm font-bold font-display capitalize select-none">
        {capitalized}
      </span>
      <button
        type="button"
        aria-label="Próximo mês"
        onClick={() => onChange(shiftMonthPeriod(period, 1))}
        className="size-9 grid place-items-center rounded-brutal hover:bg-muted press-brutal cursor-pointer"
      >
        <ChevronRight className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}
