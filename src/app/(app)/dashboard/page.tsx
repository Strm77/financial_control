import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { MetricCard } from "@/components/ui/metric-card";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/error-state";
import { EmptyState } from "@/components/ui/empty-state";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Badge } from "@/components/ui/badge";
import { CategoryBadge } from "@/components/finance/category-badge";
import { IncomeExpenseBarChart, ExpensesByCategoryChart } from "@/components/finance/dashboard-charts";
import { parseMonthParam, monthPeriodRange, monthPeriodToKey, type MonthPeriod } from "@/lib/finance/month";
import { aggregateMonthlyTotals, aggregateByCategory, lastMonthKeys } from "@/lib/finance/aggregate";
import { computeRecurringPaymentMonthInfo } from "@/lib/finance/recurring";
import { nextDueDate } from "@/lib/finance/due-dates";
import { computeGoalProgress } from "@/lib/finance/goals";
import { centsToBRL } from "@/lib/formatters/currency";
import { formatDateBR, nowInSaoPaulo } from "@/lib/formatters/date";
import {
  Wallet,
  Banknote,
  TrendingUp,
  TrendingDown,
  Clock,
  Landmark,
  PiggyBank,
  ArrowUpCircle,
  ArrowDownCircle,
  AlertTriangle,
} from "lucide-react";
import type { Category, Transaction } from "@/types/entities";

export const metadata = { title: "Dashboard — Financeiro Pessoal" };

interface DashboardPageProps {
  searchParams: Promise<{ mes?: string }>;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams;
  const period: MonthPeriod = parseMonthParam(params.mes);
  const selectedMonthKey = monthPeriodToKey(period);
  const sixMonthKeys = lastMonthKeys(new Date(period.year, period.month - 1, 1), 6);
  const rangeStart = `${sixMonthKeys[0]}-01`;
  const { end: rangeEnd, start: monthStart } = monthPeriodRange(period);

  const supabase = await createClient();
  const now = nowInSaoPaulo();

