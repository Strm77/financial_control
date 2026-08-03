import { useMonth } from '../context/MonthContext'
import { formatCurrency, formatDate, isOverdue } from '../utils/format'
import './PaymentsList.css'

export function PaymentsList() {
  const { payments, selectedMonth, year, monthLabel } = useMonth()

  const filtered = payments
    .filter((payment) => {
      if (selectedMonth === 'all') return true
      const due = new Date(`${payment.dueDate}T00:00:00`)
      return due.getFullYear() === year && due.getMonth() + 1 === selectedMonth
    })
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))

  if (filtered.length === 0) {
    return (
      <div className="neo-panel dashboard-placeholder">
        <p className="dashboard-placeholder__title">Nenhum pagamento agendado</p>
        <p className="dashboard-placeholder__text">Não há pagamentos cadastrados para {monthLabel}.</p>
      </div>
    )
  }

  return (
    <div className="neo-panel payments-list">
      {filtered.map((payment) => {
        const overdue = isOverdue(payment.dueDate, payment.paid)
        const state = payment.paid ? 'paid' : overdue ? 'overdue' : 'pending'
        const badgeLabel = payment.paid ? 'Pago' : overdue ? 'Atrasado' : 'Pendente'

        return (
          <div key={payment.id} className={`payment-row payment-row--${state}`}>
            <div className="payment-row__info">
              <p className="payment-row__description">{payment.description}</p>
              <p className="payment-row__date">Vencimento: {formatDate(payment.dueDate)}</p>
            </div>
            <div className="payment-row__right">
              <span className="payment-row__amount">{formatCurrency(payment.amountCents)}</span>
              <span className={`payment-row__badge payment-row__badge--${state}`}>{badgeLabel}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
