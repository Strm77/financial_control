const BRL_FORMATTER = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

/** Formata um valor em centavos (inteiro) como moeda brasileira, ex: 105099 -> "R$ 1.050,99". */
export function centsToBRL(cents: number): string {
  if (!Number.isFinite(cents)) return BRL_FORMATTER.format(0);
  return BRL_FORMATTER.format(cents / 100);
}

/** Converte centavos para um número em reais (uso interno em cálculos, nunca para persistir). */
export function centsToReaisNumber(cents: number): number {
  return cents / 100;
}

/**
 * Converte uma sequência de dígitos digitados (como em um input mascarado de moeda,
 * onde os dois últimos dígitos são os centavos) para um inteiro em centavos.
 * Ex: "150" -> 150 (R$ 1,50); "100050" -> 100050 (R$ 1.000,50).
 */
export function digitsToCents(digits: string): number {
  const onlyDigits = digits.replace(/\D/g, "");
  if (onlyDigits === "") return 0;
  return parseInt(onlyDigits, 10);
}

/**
 * Converte um valor em reais — número ou string no formato brasileiro ("1.050,99") —
 * para um inteiro em centavos, evitando erros de ponto flutuante.
 */
export function reaisToCents(value: string | number): number {
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return 0;
    return Math.round(value * 100);
  }

  const trimmed = value.trim();
  if (trimmed === "") return 0;

  const normalized = trimmed.replace(/\./g, "").replace(",", ".");
  const parsed = Number(normalized);
  if (Number.isNaN(parsed)) return 0;
  return Math.round(parsed * 100);
}

/** Formata centavos para edição em um input de texto simples (sem símbolo), ex: 105099 -> "1050,99". */
export function centsToInputValue(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",");
}
