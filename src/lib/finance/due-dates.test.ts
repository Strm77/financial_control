import { describe, it, expect } from "vitest";
import { lastDayOfMonth, resolveDueDate, daysUntilDue, classifyDueUrgency, nextDueDate } from "@/lib/finance/due-dates";

describe("lastDayOfMonth", () => {
  it("retorna 28 para fevereiro em ano não bissexto", () => {
    expect(lastDayOfMonth(2026, 1)).toBe(28);
  });

  it("retorna 29 para fevereiro em ano bissexto", () => {
    expect(lastDayOfMonth(2024, 1)).toBe(29);
  });

  it("retorna 31 para janeiro", () => {
    expect(lastDayOfMonth(2026, 0)).toBe(31);
  });

  it("retorna 30 para abril", () => {
    expect(lastDayOfMonth(2026, 3)).toBe(30);
  });
});

describe("resolveDueDate", () => {
  it("usa o último dia válido quando o mês não possui o dia solicitado", () => {
    const date = resolveDueDate(31, 2026, 1); // fevereiro de 2026
    expect(date.getDate()).toBe(28);
    expect(date.getMonth()).toBe(1);
  });

  it("usa o dia exato quando o mês possui esse dia", () => {
    const date = resolveDueDate(15, 2026, 5);
    expect(date.getDate()).toBe(15);
  });

  it("nunca resolve para um dia menor que 1", () => {
    const date = resolveDueDate(0, 2026, 5);
    expect(date.getDate()).toBe(1);
  });
});

describe("daysUntilDue", () => {
  it("calcula dias restantes corretamente", () => {
    const from = new Date(2026, 7, 1);
    const due = new Date(2026, 7, 10);
    expect(daysUntilDue(due, from)).toBe(9);
  });

  it("retorna negativo quando já venceu", () => {
    const from = new Date(2026, 7, 15);
    const due = new Date(2026, 7, 10);
    expect(daysUntilDue(due, from)).toBe(-5);
  });

  it("retorna 0 quando vence hoje", () => {
    const from = new Date(2026, 7, 10);
    const due = new Date(2026, 7, 10);
    expect(daysUntilDue(due, from)).toBe(0);
  });
});

describe("classifyDueUrgency", () => {
  it("classifica corretamente cada faixa", () => {
    expect(classifyDueUrgency(-1)).toBe("overdue");
    expect(classifyDueUrgency(0)).toBe("today");
    expect(classifyDueUrgency(3)).toBe("soon");
    expect(classifyDueUrgency(10)).toBe("upcoming");
  });
});

describe("nextDueDate", () => {
  it("retorna o vencimento deste mês quando ainda não passou", () => {
    const from = new Date(2026, 7, 1); // 1 de agosto de 2026
    const result = nextDueDate(10, from);
    expect(result.dueDate.getMonth()).toBe(7);
    expect(result.dueDate.getDate()).toBe(10);
    expect(result.daysRemaining).toBe(9);
  });

  it("avança para o próximo mês quando o vencimento deste mês já passou", () => {
    const from = new Date(2026, 7, 15); // 15 de agosto de 2026
    const result = nextDueDate(10, from);
    expect(result.dueDate.getMonth()).toBe(8);
    expect(result.dueDate.getDate()).toBe(10);
  });

  it("lida com virada de ano corretamente", () => {
    const from = new Date(2026, 11, 20); // 20 de dezembro de 2026
    const result = nextDueDate(5, from);
    expect(result.dueDate.getFullYear()).toBe(2027);
    expect(result.dueDate.getMonth()).toBe(0);
    expect(result.dueDate.getDate()).toBe(5);
  });

  it("resolve para o último dia válido quando o mês atual é mais curto que o dia configurado", () => {
    const from = new Date(2026, 1, 1); // 1 de fevereiro de 2026
    const result = nextDueDate(31, from);
    expect(result.dueDate.getMonth()).toBe(1);
    expect(result.dueDate.getDate()).toBe(28);
  });

  it("ao rolar para o próximo mês, ajusta para o último dia válido se necessário", () => {
    const from = new Date(2026, 0, 31); // 31 de janeiro de 2026, vencimento dia 30 já passou
    const result = nextDueDate(30, from);
    expect(result.dueDate.getMonth()).toBe(1);
    expect(result.dueDate.getDate()).toBe(28);
  });
});
