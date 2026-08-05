import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { ErrorState } from "@/components/ui/error-state";
import { IncomesManager } from "@/components/finance/incomes-manager";
import { parseMonthParam } from "@/lib/finance/month";

export const metadata = { title: "Renda — Financeiro Pessoal" };

interface RendaPageProps {
  searchParams: Promise<{ mes?: string }>;
}

export default async function RendaPage({ searchParams }: RendaPageProps) {
  const params = await searchParams;
  const period = parseMonthParam(params.mes);
  const referenceMonth = `${period.year}-${String(period.month).padStart(2, "0")}-01`;

  const supabase = await createClient();
  const { data: incomes, error } = await supabase
    .from("incomes")
    .select("*")
    .eq("reference_month", referenceMonth)
    .order("type", { ascending: true })
    .order("created_at", { ascending: false });

  return (
    <div>
      <PageHeader title="Renda" description="Registre sua renda fixa e variável do mês." />

      {error ? (
        <ErrorState description="Não foi possível carregar sua renda." />
      ) : (
        <IncomesManager incomes={incomes ?? []} referenceMonth={referenceMonth} />
      )}
    </div>
  );
}
