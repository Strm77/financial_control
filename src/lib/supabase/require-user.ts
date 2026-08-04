import { createClient } from "@/lib/supabase/server";

/**
 * Helper usado por Server Actions para obter o cliente Supabase e o usuário
 * autenticado a partir da sessão do servidor (cookies). Nunca aceita um
 * user_id vindo do formulário/cliente.
 */
export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export const SESSION_EXPIRED_MESSAGE = "Sessão expirada. Faça login novamente.";
