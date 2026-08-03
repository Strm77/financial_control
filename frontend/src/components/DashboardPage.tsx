import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useMonth, MONTH_NAMES } from '../context/MonthContext'
import { fetchIncomes, type Income } from '../api/incomesApi'
import { fetchDebts, type Debt } from '../api/debtsApi'
import { fetchAllCardExpenses, type CardExpense } from '../api/cardExpensesApi'
import type { PaymentStatus } from '../api/paymentsApi'
import { CATEGORIA_OPTIONS, STATUS_LABEL } from './PaymentsTable'
import { CARD_CATEGORIES } from './GastoMesPage'
import { getVisibleDebts } from '../utils/debts'
import { formatCurrency, formatDate } from '../utils/format'
import { BarChart, type BarChartDatum, type BarChartSeries } from './charts/BarChart'
import { DonutChart, type DonutChartSlice } from './charts/DonutChart'
import './DashboardPage.css'

const CATEGORIA_COLORS: Record<string, string> = {
  Cartão: 'var(--accent-blue)',
  'Cartão de Loja': 'var(--accent-pink)',
  Boleto: 'var(--accent-amber)',
  Conta: 'var(--accent-green)',
  Assinatura: 'var(--brand)',
  Outros: 'var(--muted)',
}

const STATUS_ORDER: PaymentStatus[] = ['pago', 'parcial', 'pendente', 'atrasado']

