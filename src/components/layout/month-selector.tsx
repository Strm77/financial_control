"use client";

import { useEffect, useRef, useState } from "react";
import { formatMonthNameBR } from "@/lib/formatters/date";
import { shiftMonthPeriod, monthPeriodToKey, type MonthPeriod } from "@/lib/finance/month";
import { cn } from "@/lib/utils";

export interface MonthSelectorProps {
  period: MonthPeriod;
  onChange: (period: MonthPeriod) => void;
}

const ITEM_WIDTH = 128; // px — largura de cada mês na fita da "roleta"
const OFFSETS = [-2, -1, 0, 1, 2];
const CENTER_INDEX = 2;

function monthKey(period: MonthPeriod) {
  return `${period.year}-${String(period.month).padStart(2, "0")}`;
}

function monthLabel(period: MonthPeriod) {
  return formatMonthNameBR(monthPeriodToKey(period));
}

export function MonthSelector({ period, onChange }: MonthSelectorProps) {
  const [visual, setVisual] = useState(period);
  const [direction, setDirection] = useState<"prev" | "next" | null>(null);
  const animating = useRef(false);

  useEffect(() => {
    if (!animating.current) setVisual(period);
  }, [period]);

  function go(delta: -1 | 1) {
    if (animating.current) return;
    animating.current = true;
    setDirection(delta === 1 ? "next" : "prev");
  }

  function handleTransitionEnd() {
    if (!direction) return;
    const delta = direction === "next" ? 1 : -1;
    const next = shiftMonthPeriod(visual, delta);
    setVisual(next);
    setDirection(null);
    animating.current = false;
    onChange(next);
  }

  const items = OFFSETS.map((offset) => shiftMonthPeriod(visual, offset));
  const step = direction === "next" ? -2 : direction === "prev" ? 0 : -1;

  return (
    <div
      className="rounded-[var(--radius)] px-3 py-1.5"
      style={{ background: "var(--month-panel-bg)", color: "var(--month-panel-foreground)" }}
    >
      <div className="relative overflow-hidden select-none" style={{ width: ITEM_WIDTH * 3 }}>
        <div
          data-sliding={direction !== null}
          className="month-track flex"
          style={{ transform: `translateX(${step * ITEM_WIDTH}px)` }}
          onTransitionEnd={handleTransitionEnd}
        >
          {items.map((item, i) => {
            const isCurrent = i === CENTER_INDEX;
            const isPrev = i === CENTER_INDEX - 1;
            const isNext = i === CENTER_INDEX + 1;
            const clickable = isPrev || isNext;

            return (
              <div key={monthKey(item)} className="shrink-0 text-center" style={{ width: ITEM_WIDTH }}>
                {clickable ? (
                  <button
                    type="button"
                    aria-label={isPrev ? "Mês anterior" : "Próximo mês"}
                    onClick={() => go(isPrev ? -1 : 1)}
                    className="w-full truncate px-1 py-1 text-sm capitalize opacity-55 hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    {monthLabel(item)}
                  </button>
                ) : (
                  <span
                    className={cn(
                      "block truncate px-1 py-1 text-base font-bold capitalize text-primary",
                      !isCurrent && "invisible"
                    )}
                  >
                    {monthLabel(item)}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
