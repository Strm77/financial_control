import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useAuth } from './AuthContext'
import { fetchPayments, type Payment } from '../api/paymentsApi'

export const MONTH_NAMES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
]

export type MonthStatus = 'gray' | 'red' | 'yellow' | 'green'
export type SelectedMonth = number | 'all'

interface MonthContextValue {
  year: number
  currentMonth: number
  selectedMonth: SelectedMonth
  setSelectedMonth: (month: SelectedMonth) => void
  getMonthStatus: (month: number) => MonthStatus
  monthLabel: string
  payments: Payment[]
}

const MonthContext = createContext<MonthContextValue | undefined>(undefined)

function paymentsDueInMonth(payments: Payment[], year: number, month: number): Payment[] {
  return payments.filter((payment) => {
    const due = new Date(`${payment.dueDate}T00:00:00`)
    return due.getFullYear() === year && due.getMonth() + 1 === month
  })
}

function computePaymentStatus(payments: Payment[], year: number, month: number): MonthStatus {
  const monthPayments = paymentsDueInMonth(payments, year, month)
  if (monthPayments.length === 0) return 'green'

  const hasOverdue = monthPayments.some((payment) => payment.status === 'atrasado')
  if (hasOverdue) return 'red'

  const hasPending = monthPayments.some((payment) => payment.status === 'pendente' || payment.status === 'parcial')
  return hasPending ? 'yellow' : 'green'
}

export function MonthProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth()
  const [payments, setPayments] = useState<Payment[]>([])

  const now = useMemo(() => new Date(), [])
  const year = now.getFullYear()
  const currentMonth = now.getMonth() + 1

  const [selectedMonth, setSelectedMonth] = useState<SelectedMonth>(currentMonth)

  useEffect(() => {
    if (!token) return
    let cancelled = false

    fetchPayments(token)
      .then((data) => {
        if (!cancelled) setPayments(data)
      })
      .catch(() => {
        if (!cancelled) setPayments([])
      })

    return () => {
      cancelled = true
    }
  }, [token])

  const getMonthStatus = (month: number): MonthStatus => {
    if (month < currentMonth) return 'gray'
    return computePaymentStatus(payments, year, month)
  }

  const monthLabel =
    selectedMonth === 'all' ? 'todos os meses' : `${MONTH_NAMES[selectedMonth - 1]} de ${year}`

  const value: MonthContextValue = {
    year,
    currentMonth,
    selectedMonth,
    setSelectedMonth,
    getMonthStatus,
    monthLabel,
    payments,
  }

  return <MonthContext.Provider value={value}>{children}</MonthContext.Provider>
}

export function useMonth(): MonthContextValue {
  const context = useContext(MonthContext)
  if (!context) {
    throw new Error('useMonth deve ser usado dentro de um MonthProvider')
  }
  return context
}
