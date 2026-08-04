import { useState, type FormEvent } from 'react'
import { useAuth } from '../context/AuthContext'
import { ApiError } from '../api/authApi'
import { ThemeToggle } from '../components/ThemeToggle'
import './LoginPage.css'

type Mode = 'login' | 'register'

export function LoginPage() {
  const { login, register } = useAuth()
  const [mode, setMode] = useState<Mode>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  function switchMode(nextMode: Mode) {
    setMode(nextMode)
    setError(null)
    setPassword('')
    setConfirmPassword('')
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)

    if (mode === 'login') {
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
      return
    }

    if (!username.trim() || !password || !confirmPassword) {
      setError('Preencha usuário, senha e confirmação de senha.')
      return
    }
    if (username.trim().length < 3) {
      setError('O usuário deve ter pelo menos 3 caracteres.')
      return
    }
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.')
      return
    }
    if (password !== confirmPassword) {
      setError('A confirmação de senha não confere.')
      return
    }

    setIsSubmitting(true)
    try {
      await register(username, password, confirmPassword)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível conectar ao servidor.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const isRegister = mode === 'register'

  return (
    <div className="login-screen">
      <div className="login-theme-toggle">
        <ThemeToggle />
      </div>
      <main className="login-stage">
        <form className="neo-panel login-card" onSubmit={handleSubmit} noValidate>
          <div className="login-card__content">
            <div className="login-brand">
              <span className="login-brand__mark">FC</span>
              <div>
                <h1>Financial Control</h1>
                <p className="login-subtitle">
                  {isRegister ? 'Crie sua conta para começar' : 'Acesse sua conta para continuar'}
                </p>
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
                autoComplete={isRegister ? 'new-password' : 'current-password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Digite sua senha"
                disabled={isSubmitting}
              />
            </label>

            {isRegister && (
              <label className="login-field">
                <span>Confirmar senha</span>
                <input
                  type="password"
                  name="confirmPassword"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Digite a senha novamente"
                  disabled={isSubmitting}
                />
              </label>
            )}

            {error && (
              <p className="login-error" role="alert">
                {error}
              </p>
            )}

            <button type="submit" className="login-button" disabled={isSubmitting}>
              {isSubmitting ? (isRegister ? 'Criando conta…' : 'Entrando…') : isRegister ? 'Criar conta' : 'Entrar'}
            </button>

            <button
              type="button"
              className="login-switch"
              onClick={() => switchMode(isRegister ? 'login' : 'register')}
              disabled={isSubmitting}
            >
              {isRegister ? 'Já tem conta? Entrar' : 'Não tem conta? Criar conta'}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
