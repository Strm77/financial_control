import { describe, it, expect } from "vitest";
import { aggregateMonthlyTotals, aggregateByCategory, lastMonthKeys } from "@/lib/finance/aggregate";

const transactions = [
  { amount_cents: 10000, type: "income" as const, transaction_date: "2026-08-05", category_id: null },
  { amount_cents: 3000, type: "expense" as const, transaction_date: "2026-08-10", category_id: "cat-1" },
  { amount_cents: 2000, type: "expense" as const, transaction_date: "2026-08-15", category_id: "cat-2" },
  { amount_cents: 5000, type: "income" as const, transaction_date: "2026-07-20", category_id: null },
  { amount_cents: 1500, type: "expense" as const, transaction_date: "2026-07-22", category_id: "cat-1" },
];

describe("aggregateMonthlyTotals", () => {
  it("agrupa por mês sem misturar meses diferentes", () => {
    const totals = aggregateMonthlyTotals(transactions);

    expect(totals.get("2026-08")).toEqual({
      monthKey: "2026-08",
      incomeCents: 10000,
      expenseCents: 5000,
      balanceCents: 5000,
    });

    expect(totals.get("2026-07")).toEqual({
      monthKey: "2026-07",
      incomeCents: 5000,
      expenseCents: 1500,
      balanceCents: 3500,
    });
  });

  it("não cria entradas para meses sem transações", () => {
    const totals = aggregateMonthlyTotals(transactions);
    expect(totals.has("2026-06")).toBe(false);
  });

  it("retorna mapa vazio para lista vazia", () => {
    expect(aggregateMonthlyTotals([]).size).toBe(0);
  });
});

describe("aggregateByCategory", () => {
  it("soma valores por categoria, agrupando nulos como sem categoria", () => {
    const result = aggregateByCategory(transactions.filter((t) => t.type === "expense"));
    const cat1 = result.find((r) => r.categoryId === "cat-1");
    const cat2 = result.find((r) => r.categoryId === "cat-2");
    expect(cat1?.totalCents).toBe(4500);
    expect(cat2?.totalCents).toBe(2000);
  });

  it("ordena do maior para o menor total", () => {
    const result = aggregateByCategory(transactions.filter((t) => t.type === "expense"));
    expect(result[0].totalCents).toBeGreaterThanOrEqual(result[1]?.totalCents ?? 0);
  });
});

describe("lastMonthKeys", () => {
  it("gera as últimas N chaves de mês terminando na referência", () => {
    const keys = lastMonthKeys(new Date(2026, 7, 15), 6);
    expect(keys).toEqual(["2026-03", "2026-04", "2026-05", "2026-06", "2026-07", "2026-08"]);
  });

  it("lida corretamente com virada de ano", () => {
    const keys = lastMonthKeys(new Date(2026, 1, 1), 3);
    expect(keys).toEqual(["2025-12", "2026-01", "2026-02"]);
  });
});
