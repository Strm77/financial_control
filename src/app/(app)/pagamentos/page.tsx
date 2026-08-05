import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { ErrorState } from "@/components/ui/error-state";
import { RecurringPaymentsManager } from "@/components/finance/recurring-payments-manager";
import { parseMonthParam } from "@/lib/finance/month";
import { nowInSaoPaulo } from "@/lib/formatters/date";
import type { Category } from "@/types/entities";

export const metadata = { title: "Pagamentos — Financeiro Pessoal" };

interface PagamentosPageProps {
  searchParams: Promise<{ mes?: string }>;
}

export default async function PagamentosPage({ searchParams }: PagamentosPageProps) {
  const params = await searchParams;
  const period = parseMonthParam(params.mes);
  const referenceMonth = `${period.year}-${String(period.month).padStart(2, "0")}-01`;

  const supabase = await createClient();

  const [{ data: categories, error: categoriesError }, { data: recurringPayments, error: recurringError }, { data: paymentRecords, error: recordsError }] =
    await Promise.all([
      supabase.from("categories").select("*").eq("type", "expense").order("name"),
      supabase.from("recurring_payments").select("*").order("due_day", { ascending: true }),
      supabase.from("payment_records").select("*").eq("reference_month", referenceMonth),
    ]);

  const error = categoriesError || recurringError || recordsError;
  const categoriesById = new Map<string, Category>((categories ?? []).map((c: Category) => [c.id, c]));

  return (
    <div>
      <PageHeader title="Pagamentos" description="Acompanhe suas cobranças recorrentes mês a mês." />

      {error ? (
        <ErrorState description="Não foi possível carregar seus pagamentos." />
      ) : (
        <RecurringPaymentsManager
          recurringPayments={recurringPayments ?? []}
          paymentRecords={paymentRecords ?? []}
          expenseCategories={categories ?? []}
          categoriesById={categoriesById}
          period={period}
          referenceMonth={referenceMonth}
          now={nowInSaoPaulo()}
        />
      )}
    </div>
  );
}
