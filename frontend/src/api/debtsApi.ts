import { parseError } from './authApi'

export interface Debt {
  id: number
  credor: string
  valorContratadoCents: number
  valorParcelaCents: number
  numeroParcelas: number
  parcelaAtual: number
  valorPagoCents: number
  faltaPagarCents: number
  jurosPercent: number | null
  dueDate: string
  recorrente: boolean
  dataFinal: string
}

export interface NewDebt {
  credor: string
  valorContratadoCents: number
  valorParcelaCents: number
  numeroParcelas: number
  parcelaAtual: number
  jurosPercent: number | null
  dueDate: string
  recorrente: boolean
}

export async function fetchDebts(token: string): Promise<Debt[]> {
  const response = await fetch('/api/debts', {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!response.ok) {
    await parseError(response)
  }

  const data = (await response.json()) as { debts: Debt[] }
  return data.debts
}

export async function createDebt(token: string, debt: NewDebt): Promise<Debt> {
  const response = await fetch('/api/debts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(debt),
  })

  if (!response.ok) {
    await parseError(response)
  }

  const data = (await response.json()) as { debt: Debt }
  return data.debt
}

export async function updateDebt(token: string, id: number, debt: NewDebt): Promise<Debt> {
  const response = await fetch(`/api/debts/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(debt),
  })

  if (!response.ok) {
    await parseError(response)
  }

  const data = (await response.json()) as { debt: Debt }
  return data.debt
}

export async function deleteDebt(token: string, id: number): Promise<void> {
  const response = await fetch(`/api/debts/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!response.ok) {
    await parseError(response)
  }
}
