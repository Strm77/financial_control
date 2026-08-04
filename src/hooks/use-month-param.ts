"use client";

import { useCallback, useMemo } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { nowInSaoPaulo } from "@/lib/formatters/date";
import { keyToMonthPeriod, monthPeriodToKey, type MonthPeriod } from "@/lib/finance/month";

const MONTH_PARAM = "mes";

export function currentMonthPeriod(): MonthPeriod {
  const now = nowInSaoPaulo();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

export function parseMonthParam(value: string | undefined | null): MonthPeriod {
  if (value && /^\d{4}-\d{2}$/.test(value)) {
    return keyToMonthPeriod(value);
  }
  return currentMonthPeriod();
}

/** Lê e atualiza o período de mês/ano selecionado via query string (`?mes=YYYY-MM`). */
export function useMonthParam(): [MonthPeriod, (period: MonthPeriod) => void] {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const period = useMemo(() => parseMonthParam(searchParams.get(MONTH_PARAM)), [searchParams]);

  const setPeriod = useCallback(
    (next: MonthPeriod) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(MONTH_PARAM, monthPeriodToKey(next));
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  return [period, setPeriod];
}
