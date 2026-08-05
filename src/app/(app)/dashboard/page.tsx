import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { MetricCard } from "@/components/ui/metric-card";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/error-state";
import { EmptyState } from "@/components/ui/empty-state";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Badge } from "@/components/ui/badge";
import { parseMonthParam, monthPeriodRange, monthPeriodToKey, type MonthPeriod } from "@/lib/finance/month";
import { computeRecurringPaymentMonthInfo } from "@/lib/finance/recurring";
import { nextDueDate } from "@/lib/finance/due-dates";
import { computeGoalProgress } from "@/lib/finance/goals";
import { centsToBRL } from "@/lib/formatters/currency";
import { formatDateBR, nowInSaoPaulo } from "@/lib/formatters/date";
import { Banknote, Landmark, Clock, CheckCircle2, AlertTriangle, TrendingDown, PiggyBank } from "lucide-react";

export const metadata = { title: "Dashboard — Financeiro Pessoal" };

interface DashboardPageProps {
  searchParams: Promise<{ mes?: string }>;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams;
  const period: MonthPeriod = parseMonthParam(params.mes);
  const selectedMonthKey = monthPeriodToKey(period);
  const { end: rangeEnd, start: monthStart } = monthPeriodRange(period);

  const supabase = await createClient();
  const now = nowInSaoPaulo();

  const [
    { data: recurringPayments, error: recurringError },
    { data: paymentRecords, error: recordsError },
    { data: debts, error: debtsError },
    { data: goals, error: goalsError },
    { data: incomes, error: incomesError },
  ] = await Promise.all([
    supabase.from("recurring_payments").select("*").neq("status", "finished"),
    supabase.from("payment_records").select("*").eq("reference_month", `${selectedMonthKey}-01`),
    supabase.from("debts").select("*").eq("status", "active"),
    supabase.from("savings_goals").select("*").in("status", ["active", "completed", "paused"]),
    supabase.from("incomes").select("amount_cents").eq("reference_month", `${selectedMonthKey}-01`),
  ]);

  const error = recurringError || recordsError || debtsError || goalsError || incomesError;

  if (error) {
    return (
      <div>
        <PageHeader title="Dashboard" description="Visão geral das suas finanças." />
        <ErrorState description="Não foi possível carregar os dados do dashboard." />
      </div>
    );
  }

  const recordsByPaymentId = new Map((paymentRecords ?? []).map((r) => [r.recurring_payment_id, r]));
  const monthApplicablePayments = (recurringPayments ?? []).filter(
    (p) => p.status === "active" && p.start_date <= rangeEnd && (!p.end_date || p.end_date >= monthStart)
  );

  const paymentItems = monthApplicablePayments.map((p) => {
    const record = recordsByPaymentId.get(p.id);
    const info = computeRecurringPaymentMonthInfo(
      p.due_day,
      period.year,
      period.month - 1,
      record?.status === "paid" ? "paid" : record?.status === "partial" ? "partial" : null,
      now
    );
    return { payment: p, record, info };
  });

  const pendingItems = paymentItems.filter((i) => i.info.status !== "paid");
  const pendingCount = pendingItems.length;
  const pendingTotalCents = pendingItems.reduce(
    (sum, i) => sum + (i.payment.amount_cents - (i.record?.amount_paid_cents ?? 0)),
    0
  );
  const paidTotalCents = paymentItems
    .filter((i) => i.info.status === "paid" || i.info.status === "partial")
    .reduce((sum, i) => sum + (i.record?.amount_paid_cents ?? 0), 0);
  const despesasTotaisCents = paidTotalCents + pendingTotalCents;

  const hasOverdue = paymentItems.some((i) => i.info.status === "overdue");
  const monthStatus: "devendo" | "em-dia" | "pago" =
    paymentItems.length === 0 ? "em-dia" : hasOverdue ? "devendo" : pendingCount === 0 ? "pago" : "em-dia";

  const STATUS_CONFIG = {
    devendo: {
      label: "Devendo",
      tone: "danger" as const,
      icon: AlertTriangle,
      hint: `${pendingCount} ${pendingCount === 1 ? "conta atrasada" : "contas atrasadas ou pendentes"}`,
    },
    "em-dia": {
      label: "Em dia",
      tone: "secondary" as const,
      icon: Clock,
      hint: pendingCount > 0 ? `${pendingCount} a vencer` : "Nada pendente",
    },
    pago: { label: "Pago", tone: "success" as const, icon: CheckCircle2, hint: "Tudo pago este mês" },
  };
  const statusInfo = STATUS_CONFIG[monthStatus];

