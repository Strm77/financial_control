import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useMonth } from '../context/MonthContext'
import { fetchPayments, type Payment } from '../api/paymentsApi'
import { CardExpensePanel } from './CardExpensePanel'
import './GastoMesPage.css'

const CARD_CATEGORIES = ['Cartão', 'Cartão de Loja']

export function GastoMesPage() {
  const { token } = useAuth()
  const { selectedMonth, year, monthLabel } = useMonth()
  const [payments, setPayments] = useState<Payment[]>([])

  useEffect(() => {
    if (!token) return
    let cancelled = false
    fetchPayments(token).then((data) => {
      if (!cancelled) setPayments(data)
    })
    return () => {
      cancelled = true
    }
  }, [token])

  const cardPayments = payments.filter((payment) => {
    if (!CARD_CATEGORIES.includes(payment.categoria)) return false
    if (selectedMonth === 'all') return true
    const due = new Date(`${payment.dueDate}T00:00:00`)
    return due.getFullYear() === year && due.getMonth() + 1 === selectedMonth
  })

  if (cardPayments.length === 0) {
    return (
      <div className="neo-panel dashboard-placeholder">
        <p className="dashboard-placeholder__title">Nenhum cartão encontrado</p>
        <p className="dashboard-placeholder__text">
          Cadastre um pagamento com categoria "Cartão" ou "Cartão de Loja" em Pagamentos Mês para {monthLabel} — ele
          aparecerá aqui como um quadro para lançar os gastos.
        </p>
      </div>
    )
  }

  return (
    <div className="gasto-mes-page">
      {cardPayments.map((payment) => (
        <CardExpensePanel key={payment.id} payment={payment} />
      ))}
    </div>
  )
}
