export function formatCurrency(amountCents: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amountCents / 100)
}

export function formatDate(isoDate: string): string {
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString('pt-BR')
}

export function isOverdue(dueDate: string, paid: boolean): boolean {
  if (paid) return false
  return new Date(`${dueDate}T00:00:00`) < new Date()
}

export function addMonthsToDate(isoDate: string, months: number): string {
  const [year, month, day] = isoDate.split('-').map(Number)
  const date = new Date(year, month - 1 + months, day)
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function yearMonthIndex(isoDate: string): number {
  const [year, month] = isoDate.split('-').map(Number)
  return year * 12 + (month - 1)
}
