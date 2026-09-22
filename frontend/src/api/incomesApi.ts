import { parseError } from './client'

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

export async function fetchIncomes(): Promise<Income[]> {
  const response = await fetch('/api/incomes')

  if (!response.ok) {
    await parseError(response)
  }

  const data = (await response.json()) as { incomes: Income[] }
  return data.incomes
}

export async function createIncome(income: NewIncome): Promise<Income> {
  const response = await fetch('/api/incomes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(income),
  })

  if (!response.ok) {
    await parseError(response)
  }

  const data = (await response.json()) as { income: Income }
  return data.income
}

export async function updateIncome(id: number, income: NewIncome): Promise<Income> {
  const response = await fetch(`/api/incomes/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(income),
  })

  if (!response.ok) {
    await parseError(response)
  }

  const data = (await response.json()) as { income: Income }
  return data.income
}

export async function deleteIncome(id: number): Promise<void> {
  const response = await fetch(`/api/incomes/${id}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    await parseError(response)
  }
}
