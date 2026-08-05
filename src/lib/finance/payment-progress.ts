export interface InstallmentProgress {
  currentInstallment: number;
  totalInstallments: number;
  isComplete: boolean;
}

/**
 * Calcula a parcela atual de uma dívida/compra parcelada a partir de quantas
 * parcelas já foram pagas. Nunca ultrapassa o total.
 */
export function computeInstallmentProgress(paidInstallments: number, totalInstallments: number): InstallmentProgress {
  const isComplete = paidInstallments >= totalInstallments;
  const currentInstallment = isComplete ? totalInstallments : paidInstallments + 1;

  return { currentInstallment, totalInstallments, isComplete };
}

export type InferredPaymentStatus = "paid" | "partial";

/**
 * Infere se um pagamento foi total ou parcial comparando o valor pago com o esperado.
 * Quando `hasDiscount` é true, um valor pago menor que o esperado é tratado como desconto
 * (o pagamento é considerado total, não parcial) em vez de pagamento incompleto.
 */
export function inferPaymentStatus(expectedCents: number, paidCents: number, hasDiscount = false): InferredPaymentStatus {
  if (hasDiscount) return "paid";
  return paidCents >= expectedCents ? "paid" : "partial";
}

/**
 * Diferença entre o valor esperado e o valor pago, em centavos.
 * Positivo = desconto (pagou menos que o esperado); negativo = acréscimo (pagou mais, ex: juros).
 */
export function computeDiscountCents(expectedCents: number, paidCents: number): number {
  return expectedCents - paidCents;
}
