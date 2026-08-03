import { parseError } from './authApi'

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

export async function fetchPayments(token: string): Promise<Payment[]> {
  const response = await fetch('/api/payments', {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!response.ok) {
    await parseError(response)
  }

  const data = (await response.json()) as { payments: Payment[] }
  return data.payments
}

export async function createPayment(token: string, payment: NewPayment): Promise<Payment> {
  const response = await fetch('/api/payments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payment),
  })

  if (!response.ok) {
    await parseError(response)
  }

  const data = (await response.json()) as { payment: Payment }
  return data.payment
}

export async function updatePayment(token: string, id: number, payment: NewPayment): Promise<Payment> {
  const response = await fetch(`/api/payments/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payment),
  })

  if (!response.ok) {
    await parseError(response)
  }

  const data = (await response.json()) as { payment: Payment }
  return data.payment
}

export async function deletePayment(token: string, id: number): Promise<void> {
  const response = await fetch(`/api/payments/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!response.ok) {
    await parseError(response)
  }
}
