"use client";

import { useCallback, useMemo } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { monthPeriodToKey, parseMonthParam, type MonthPeriod } from "@/lib/finance/month";

const MONTH_PARAM = "mes";

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
