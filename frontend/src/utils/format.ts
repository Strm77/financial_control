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
