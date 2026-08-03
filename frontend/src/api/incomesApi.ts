import { parseError } from './authApi'

export interface Income {
  id: number
  fonte: string
  categoria: string
  tipo: string
  amountCents: number
  receivedDate: string
}

export interface NewIncome {
  fonte: string
  categoria: string
  tipo: string
  amountCents: number
}

export async function fetchIncomes(token: string): Promise<Income[]> {
  const response = await fetch('/api/incomes', {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!response.ok) {
    await parseError(response)
  }

  const data = (await response.json()) as { incomes: Income[] }
  return data.incomes
}

export async function createIncome(token: string, income: NewIncome): Promise<Income> {
  const response = await fetch('/api/incomes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(income),
  })

  if (!response.ok) {
    await parseError(response)
  }

  const data = (await response.json()) as { income: Income }
  return data.income
}

export async function deleteIncome(token: string, id: number): Promise<void> {
  const response = await fetch(`/api/incomes/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!response.ok) {
    await parseError(response)
  }
}
