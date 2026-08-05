import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { ErrorState } from "@/components/ui/error-state";
import { TransactionsManager } from "@/components/finance/transactions-manager";
import { parseMonthParam, monthPeriodRange } from "@/lib/finance/month";

export const metadata = { title: "Transações — Financeiro Pessoal" };

const PAGE_SIZE = 20;

interface TransacoesPageProps {
  searchParams: Promise<{
    mes?: string;
    tipo?: string;
    categoria?: string;
    q?: string;
    pagina?: string;
  }>;
}

export default async function TransacoesPage({ searchParams }: TransacoesPageProps) {
  const params = await searchParams;
  const period = parseMonthParam(params.mes);
  const { start, end } = monthPeriodRange(period);
  const page = Math.max(1, Number(params.pagina) || 1);
  const type = params.tipo === "income" || params.tipo === "expense" ? params.tipo : undefined;
  const categoryId = params.categoria || undefined;
  const search = params.q?.trim() || undefined;

  const supabase = await createClient();

  const { data: categories, error: categoriesError } = await supabase
    .from("categories")
    .select("*")
    .order("name", { ascending: true });

  let listQuery = supabase
    .from("transactions")
    .select("*", { count: "exact" })
    .gte("transaction_date", start)
    .lte("transaction_date", end)
    .order("transaction_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (type) listQuery = listQuery.eq("type", type);
  if (categoryId) listQuery = listQuery.eq("category_id", categoryId);
  if (search) listQuery = listQuery.ilike("description", `%${search}%`);

  const { data: transactions, count, error: listError } = await listQuery.range(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE - 1
  );

  let totalsQuery = supabase
    .from("transactions")
    .select("amount_cents, type")
    .gte("transaction_date", start)
    .lte("transaction_date", end);

  if (type) totalsQuery = totalsQuery.eq("type", type);
  if (categoryId) totalsQuery = totalsQuery.eq("category_id", categoryId);
  if (search) totalsQuery = totalsQuery.ilike("description", `%${search}%`);

  const { data: totalsRows, error: totalsError } = await totalsQuery;

  const error = categoriesError || listError || totalsError;

  const totals = (totalsRows ?? []).reduce(
    (acc, row) => {
      if (row.type === "income") acc.incomeCents += row.amount_cents;
      else acc.expenseCents += row.amount_cents;
      acc.balanceCents = acc.incomeCents - acc.expenseCents;
      return acc;
    },
    { incomeCents: 0, expenseCents: 0, balanceCents: 0 }
  );

  return (
    <div>
      <PageHeader title="Transações" description="Registre e acompanhe suas receitas e despesas." />

      {error ? (
        <ErrorState description="Não foi possível carregar suas transações." />
      ) : (
        <TransactionsManager
          transactions={transactions ?? []}
          categories={categories ?? []}
          totals={totals}
          totalCount={count ?? 0}
          page={page}
          pageSize={PAGE_SIZE}
          filters={{ type: type ?? "", categoryId: categoryId ?? "", search: search ?? "" }}
        />
      )}
    </div>
  );
}
