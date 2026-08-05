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

/** Infere se um pagamento foi total ou parcial comparando o valor pago com o esperado. */
export function inferPaymentStatus(expectedCents: number, paidCents: number): InferredPaymentStatus {
  return paidCents >= expectedCents ? "paid" : "partial";
}

/**
 * Diferença entre o valor esperado e o valor pago, em centavos.
 * Positivo = desconto (pagou menos que o esperado); negativo = acréscimo (pagou mais, ex: juros).
 */
export function computeDiscountCents(expectedCents: number, paidCents: number): number {
  return expectedCents - paidCents;
}
