import { useState, type FormEvent } from 'react'
import { LiquidBackground } from '../components/LiquidBackground'
import { useAuth } from '../context/AuthContext'
import { ApiError } from '../api/authApi'
import './LoginPage.css'

export function LoginPage() {
  const { login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)

    if (!username.trim() || !password) {
      setError('Preencha usuário e senha para continuar.')
      return
    }

    setIsSubmitting(true)
    try {
      await login(username, password)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível conectar ao servidor.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="login-screen">
      <LiquidBackground />

      <main className="login-stage">
        <form className="liquid-glass login-card" onSubmit={handleSubmit} noValidate>
          <div className="login-card__content">
            <div className="login-brand">
              <span className="login-brand__mark">FC</span>
              <div>
                <h1>Financial Control</h1>
                <p className="login-subtitle">Acesse sua conta para continuar</p>
              </div>
            </div>

            <label className="login-field">
              <span>Usuário</span>
              <input
                type="text"
                name="username"
                autoComplete="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="Digite seu usuário"
                disabled={isSubmitting}
                autoFocus
              />
            </label>

            <label className="login-field">
              <span>Senha</span>
              <input
                type="password"
                name="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Digite sua senha"
                disabled={isSubmitting}
              />
            </label>

            {error && (
              <p className="login-error" role="alert">
                {error}
              </p>
            )}

            <button type="submit" className="login-button" disabled={isSubmitting}>
              {isSubmitting ? 'Entrando…' : 'Entrar'}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
