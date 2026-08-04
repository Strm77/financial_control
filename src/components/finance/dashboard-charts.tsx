"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { centsToBRL } from "@/lib/formatters/currency";
import { formatMonthYearBR } from "@/lib/formatters/date";
import { CATEGORY_COLORS } from "@/lib/validations/category";

export interface MonthlyChartPoint {
  monthKey: string;
  incomeCents: number;
  expenseCents: number;
}

export interface CategoryChartSlice {
  name: string;
  color: string;
  totalCents: number;
}

const TOOLTIP_STYLE = {
  border: "3px solid var(--border)",
  borderRadius: "6px",
  background: "var(--card)",
  color: "var(--card-foreground)",
  boxShadow: "5px 5px 0 0 var(--shadow-color)",
  fontFamily: "var(--font-body)",
  fontSize: "13px",
};

export function IncomeExpenseBarChart({ data }: { data: MonthlyChartPoint[] }) {
  const chartData = data.map((d) => ({
    label: formatMonthYearBR(`${d.monthKey}-01`).split(" de ")[0].slice(0, 3),
    Receitas: d.incomeCents / 100,
    Despesas: d.expenseCents / 100,
  }));

  const hasData = data.some((d) => d.incomeCents > 0 || d.expenseCents > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Receitas x despesas (6 meses)</CardTitle>
      </CardHeader>
      {!hasData ? (
        <EmptyState title="Sem dados suficientes" description="Cadastre transações para ver o comparativo mensal." />
      ) : (
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barGap={4} margin={{ left: -12 }}>
              <CartesianGrid strokeDasharray="4 4" stroke="var(--border)" opacity={0.25} vertical={false} />
              <XAxis dataKey="label" stroke="var(--foreground)" tick={{ fontSize: 12, fontFamily: "var(--font-body)" }} className="capitalize" />
              <YAxis
                stroke="var(--foreground)"
                tick={{ fontSize: 11, fontFamily: "var(--font-body)" }}
                tickFormatter={(v) => `R$${Math.round(Number(v) / 1000)}k`}
                width={48}
              />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                formatter={(value) => centsToBRL(Math.round(Number(value) * 100))}
                cursor={{ fill: "var(--muted)" }}
              />
              <Legend wrapperStyle={{ fontSize: 12, fontFamily: "var(--font-body)" }} />
              <Bar dataKey="Receitas" fill="var(--success)" stroke="var(--border)" strokeWidth={2} radius={[3, 3, 0, 0]} />
              <Bar dataKey="Despesas" fill="var(--danger)" stroke="var(--border)" strokeWidth={2} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}

export function ExpensesByCategoryChart({ data }: { data: CategoryChartSlice[] }) {
  const hasData = data.length > 0;
  const chartData = data.map((d, i) => ({
    name: d.name,
    value: d.totalCents / 100,
    color: d.color || CATEGORY_COLORS[i % CATEGORY_COLORS.length],
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Despesas por categoria</CardTitle>
      </CardHeader>
      {!hasData ? (
        <EmptyState title="Nenhuma despesa no período" description="Registre despesas para ver a distribuição por categoria." />
      ) : (
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={chartData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2} stroke="var(--border)" strokeWidth={2}>
                {chartData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value) => centsToBRL(Math.round(Number(value) * 100))} />
              <Legend wrapperStyle={{ fontSize: 12, fontFamily: "var(--font-body)" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}
