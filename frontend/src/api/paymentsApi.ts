import { parseError } from './client'

export type PaymentStatus = 'pago' | 'atrasado' | 'parcial' | 'pendente'

export interface Payment {
  id: number
  descricao: string
  tipo: string
  categoria: string
  valorCents: number
  valorPagoCents: number
  descontoCents: number
  dueDate: string
  paymentDate: string | null
  status: PaymentStatus
}

export interface NewPayment {
  descricao: string
  tipo: string
  categoria: string
  valorCents: number
  valorPagoCents: number
  descontoCents: number
  dueDate: string
}

export async function fetchPayments(): Promise<Payment[]> {
  const response = await fetch('/api/payments')

  if (!response.ok) {
    await parseError(response)
  }

  const data = (await response.json()) as { payments: Payment[] }
  return data.payments
}

export async function createPayment(payment: NewPayment): Promise<Payment> {
  const response = await fetch('/api/payments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payment),
  })

  if (!response.ok) {
    await parseError(response)
  }

  const data = (await response.json()) as { payment: Payment }
  return data.payment
}

export async function updatePayment(id: number, payment: NewPayment): Promise<Payment> {
  const response = await fetch(`/api/payments/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payment),
  })

  if (!response.ok) {
    await parseError(response)
  }

  const data = (await response.json()) as { payment: Payment }
  return data.payment
}

export async function deletePayment(id: number): Promise<void> {
  const response = await fetch(`/api/payments/${id}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    await parseError(response)
  }
}
