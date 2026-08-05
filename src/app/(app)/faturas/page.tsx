import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { ErrorState } from "@/components/ui/error-state";
import { FaturasManager } from "@/components/finance/faturas-manager";
import { parseMonthParam } from "@/lib/finance/month";
import type { Invoice } from "@/types/entities";

export const metadata = { title: "Faturas — Financeiro Pessoal" };

interface FaturasPageProps {
  searchParams: Promise<{ mes?: string }>;
}

export default async function FaturasPage({ searchParams }: FaturasPageProps) {
  const params = await searchParams;
  const period = parseMonthParam(params.mes);
  const referenceMonth = `${period.year}-${String(period.month).padStart(2, "0")}-01`;

  const supabase = await createClient();

  const [{ data: cards, error: cardsError }, { data: invoices, error: invoicesError }] = await Promise.all([
    supabase.from("cards").select("*").order("name"),
    supabase.from("invoices").select("*").eq("reference_month", referenceMonth),
  ]);

  const error = cardsError || invoicesError;
  const invoicesByCardId: Record<string, Invoice> = {};
  for (const invoice of invoices ?? []) {
    invoicesByCardId[invoice.card_id] = invoice;
  }

  return (
    <div>
      <PageHeader title="Faturas" description="Gerencie seus cartões e os itens de cada fatura mensal." />

      {error ? (
        <ErrorState description="Não foi possível carregar suas faturas." />
      ) : (
        <FaturasManager cards={cards ?? []} invoicesByCardId={invoicesByCardId} referenceMonth={referenceMonth} />
      )}
    </div>
  );
}
