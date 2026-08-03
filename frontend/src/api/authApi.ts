export interface AuthUser {
  id: number
  username: string
}

interface LoginResponse {
  token: string
  user: AuthUser
}

interface ApiErrorBody {
  message?: string
}

export class ApiError extends Error {}

export async function parseError(response: Response): Promise<never> {
  let message = 'Não foi possível concluir a operação.'
  try {
    const body = (await response.json()) as ApiErrorBody
    if (body.message) message = body.message
  } catch {
    // resposta sem corpo JSON, mantém mensagem padrão
  }
  throw new ApiError(message)
}

export async function login(username: string, password: string): Promise<LoginResponse> {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })

  if (!response.ok) {
    await parseError(response)
  }

  return response.json() as Promise<LoginResponse>
}

export async function fetchMe(token: string): Promise<{ user: AuthUser }> {
  const response = await fetch('/api/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!response.ok) {
    await parseError(response)
  }

  return response.json() as Promise<{ user: AuthUser }>
}
