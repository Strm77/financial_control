import { describe, it, expect } from "vitest";
import { computeInstallmentProgress, inferPaymentStatus, computeDiscountCents } from "@/lib/finance/payment-progress";

describe("computeInstallmentProgress", () => {
  it("calcula a próxima parcela a partir das já pagas", () => {
    expect(computeInstallmentProgress(0, 12)).toEqual({ currentInstallment: 1, totalInstallments: 12, isComplete: false });
    expect(computeInstallmentProgress(5, 12)).toEqual({ currentInstallment: 6, totalInstallments: 12, isComplete: false });
  });

  it("marca como completa quando todas as parcelas foram pagas", () => {
    expect(computeInstallmentProgress(12, 12)).toEqual({ currentInstallment: 12, totalInstallments: 12, isComplete: true });
  });

  it("nunca ultrapassa o total mesmo com mais pagamentos que o esperado", () => {
    expect(computeInstallmentProgress(15, 12)).toEqual({ currentInstallment: 12, totalInstallments: 12, isComplete: true });
  });
});

describe("inferPaymentStatus", () => {
  it("retorna 'paid' quando o valor pago é igual ou maior que o esperado", () => {
    expect(inferPaymentStatus(10000, 10000)).toBe("paid");
    expect(inferPaymentStatus(10000, 12000)).toBe("paid");
  });

  it("retorna 'partial' quando o valor pago é menor que o esperado", () => {
    expect(inferPaymentStatus(10000, 8000)).toBe("partial");
  });

  it("retorna 'paid' quando o valor pago é menor mas há desconto marcado", () => {
    expect(inferPaymentStatus(10000, 8000, true)).toBe("paid");
  });

  it("com hasDiscount, ainda retorna 'paid' quando pagou o valor cheio", () => {
    expect(inferPaymentStatus(10000, 10000, true)).toBe("paid");
  });
});

describe("computeDiscountCents", () => {
  it("retorna positivo quando pagou menos que o esperado (desconto)", () => {
    expect(computeDiscountCents(10000, 9000)).toBe(1000);
  });

  it("retorna negativo quando pagou mais que o esperado (acréscimo)", () => {
    expect(computeDiscountCents(10000, 10500)).toBe(-500);
  });

  it("retorna zero quando pagou exatamente o esperado", () => {
    expect(computeDiscountCents(10000, 10000)).toBe(0);
  });
});
