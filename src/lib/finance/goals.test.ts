import { describe, it, expect } from "vitest";
import { computeGoalProgress, monthlyAmountNeeded } from "@/lib/finance/goals";

describe("computeGoalProgress", () => {
  it("calcula percentual e valor restante corretamente", () => {
    const progress = computeGoalProgress(5000, 10000);
    expect(progress.percent).toBe(50);
    expect(progress.remainingCents).toBe(5000);
    expect(progress.isComplete).toBe(false);
  });

  it("marca como completa quando o valor atual atinge ou ultrapassa a meta", () => {
    const progress = computeGoalProgress(12000, 10000);
    expect(progress.percent).toBe(100);
    expect(progress.remainingCents).toBe(0);
    expect(progress.isComplete).toBe(true);
  });

  it("nunca retorna percentual negativo ou acima de 100", () => {
    expect(computeGoalProgress(0, 10000).percent).toBe(0);
    expect(computeGoalProgress(-500, 10000).percent).toBe(0);
  });

  it("lida com meta de valor zero sem dividir por zero", () => {
    const progress = computeGoalProgress(100, 0);
    expect(progress.percent).toBe(0);
    expect(progress.isComplete).toBe(false);
  });
});

describe("monthlyAmountNeeded", () => {
  it("retorna null quando não há data alvo", () => {
    expect(monthlyAmountNeeded(0, 10000, null)).toBeNull();
  });

  it("retorna 0 quando a meta já foi atingida", () => {
    const from = new Date(2026, 7, 1);
    const target = new Date(2026, 9, 1);
    expect(monthlyAmountNeeded(10000, 10000, target, from)).toBe(0);
  });

  it("retorna o valor total restante quando o prazo é no mês corrente", () => {
    const from = new Date(2026, 7, 15);
    const target = new Date(2026, 7, 31);
    expect(monthlyAmountNeeded(4000, 10000, target, from)).toBe(6000);
  });

  it("divide o valor restante pelos meses disponíveis até o prazo", () => {
    const from = new Date(2026, 7, 1); // agosto
    const target = new Date(2026, 9, 1); // outubro (2 meses de diferença)
    // meses disponíveis = diferença (2) + 1 = 3
    expect(monthlyAmountNeeded(1000, 10000, target, from)).toBe(3000);
  });
});