  const [
    { data: categories, error: categoriesError },
    { data: rangeTransactions, error: transactionsError },
    { data: recurringPayments, error: recurringError },
    { data: paymentRecords, error: recordsError },
    { data: debts, error: debtsError },
    { data: goals, error: goalsError },
    { data: incomes, error: incomesError },
  ] = await Promise.all([
    supabase.from("categories").select("*"),
    supabase
      .from("transactions")
      .select("*")
      .gte("transaction_date", rangeStart)
      .lte("transaction_date", rangeEnd)
      .order("transaction_date", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase.from("recurring_payments").select("*").neq("status", "finished"),
    supabase.from("payment_records").select("*").eq("reference_month", `${selectedMonthKey}-01`),
    supabase.from("debts").select("*").eq("status", "active"),
    supabase.from("savings_goals").select("*").in("status", ["active", "completed", "paused"]),
    supabase.from("incomes").select("amount_cents").eq("reference_month", `${selectedMonthKey}-01`),
  ]);

  const error = categoriesError || transactionsError || recurringError || recordsError || debtsError || goalsError || incomesError;

  if (error) {
    return (
      <div>
        <PageHeader title="Dashboard" description="Visão geral das suas finanças." />
        <ErrorState description="Não foi possível carregar os dados do dashboard." />
      </div>
    );
  }

  const categoriesById = new Map<string, Category>((categories ?? []).map((c: Category) => [c.id, c]));
  const allTransactions: Transaction[] = rangeTransactions ?? [];
  const monthlyTotalsMap = aggregateMonthlyTotals(allTransactions);
  const selectedTotals = monthlyTotalsMap.get(selectedMonthKey) ?? { incomeCents: 0, expenseCents: 0, balanceCents: 0 };

  const chartData = sixMonthKeys.map((key) => {
    const totals = monthlyTotalsMap.get(key);
    return { monthKey: key, incomeCents: totals?.incomeCents ?? 0, expenseCents: totals?.expenseCents ?? 0 };
  });

  const monthTransactions = allTransactions.filter((t) => t.transaction_date.slice(0, 7) === selectedMonthKey);
  const recentTransactions = monthTransactions.slice(0, 6);

  const categoryTotals = aggregateByCategory(monthTransactions.filter((t) => t.type === "expense"));
  const categorySlices = categoryTotals.slice(0, 8).map((c) => {
    const category = c.categoryId ? categoriesById.get(c.categoryId) : undefined;
    return { name: category?.name ?? "Sem categoria", color: category?.color ?? "#9ca3af", totalCents: c.totalCents };
  });

  const recordsByPaymentId = new Map((paymentRecords ?? []).map((r) => [r.recurring_payment_id, r]));
  const monthApplicablePayments = (recurringPayments ?? []).filter(
    (p) => p.status === "active" && p.start_date <= rangeEnd && (!p.end_date || p.end_date >= monthStart)
  );
  const pendingItems = monthApplicablePayments
    .map((p) => {
      const record = recordsByPaymentId.get(p.id);
      const info = computeRecurringPaymentMonthInfo(
        p.due_day,
        period.year,
        period.month - 1,
        record?.status === "paid" ? "paid" : record?.status === "partial" ? "partial" : null,
        now
      );
      return { payment: p, record, info };
    })
    .filter((i) => i.info.status !== "paid");
  const pendingCount = pendingItems.length;
  const pendingTotalCents = pendingItems.reduce(
    (sum, i) => sum + (i.payment.amount_cents - (i.record?.amount_paid_cents ?? 0)),
    0
  );

  const upcomingDue = (recurringPayments ?? [])
    .filter((p) => p.status === "active")
    .map((p) => ({ payment: p, due: nextDueDate(p.due_day, now) }))
    .sort((a, b) => a.due.daysRemaining - b.due.daysRemaining)
    .slice(0, 5);

  const activeDebts = debts ?? [];
  const debtsTotalCents = activeDebts.reduce((sum, d) => sum + d.current_balance_cents, 0);

  const allGoals = goals ?? [];
  const savingsTotalCents = allGoals.reduce((sum, g) => sum + g.current_amount_cents, 0);
  const goalsForProgress = allGoals.filter((g) => g.status !== "paused").slice(0, 4);

  const incomeTotalCents = (incomes ?? []).reduce((sum, i) => sum + i.amount_cents, 0);

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="Visão geral das suas finanças no período selecionado." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard label="Saldo do mês" value={centsToBRL(selectedTotals.balanceCents)} tone="primary" icon={Wallet} />
        <MetricCard label="Renda do mês" value={centsToBRL(incomeTotalCents)} tone="secondary" icon={Banknote} />
        <MetricCard label="Receitas" value={centsToBRL(selectedTotals.incomeCents)} tone="success" icon={TrendingUp} />
        <MetricCard label="Despesas" value={centsToBRL(selectedTotals.expenseCents)} tone="danger" icon={TrendingDown} />
        <MetricCard
          label="Contas pendentes"
          value={centsToBRL(pendingTotalCents)}
          tone="warning"
          icon={Clock}
          hint={`${pendingCount} ${pendingCount === 1 ? "conta" : "contas"}`}
        />
        <MetricCard
          label="Dívidas em aberto"
          value={centsToBRL(debtsTotalCents)}
          tone="secondary"
          icon={Landmark}
          hint={`${activeDebts.length} ${activeDebts.length === 1 ? "dívida" : "dívidas"}`}
        />
        <MetricCard label="Guardado em metas" value={centsToBRL(savingsTotalCents)} tone="neutral" icon={PiggyBank} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <IncomeExpenseBarChart data={chartData} />
        <ExpensesByCategoryChart data={categorySlices} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Últimas transações</CardTitle>
            <Link href="/transacoes" className="text-sm font-semibold underline underline-offset-2 hover:no-underline">
              Ver todas
            </Link>
          </CardHeader>
          {recentTransactions.length === 0 ? (
            <EmptyState title="Nenhuma transação no período" description="Cadastre transações para ver o resumo aqui." />
          ) : (
            <ul className="space-y-2">
              {recentTransactions.map((t) => {
                const category = t.category_id ? categoriesById.get(t.category_id) : undefined;
                return (
                  <li key={t.id} className="flex items-center justify-between gap-3 border-brutal rounded-brutal px-3 py-2.5 bg-background-alt">
                    <div className="min-w-0 flex items-center gap-2">
                      {t.type === "income" ? (
                        <ArrowUpCircle className="size-4 text-success shrink-0" aria-hidden="true" />
                      ) : (
                        <ArrowDownCircle className="size-4 text-danger shrink-0" aria-hidden="true" />
                      )}
                      <div className="min-w-0">
                        <p className="font-semibold truncate">{t.description}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-xs text-muted-foreground">{formatDateBR(t.transaction_date)}</p>
                          <CategoryBadge name={category?.name ?? null} color={category?.color} icon={category?.icon} />
                        </div>
                      </div>
                    </div>
                    <span className={`font-bold tabular-nums shrink-0 ${t.type === "income" ? "text-success" : "text-danger"}`}>
                      {t.type === "income" ? "+" : "-"} {centsToBRL(t.amount_cents)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Próximos vencimentos</CardTitle>
            <Link href="/pagamentos" className="text-sm font-semibold underline underline-offset-2 hover:no-underline">
              Ver todos
            </Link>
          </CardHeader>
          {upcomingDue.length === 0 ? (
            <EmptyState title="Nenhuma cobrança ativa" description="Cadastre cobranças recorrentes para ver os próximos vencimentos." />
          ) : (
            <ul className="space-y-2">
              {upcomingDue.map(({ payment, due }) => (
                <li key={payment.id} className="flex items-center justify-between gap-3 border-brutal rounded-brutal px-3 py-2.5 bg-background-alt">
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{payment.description}</p>
                    <p className="text-xs text-muted-foreground">{formatDateBR(due.dueDate)}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {due.urgency === "overdue" && <Badge variant="danger"><AlertTriangle className="size-3" aria-hidden="true" />Atrasado</Badge>}
                    {due.urgency === "today" && <Badge variant="warning">Hoje</Badge>}
                    <span className="font-bold tabular-nums">{centsToBRL(payment.amount_cents)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Progresso das metas</CardTitle>
          <Link href="/metas" className="text-sm font-semibold underline underline-offset-2 hover:no-underline">
            Ver todas
          </Link>
        </CardHeader>
        {goalsForProgress.length === 0 ? (
          <EmptyState title="Nenhuma meta cadastrada" description="Crie metas financeiras para acompanhar seu progresso aqui." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {goalsForProgress.map((goal) => {
              const progress = computeGoalProgress(goal.current_amount_cents, goal.target_amount_cents);
              return (
                <div key={goal.id} className="border-brutal rounded-brutal p-3.5 bg-background-alt">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-semibold truncate">{goal.name}</span>
                    <span className="text-sm font-bold shrink-0">{progress.percent.toFixed(0)}%</span>
                  </div>
                  <ProgressBar percent={progress.percent} variant={goal.status === "completed" ? "success" : "secondary"} />
                  <p className="text-xs text-muted-foreground mt-1.5">
                    {centsToBRL(goal.current_amount_cents)} de {centsToBRL(goal.target_amount_cents)}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
