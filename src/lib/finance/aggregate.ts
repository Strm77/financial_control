export interface TransactionLike {
  amount_cents: number;
  type: "income" | "expense";
  transaction_date: string;
  category_id?: string | null;
}

export interface MonthlyTotal {
  monthKey: string;
  incomeCents: number;
  expenseCents: number;
  balanceCents: number;
}

/**
 * Agrega receitas e despesas por mês (chave "YYYY-MM"), sem misturar registros
 * de meses diferentes. Não cria entradas para meses sem transações.
 */
export function aggregateMonthlyTotals(transactions: TransactionLike[]): Map<string, MonthlyTotal> {
  const map = new Map<string, MonthlyTotal>();

  for (const t of transactions) {
    const monthKey = t.transaction_date.slice(0, 7);
    const existing = map.get(monthKey) ?? {
      monthKey,
      incomeCents: 0,
      expenseCents: 0,
      balanceCents: 0,
    };

    if (t.type === "income") {
      existing.incomeCents += t.amount_cents;
    } else {
      existing.expenseCents += t.amount_cents;
    }
    existing.balanceCents = existing.incomeCents - existing.expenseCents;

    map.set(monthKey, existing);
  }

  return map;
}

/** Gera as últimas `count` chaves de mês ("YYYY-MM"), da mais antiga para a mais recente, terminando em `reference`. */
export function lastMonthKeys(reference: Date, count: number): string[] {
  const keys: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(reference.getFullYear(), reference.getMonth() - i, 1);
    keys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return keys;
}

export interface CategoryTotal {
  categoryId: string | null;
  totalCents: number;
}

/** Agrega o total de despesas (ou receitas) por categoria, mantendo `null` para "sem categoria". */
export function aggregateByCategory(transactions: TransactionLike[]): CategoryTotal[] {
  const map = new Map<string | null, number>();

  for (const t of transactions) {
    const key = t.category_id ?? null;
    map.set(key, (map.get(key) ?? 0) + t.amount_cents);
  }

  return Array.from(map.entries())
    .map(([categoryId, totalCents]) => ({ categoryId, totalCents }))
    .sort((a, b) => b.totalCents - a.totalCents);
}
