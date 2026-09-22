import { parseError } from './client'

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

export async function fetchDebts(): Promise<Debt[]> {
  const response = await fetch('/api/debts')

  if (!response.ok) {
    await parseError(response)
  }

  const data = (await response.json()) as { debts: Debt[] }
  return data.debts
}

export async function createDebt(debt: NewDebt): Promise<Debt> {
  const response = await fetch('/api/debts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(debt),
  })

  if (!response.ok) {
    await parseError(response)
  }

  const data = (await response.json()) as { debt: Debt }
  return data.debt
}

export async function updateDebt(id: number, debt: NewDebt): Promise<Debt> {
  const response = await fetch(`/api/debts/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(debt),
  })

  if (!response.ok) {
    await parseError(response)
  }

  const data = (await response.json()) as { debt: Debt }
  return data.debt
}

export async function deleteDebt(id: number): Promise<void> {
  const response = await fetch(`/api/debts/${id}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    await parseError(response)
  }
}
