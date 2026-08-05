import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { ErrorState } from "@/components/ui/error-state";
import { DebtsManager } from "@/components/finance/debts-manager";

export const metadata = { title: "Dívidas — Financeiro Pessoal" };

export default async function DividasPage() {
  const supabase = await createClient();

  const [{ data: debts, error: debtsError }, { data: debtPayments, error: paymentsError }] = await Promise.all([
    supabase.from("debts").select("*").order("status", { ascending: true }).order("created_at", { ascending: false }),
    supabase.from("debt_payments").select("debt_id"),
  ]);

  const error = debtsError || paymentsError;

  const paidInstallmentsByDebtId: Record<string, number> = {};
  for (const payment of debtPayments ?? []) {
    paidInstallmentsByDebtId[payment.debt_id] = (paidInstallmentsByDebtId[payment.debt_id] ?? 0) + 1;
  }

  return (
    <div>
      <PageHeader title="Dívidas" description="Acompanhe financiamentos, empréstimos, parcelas e o saldo devedor." />

      {error ? (
        <ErrorState description="Não foi possível carregar suas dívidas." />
      ) : (
        <DebtsManager debts={debts ?? []} paidInstallmentsByDebtId={paidInstallmentsByDebtId} />
      )}
    </div>
  );
}
