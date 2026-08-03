import { parseError } from './authApi'

export interface CardExpense {
  id: number
  paymentId: number
  descricao: string
  valorCents: number
  parcelaAtual: number | null
  numeroParcelas: number | null
  data: string | null
}

export interface NewCardExpense {
  paymentId: number
  descricao: string
  valorCents: number
  parcelaAtual: number | null
  numeroParcelas: number | null
}

export async function fetchCardExpenses(token: string, paymentId: number): Promise<CardExpense[]> {
  const response = await fetch(`/api/card-expenses?paymentId=${paymentId}`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!response.ok) {
    await parseError(response)
  }

  const data = (await response.json()) as { expenses: CardExpense[] }
  return data.expenses
}

export async function createCardExpense(token: string, expense: NewCardExpense): Promise<CardExpense> {
  const response = await fetch('/api/card-expenses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(expense),
  })

  if (!response.ok) {
    await parseError(response)
  }

  const data = (await response.json()) as { expense: CardExpense }
  return data.expense
}

export async function deleteCardExpense(token: string, id: number): Promise<void> {
  const response = await fetch(`/api/card-expenses/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!response.ok) {
    await parseError(response)
  }
}

export async function importFatura(
  token: string,
  paymentId: number,
  file: File,
): Promise<{ expenses: CardExpense[]; message?: string }> {
  const formData = new FormData()
  formData.append('paymentId', String(paymentId))
  formData.append('file', file)

  const response = await fetch('/api/card-expenses/import', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  })

  if (!response.ok) {
    await parseError(response)
  }

  return (await response.json()) as { expenses: CardExpense[]; message?: string }
}