export function DashboardPage() {
  const { token } = useAuth()
  const { selectedMonth, year, monthLabel, payments } = useMonth()

  const [incomes, setIncomes] = useState<Income[]>([])
  const [debts, setDebts] = useState<Debt[]>([])
  const [cardExpenses, setCardExpenses] = useState<CardExpense[]>([])

  useEffect(() => {
    if (!token) return
    let cancelled = false
    Promise.all([fetchIncomes(token), fetchDebts(token), fetchAllCardExpenses(token)]).then(
      ([incomesData, debtsData, expensesData]) => {
        if (cancelled) return
        setIncomes(incomesData)
        setDebts(debtsData)
        setCardExpenses(expensesData)
      },
    )
    return () => {
      cancelled = true
    }
  }, [token])

  const filteredIncomes = incomes.filter((income) => {
    if (selectedMonth === 'all') return true
    const received = new Date(`${income.receivedDate}T00:00:00`)
    return received.getFullYear() === year && received.getMonth() + 1 === selectedMonth
  })

  const filteredPayments = payments
    .filter((payment) => {
      if (selectedMonth === 'all') return true
      const due = new Date(`${payment.dueDate}T00:00:00`)
      return due.getFullYear() === year && due.getMonth() + 1 === selectedMonth
    })
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))

  const visibleDebts = getVisibleDebts(debts, selectedMonth, year)
  const cardPayments = filteredPayments.filter((payment) => CARD_CATEGORIES.includes(payment.categoria))

  function expensesFor(paymentId: number): CardExpense[] {
    return cardExpenses.filter((expense) => expense.paymentId === paymentId)
  }

  const totalRendaCents = filteredIncomes.reduce((sum, income) => sum + income.amountCents, 0)
  const totalPagamentosCents = filteredPayments.reduce((sum, payment) => sum + payment.valorCents, 0)
  const totalPagoCents = filteredPayments.reduce((sum, payment) => sum + payment.valorPagoCents, 0)
  const totalPendenteCents = Math.max(0, totalPagamentosCents - totalPagoCents)
  const saldoCents = totalRendaCents - totalPagamentosCents
  const totalDividasFaltaCents = visibleDebts.reduce((sum, { debt }) => sum + debt.faltaPagarCents, 0)
  const totalDividasPagoCents = visibleDebts.reduce((sum, { debt }) => sum + debt.valorPagoCents, 0)
  const totalGastoCartoesCents = cardPayments.reduce(
    (sum, payment) => sum + expensesFor(payment.id).reduce((s, expense) => s + expense.valorCents, 0),
    0,
  )

  const statusCounts: Record<PaymentStatus, number> = { pago: 0, atrasado: 0, parcial: 0, pendente: 0 }
  filteredPayments.forEach((payment) => {
    statusCounts[payment.status] += 1
  })

  const monthlyData: BarChartDatum[] = MONTH_NAMES.map((name, index) => {
    const month = index + 1
    const rendaMes = incomes
      .filter((income) => {
        const d = new Date(`${income.receivedDate}T00:00:00`)
        return d.getFullYear() === year && d.getMonth() + 1 === month
      })
      .reduce((sum, income) => sum + income.amountCents, 0)
    const pagamentosMes = payments
      .filter((payment) => {
        const d = new Date(`${payment.dueDate}T00:00:00`)
        return d.getFullYear() === year && d.getMonth() + 1 === month
      })
      .reduce((sum, payment) => sum + payment.valorCents, 0)
    return { label: name.slice(0, 3), values: { renda: rendaMes, pagamentos: pagamentosMes } }
  })

  const barSeries: BarChartSeries[] = [
    { key: 'renda', label: 'Renda', color: 'var(--accent-green)' },
    { key: 'pagamentos', label: 'Pagamentos', color: 'var(--accent-pink)' },
  ]

  const categoriaSlices: DonutChartSlice[] = CATEGORIA_OPTIONS.map((categoria) => ({
    key: categoria,
    label: categoria,
    value: filteredPayments
      .filter((payment) => payment.categoria === categoria)
      .reduce((sum, payment) => sum + payment.valorCents, 0),
    color: CATEGORIA_COLORS[categoria] ?? 'var(--muted)',
  }))

  const debtSlices: DonutChartSlice[] = [
    { key: 'pago', label: 'Pago', value: totalDividasPagoCents, color: 'var(--accent-green)' },
    { key: 'falta', label: 'Falta pagar', value: totalDividasFaltaCents, color: 'var(--accent-red)' },
  ]

  const topIncomes = [...filteredIncomes].sort((a, b) => b.receivedDate.localeCompare(a.receivedDate)).slice(0, 5)
  const topDebts = visibleDebts.slice(0, 5)
  const topPayments = filteredPayments.slice(0, 5)

  return (
    <div className="dashboard-page">
      <p className="dashboard-page__subtitle">Visão consolidada de {monthLabel}.</p>

      <div className="dashboard-kpis">
        <div className="neo-panel dashboard-kpi" style={{ borderLeftColor: 'var(--accent-green)' }}>
          <span className="dashboard-kpi__label">Renda</span>
          <span className="dashboard-kpi__value mono">{formatCurrency(totalRendaCents)}</span>
          <span className="dashboard-kpi__meta">{filteredIncomes.length} lançamento(s)</span>
        </div>
        <div className="neo-panel dashboard-kpi" style={{ borderLeftColor: 'var(--accent-pink)' }}>
          <span className="dashboard-kpi__label">Pagamentos</span>
          <span className="dashboard-kpi__value mono">{formatCurrency(totalPagamentosCents)}</span>
          <span className="dashboard-kpi__meta">
            {formatCurrency(totalPagoCents)} pago · {formatCurrency(totalPendenteCents)} em aberto
          </span>
        </div>
        <div className="neo-panel dashboard-kpi" style={{ borderLeftColor: saldoCents >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
          <span className="dashboard-kpi__label">Saldo do período</span>
          <span className="dashboard-kpi__value mono">{formatCurrency(saldoCents)}</span>
          <span className="dashboard-kpi__meta">Renda − Pagamentos</span>
        </div>
        <div className="neo-panel dashboard-kpi" style={{ borderLeftColor: 'var(--accent-red)' }}>
          <span className="dashboard-kpi__label">Dívidas em aberto</span>
          <span className="dashboard-kpi__value mono">{formatCurrency(totalDividasFaltaCents)}</span>
          <span className="dashboard-kpi__meta">{visibleDebts.length} dívida(s) ativa(s)</span>
        </div>
        <div className="neo-panel dashboard-kpi" style={{ borderLeftColor: 'var(--accent-blue)' }}>
          <span className="dashboard-kpi__label">Gasto em cartões</span>
          <span className="dashboard-kpi__value mono">{formatCurrency(totalGastoCartoesCents)}</span>
          <span className="dashboard-kpi__meta">{cardPayments.length} cartão(ões) no período</span>
        </div>
      </div>

      <div className="dashboard-charts">
        <div className="neo-panel dashboard-chart-card">
          <div>
            <h3>Renda vs. Pagamentos</h3>
            <p className="dashboard-chart-card__meta">Visão anual de {year}, por mês de vencimento/recebimento.</p>
          </div>
          <BarChart series={barSeries} data={monthlyData} formatValue={formatCurrency} />
        </div>
        <div className="neo-panel dashboard-chart-card">
          <div>
            <h3>Pagamentos por categoria</h3>
            <p className="dashboard-chart-card__meta">{monthLabel}</p>
          </div>
          <DonutChart slices={categoriaSlices} formatValue={formatCurrency} />
        </div>
        <div className="neo-panel dashboard-chart-card">
          <div>
            <h3>Dívidas: pago vs. falta</h3>
            <p className="dashboard-chart-card__meta">{monthLabel}</p>
          </div>
          <DonutChart slices={debtSlices} formatValue={formatCurrency} emptyLabel="Nenhuma dívida no período" />
        </div>
      </div>

      <div className="dashboard-summaries">
        <div className="neo-panel dashboard-summary">
          <div className="dashboard-summary__header">
            <div>
              <h3 className="dashboard-summary__title">Renda</h3>
              <span className="dashboard-summary__hint">Resumo — edite em Renda</span>
            </div>
            <span className="dashboard-summary__total mono">{formatCurrency(totalRendaCents)}</span>
          </div>
          {topIncomes.length === 0 ? (
            <p className="dashboard-summary__empty">Nenhuma renda cadastrada em {monthLabel}.</p>
          ) : (
            <>
              <ul className="dashboard-mini-list">
                {topIncomes.map((income) => (
                  <li key={income.id}>
                    <div>
                      <p className="dashboard-mini-list__desc">{income.fonte}</p>
                      <span className="dashboard-mini-list__meta">
                        {income.categoria} · {formatDate(income.receivedDate)}
                      </span>
                    </div>
                    <span className="dashboard-mini-list__value mono">{formatCurrency(income.amountCents)}</span>
                  </li>
                ))}
              </ul>
              {filteredIncomes.length > topIncomes.length && (
                <p className="dashboard-summary__more">+{filteredIncomes.length - topIncomes.length} outro(s) lançamento(s)</p>
              )}
            </>
          )}
        </div>

        <div className="neo-panel dashboard-summary">
          <div className="dashboard-summary__header">
            <div>
              <h3 className="dashboard-summary__title">Dívidas</h3>
              <span className="dashboard-summary__hint">Resumo — edite em Dívidas</span>
            </div>
            <span className="dashboard-summary__total mono">{formatCurrency(totalDividasFaltaCents)}</span>
          </div>
          {topDebts.length === 0 ? (
            <p className="dashboard-summary__empty">Nenhuma dívida ativa em {monthLabel}.</p>
          ) : (
            <>
              <ul className="dashboard-mini-list dashboard-mini-list--debts">
                {topDebts.map(({ debt, projectedDueDate }) => {
                  const progress = debt.numeroParcelas > 0 ? (debt.parcelaAtual / debt.numeroParcelas) * 100 : 0
                  return (
                    <li key={debt.id}>
                      <div className="dashboard-mini-list__debt-row">
                        <div>
                          <p className="dashboard-mini-list__desc">
                            {debt.credor}
                            {debt.recorrente && <span className="debts-recurring-tag">↻ Recorrente</span>}
                          </p>
                          <span className="dashboard-mini-list__meta">Vencimento {formatDate(projectedDueDate)}</span>
                        </div>
                        <span className="dashboard-mini-list__value mono">{formatCurrency(debt.faltaPagarCents)}</span>
                      </div>
                      <div className="debts-progress">
                        <span className="debts-progress__label">
                          {debt.parcelaAtual}/{debt.numeroParcelas}
                        </span>
                        <div className="debts-progress__bar">
                          <div className="debts-progress__fill" style={{ width: `${progress}%` }} />
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
              {visibleDebts.length > topDebts.length && (
                <p className="dashboard-summary__more">+{visibleDebts.length - topDebts.length} outra(s) dívida(s)</p>
              )}
            </>
          )}
        </div>

        <div className="neo-panel dashboard-summary">
          <div className="dashboard-summary__header">
            <div>
              <h3 className="dashboard-summary__title">Pagamentos Mês</h3>
              <span className="dashboard-summary__hint">Resumo — edite em Pagamentos Mês</span>
            </div>
            <span className="dashboard-summary__total mono">{formatCurrency(totalPagamentosCents)}</span>
          </div>
          <div className="dashboard-status-row">
            {STATUS_ORDER.map((status) => (
              <span key={status} className={`payments-status payments-status--${status}`}>
                {STATUS_LABEL[status]} · {statusCounts[status]}
              </span>
            ))}
          </div>
          {topPayments.length === 0 ? (
            <p className="dashboard-summary__empty">Nenhum pagamento cadastrado em {monthLabel}.</p>
          ) : (
            <>
              <ul className="dashboard-mini-list">
                {topPayments.map((payment) => (
                  <li key={payment.id}>
                    <div>
                      <p className="dashboard-mini-list__desc">{payment.descricao}</p>
                      <span className="dashboard-mini-list__meta">
                        {payment.categoria} · vence {formatDate(payment.dueDate)}
                      </span>
                    </div>
                    <div className="dashboard-mini-list__end">
                      <span className={`payments-status payments-status--${payment.status}`}>
                        {STATUS_LABEL[payment.status]}
                      </span>
                      <span className="dashboard-mini-list__value mono">{formatCurrency(payment.valorCents)}</span>
                    </div>
                  </li>
                ))}
              </ul>
              {filteredPayments.length > topPayments.length && (
                <p className="dashboard-summary__more">+{filteredPayments.length - topPayments.length} outro(s) pagamento(s)</p>
              )}
            </>
          )}
        </div>

        <div className="neo-panel dashboard-summary">
          <div className="dashboard-summary__header">
            <div>
              <h3 className="dashboard-summary__title">Gasto Mês</h3>
              <span className="dashboard-summary__hint">Resumo — edite em Gasto Mês</span>
            </div>
            <span className="dashboard-summary__total mono">{formatCurrency(totalGastoCartoesCents)}</span>
          </div>
          {cardPayments.length === 0 ? (
            <p className="dashboard-summary__empty">Nenhum cartão com gastos em {monthLabel}.</p>
          ) : (
            <ul className="dashboard-card-list">
              {cardPayments.map((payment) => {
                const items = expensesFor(payment.id)
                const total = items.reduce((sum, expense) => sum + expense.valorCents, 0)
                return (
                  <li key={payment.id} className="dashboard-card-row">
                    <div>
                      <p className="dashboard-mini-list__desc">{payment.descricao}</p>
                      <span className="payments-tag">{payment.categoria}</span>
                      <span className="dashboard-mini-list__meta"> · {items.length} gasto(s)</span>
                    </div>
                    <span className="dashboard-mini-list__value mono">{formatCurrency(total)}</span>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
