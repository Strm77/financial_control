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
