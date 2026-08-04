import { describe, it, expect } from "vitest";
import { centsToBRL, reaisToCents, digitsToCents } from "@/lib/formatters/currency";

describe("reaisToCents", () => {
  it("converte string no formato brasileiro para centavos", () => {
    expect(reaisToCents("10,50")).toBe(1050);
    expect(reaisToCents("1.000,00")).toBe(100000);
    expect(reaisToCents("0,01")).toBe(1);
  });

  it("converte número para centavos sem erro de ponto flutuante", () => {
    expect(reaisToCents(10.1)).toBe(1010);
    expect(reaisToCents(1000)).toBe(100000);
  });

  it("retorna 0 para entradas vazias ou inválidas", () => {
    expect(reaisToCents("")).toBe(0);
    expect(reaisToCents("abc")).toBe(0);
  });
});

describe("digitsToCents", () => {
  it("interpreta os últimos dois dígitos como centavos", () => {
    expect(digitsToCents("150")).toBe(150);
    expect(digitsToCents("100050")).toBe(100050);
    expect(digitsToCents("")).toBe(0);
  });

  it("ignora caracteres não numéricos", () => {
    expect(digitsToCents("R$ 1.050,99")).toBe(105099);
  });
});

describe("centsToBRL", () => {
  it("formata centavos como moeda brasileira", () => {
    expect(centsToBRL(1050)).toContain("10,50");
    expect(centsToBRL(100000)).toContain("1.000,00");
    expect(centsToBRL(0)).toContain("0,00");
  });
});
