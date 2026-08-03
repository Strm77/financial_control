import { useEffect, useState, type FormEvent } from 'react'
import { useAuth } from '../context/AuthContext'
import { useMonth } from '../context/MonthContext'
import {
  createPayment,
  deletePayment,
  fetchPayments,
  updatePayment,
  type Payment,
  type PaymentStatus,
} from '../api/paymentsApi'
import { ApiError } from '../api/authApi'
import { IconEdit, IconTrash } from './icons'
import { formatCurrency, formatDate } from '../utils/format'
import './PaymentsTable.css'

export const TIPO_OPTIONS = ['Fixo', 'Variável']
export const CATEGORIA_OPTIONS = ['Cartão', 'Cartão de Loja', 'Boleto', 'Conta', 'Assinatura', 'Outros']

const EMPTY_FORM = {
  descricao: '',
  tipo: '',
  categoria: '',
  valor: '',
  valorPago: '',
  desconto: '',
  dueDate: '',
}

export const STATUS_LABEL: Record<PaymentStatus, string> = {
  pago: 'Pago',
  atrasado: 'Atrasado',
  parcial: 'Parcial',
  pendente: 'Pendente',
}

function toCents(value: string): number {
  if (value.trim() === '') return 0
  return Math.round(Number(value.replace(',', '.')) * 100)
}

