import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { ErrorState } from "@/components/ui/error-state";
import { SavingsGoalsManager } from "@/components/finance/savings-goals-manager";

export const metadata = { title: "Metas — Financeiro Pessoal" };

export default async function MetasPage() {
  const supabase = await createClient();
  const { data: goals, error } = await supabase
    .from("savings_goals")
    .select("*")
    .order("status", { ascending: true })
    .order("created_at", { ascending: false });

  return (
    <div>
      <PageHeader title="Metas financeiras" description="Defina objetivos e acompanhe o quanto falta para alcançá-los." />

      {error ? <ErrorState description="Não foi possível carregar suas metas." /> : <SavingsGoalsManager goals={goals ?? []} />}
    </div>
  );
}
