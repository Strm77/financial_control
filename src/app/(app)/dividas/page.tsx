import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { ErrorState } from "@/components/ui/error-state";
import { DebtsManager } from "@/components/finance/debts-manager";

export const metadata = { title: "Dívidas — Financeiro Pessoal" };

export default async function DividasPage() {
  const supabase = await createClient();
  const { data: debts, error } = await supabase
    .from("debts")
    .select("*")
    .order("status", { ascending: true })
    .order("created_at", { ascending: false });

  return (
    <div>
      <PageHeader title="Dívidas" description="Acompanhe financiamentos, empréstimos e o saldo devedor." />

      {error ? <ErrorState description="Não foi possível carregar suas dívidas." /> : <DebtsManager debts={debts ?? []} />}
    </div>
  );
}