export function PaymentsTable() {
  const { token } = useAuth()
  const { selectedMonth, year, monthLabel } = useMonth()

  const [payments, setPayments] = useState<Payment[]>([])
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!token) return
    let cancelled = false
    fetchPayments(token).then((data) => {
      if (!cancelled) setPayments(data)
    })
    return () => {
      cancelled = true
    }
  }, [token])

  function startEdit(payment: Payment) {
    setEditingId(payment.id)
    setError(null)
    setForm({
      descricao: payment.descricao,
      tipo: payment.tipo,
      categoria: payment.categoria,
      valor: (payment.valorCents / 100).toFixed(2),
      valorPago: (payment.valorPagoCents / 100).toFixed(2),
      desconto: (payment.descontoCents / 100).toFixed(2),
      dueDate: payment.dueDate,
    })
  }

  function cancelEdit() {
    setEditingId(null)
    setError(null)
    setForm(EMPTY_FORM)
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)

    const valorCents = toCents(form.valor)
    const valorPagoCents = toCents(form.valorPago)
    const descontoCents = toCents(form.desconto)

    if (!form.descricao.trim() || !form.tipo || !form.categoria || !valorCents || valorCents <= 0 || !form.dueDate) {
      setError('Preencha descrição, tipo, categoria, valor e vencimento corretamente.')
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        descricao: form.descricao,
        tipo: form.tipo,
        categoria: form.categoria,
        valorCents,
        valorPagoCents,
        descontoCents,
        dueDate: form.dueDate,
      }

      if (editingId !== null) {
        const updated = await updatePayment(token!, editingId, payload)
        setPayments((prev) => prev.map((payment) => (payment.id === editingId ? updated : payment)))
        setEditingId(null)
      } else {
        const created = await createPayment(token!, payload)
        setPayments((prev) => [...prev, created])
      }

      setForm(EMPTY_FORM)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível salvar o pagamento.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete(id: number) {
    if (editingId === id) cancelEdit()
    setPayments((prev) => prev.filter((payment) => payment.id !== id))
    await deletePayment(token!, id)
  }

  const filtered = payments
    .filter((payment) => {
      if (selectedMonth === 'all') return true
      const due = new Date(`${payment.dueDate}T00:00:00`)
      return due.getFullYear() === year && due.getMonth() + 1 === selectedMonth
    })
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))

  return (
    <div className="payments-section">
      <form className="neo-panel payments-form" onSubmit={handleSubmit}>
        {editingId !== null && <p className="payments-form__editing">Editando pagamento</p>}

        <div className="payments-form__fields">
          <label className="payments-form__field payments-form__field--wide">
            <span>Descrição</span>
            <input
              type="text"
              value={form.descricao}
              onChange={(event) => setForm((prev) => ({ ...prev, descricao: event.target.value }))}
              placeholder="Ex.: Nubank, Aluguel, Internet"
              disabled={isSubmitting}
            />
          </label>

          <label className="payments-form__field">
            <span>Tipo</span>
            <select
              value={form.tipo}
              onChange={(event) => setForm((prev) => ({ ...prev, tipo: event.target.value }))}
              disabled={isSubmitting}
            >
              <option value="">Selecione</option>
              {TIPO_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="payments-form__field">
            <span>Categoria</span>
            <select
              value={form.categoria}
              onChange={(event) => setForm((prev) => ({ ...prev, categoria: event.target.value }))}
              disabled={isSubmitting}
            >
              <option value="">Selecione</option>
              {CATEGORIA_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="payments-form__field">
            <span>Valor (R$)</span>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="0,00"
              value={form.valor}
              onChange={(event) => setForm((prev) => ({ ...prev, valor: event.target.value }))}
              disabled={isSubmitting}
            />
          </label>

          <label className="payments-form__field">
            <span>Valor pago (R$)</span>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="0,00"
              value={form.valorPago}
              onChange={(event) => setForm((prev) => ({ ...prev, valorPago: event.target.value }))}
              disabled={isSubmitting}
            />
          </label>

          <label className="payments-form__field">
            <span>Desconto (R$)</span>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="0,00"
              value={form.desconto}
              onChange={(event) => setForm((prev) => ({ ...prev, desconto: event.target.value }))}
              disabled={isSubmitting}
            />
          </label>

          <label className="payments-form__field">
            <span>Vencimento</span>
            <input
              type="date"
              value={form.dueDate}
              onChange={(event) => setForm((prev) => ({ ...prev, dueDate: event.target.value }))}
              disabled={isSubmitting}
            />
          </label>
        </div>

        {error && (
          <p className="payments-form__error" role="alert">
            {error}
          </p>
        )}

        <div className="payments-form__actions">
          <button type="submit" className="payments-form__submit" disabled={isSubmitting}>
            {isSubmitting ? 'Salvando…' : editingId !== null ? 'Salvar alterações' : 'Adicionar pagamento'}
          </button>
          {editingId !== null && (
            <button type="button" className="payments-form__cancel" onClick={cancelEdit} disabled={isSubmitting}>
              Cancelar
            </button>
          )}
        </div>
      </form>

      {filtered.length === 0 ? (
        <div className="neo-panel dashboard-placeholder">
          <p className="dashboard-placeholder__title">Nenhum pagamento agendado</p>
          <p className="dashboard-placeholder__text">Não há pagamentos cadastrados para {monthLabel}.</p>
        </div>
      ) : (
        <div className="neo-panel payments-table-card">
          <div className="payments-table-scroll">
            <table className="payments-table">
              <thead>
                <tr>
                  <th>Descrição</th>
                  <th>Tipo</th>
                  <th>Categoria</th>
                  <th>Valor</th>
                  <th>Valor pago</th>
                  <th>Desconto</th>
                  <th>Vencimento</th>
                  <th>Status</th>
                  <th>Data do pagamento</th>
                  <th aria-label="Ações" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((payment) => (
                  <tr key={payment.id} className={payment.id === editingId ? 'payments-table__row--editing' : undefined}>
                    <td>{payment.descricao}</td>
                    <td>{payment.tipo}</td>
                    <td>
                      <span className="payments-tag">{payment.categoria}</span>
                    </td>
                    <td className="payments-table__amount">{formatCurrency(payment.valorCents)}</td>
                    <td className="payments-table__amount">{formatCurrency(payment.valorPagoCents)}</td>
                    <td className="payments-table__amount">{formatCurrency(payment.descontoCents)}</td>
                    <td>{formatDate(payment.dueDate)}</td>
                    <td>
                      <span className={`payments-status payments-status--${payment.status}`}>
                        {STATUS_LABEL[payment.status]}
                      </span>
                    </td>
                    <td>{payment.paymentDate ? formatDate(payment.paymentDate) : '—'}</td>
                    <td>
                      <div className="payments-table__actions">
                        <button
                          type="button"
                          className="payments-table__icon-btn"
                          onClick={() => startEdit(payment)}
                          aria-label={`Editar pagamento ${payment.descricao}`}
                        >
                          <IconEdit width={16} height={16} />
                        </button>
                        <button
                          type="button"
                          className="payments-table__icon-btn payments-table__icon-btn--danger"
                          onClick={() => handleDelete(payment.id)}
                          aria-label={`Remover pagamento ${payment.descricao}`}
                        >
                          <IconTrash width={16} height={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
