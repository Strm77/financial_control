import { parseError } from './authApi'

export interface Payment {
  id: number
  description: string
  amountCents: number
  dueDate: string
  paid: boolean
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
