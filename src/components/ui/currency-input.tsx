"use client";

import { forwardRef, useState, useEffect } from "react";
import type { InputHTMLAttributes } from "react";
import { digitsToCents, centsToInputValue } from "@/lib/formatters/currency";
import { cn } from "@/lib/utils";

export interface CurrencyInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type"> {
  /** Valor atual em centavos (número inteiro). */
  valueCents: number | null;
  onValueChange: (cents: number) => void;
  invalid?: boolean;
}

function formatDisplay(cents: number | null): string {
  if (cents === null || cents === 0) return "";
  return `R$ ${centsToInputValue(cents)}`;
}

/** Input de moeda mascarado: o usuário digita apenas dígitos, os dois últimos viram centavos. */
export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ valueCents, onValueChange, invalid, className, ...props }, ref) => {
    const [display, setDisplay] = useState(() => formatDisplay(valueCents));

    useEffect(() => {
      setDisplay(formatDisplay(valueCents));
    }, [valueCents]);

    return (
      <input
        ref={ref}
        inputMode="decimal"
        aria-invalid={invalid || undefined}
        value={display}
        onChange={(event) => {
          const cents = digitsToCents(event.target.value);
          setDisplay(formatDisplay(cents));
          onValueChange(cents);
        }}
        placeholder="R$ 0,00"
        className={cn(
          "w-full h-11 px-3 rounded-brutal border-brutal bg-card text-card-foreground",
          "placeholder:text-muted-foreground tabular-nums",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          invalid && "border-danger",
          className
        )}
        {...props}
      />
    );
  }
);
CurrencyInput.displayName = "CurrencyInput";