  const upcomingDue = (recurringPayments ?? [])
    .filter((p) => p.status === "active")
    .map((p) => ({ payment: p, due: nextDueDate(p.due_day, now) }))
    .sort((a, b) => a.due.daysRemaining - b.due.daysRemaining)
    .slice(0, 6);

  const activeDebts = debts ?? [];
  const debtsTotalCents = activeDebts.reduce((sum, d) => sum + d.current_balance_cents, 0);

  const allGoals = goals ?? [];
  const goalsForProgress = allGoals.filter((g) => g.status !== "paused").slice(0, 4);
  const primaryGoal = goalsForProgress[0];
  const primaryGoalProgress = primaryGoal
    ? computeGoalProgress(primaryGoal.current_amount_cents, primaryGoal.target_amount_cents)
    : null;

  const incomeTotalCents = (incomes ?? []).reduce((sum, i) => sum + i.amount_cents, 0);

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="Visão geral das suas finanças no período selecionado." />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Linha 1 */}
        <MetricCard label="Renda do mês" value={centsToBRL(incomeTotalCents)} tone="secondary" icon={Banknote} />
        <MetricCard
          label="Dívidas em aberto"
          value={centsToBRL(debtsTotalCents)}
          tone="primary"
          icon={Landmark}
          hint={`${activeDebts.length} ${activeDebts.length === 1 ? "dívida" : "dívidas"}`}
        />
        <MetricCard
          label="Status do mês"
          value={statusInfo.label}
          tone={statusInfo.tone}
          icon={statusInfo.icon}
          hint={statusInfo.hint}
        />

        {/* Linha 2 */}
        <MetricCard label="Despesas totais" value={centsToBRL(despesasTotaisCents)} tone="danger" icon={TrendingDown} />
        <MetricCard
          label="Contas pendentes"
          value={centsToBRL(pendingTotalCents)}
          tone="warning"
          icon={Clock}
          hint={`${pendingCount} ${pendingCount === 1 ? "conta" : "contas"}`}
        />
        <MetricCard label="Já foi pago" value={centsToBRL(paidTotalCents)} tone="success" icon={CheckCircle2} />

        {/* Linha 3 */}
        <Card className="sm:col-span-2">
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
                <li
                  key={payment.id}
                  className="flex items-center justify-between gap-3 neu-surface neu-rounded px-3 py-2.5 bg-background-alt"
                >
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{payment.description}</p>
                    <p className="text-xs text-muted-foreground">{formatDateBR(due.dueDate)}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {due.urgency === "overdue" && (
                      <Badge variant="danger">
                        <AlertTriangle className="size-3" aria-hidden="true" />
                        Atrasado
                      </Badge>
                    )}
                    {due.urgency === "today" && <Badge variant="warning">Hoje</Badge>}
                    <span className="font-bold tabular-nums">{centsToBRL(payment.amount_cents)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{primaryGoal?.name ?? "Meta 01"}</CardTitle>
            <Link href="/metas" className="text-sm font-semibold underline underline-offset-2 hover:no-underline">
              Ver metas
            </Link>
          </CardHeader>
          {primaryGoal && primaryGoalProgress ? (
            <div>
              <p className="text-2xl font-bold font-display tabular-nums mb-2">
                {centsToBRL(primaryGoal.current_amount_cents)}
              </p>
              <ProgressBar
                percent={primaryGoalProgress.percent}
                variant={primaryGoal.status === "completed" ? "success" : "secondary"}
              />
              <p className="text-xs text-muted-foreground mt-1.5">
                {primaryGoalProgress.percent.toFixed(0)}% de {centsToBRL(primaryGoal.target_amount_cents)}
              </p>
            </div>
          ) : (
            <EmptyState icon={PiggyBank} title="Nenhuma meta" description="Crie uma meta para acompanhar aqui." />
          )}
        </Card>

        {/* Linha 4 */}
        <Card className="sm:col-span-2 lg:col-span-3">
          <CardHeader>
            <CardTitle>Progresso das metas</CardTitle>
            <Link href="/metas" className="text-sm font-semibold underline underline-offset-2 hover:no-underline">
              Ver todas
            </Link>
          </CardHeader>
          {goalsForProgress.length === 0 ? (
            <EmptyState title="Nenhuma meta cadastrada" description="Crie metas financeiras para acompanhar seu progresso aqui." />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {goalsForProgress.map((goal) => {
                const progress = computeGoalProgress(goal.current_amount_cents, goal.target_amount_cents);
                return (
                  <div key={goal.id} className="neu-surface neu-rounded p-3.5 bg-background-alt">
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
    </div>
  );
}
