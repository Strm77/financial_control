import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";
import { env } from "@/lib/env";

// Use em Server Components, Server Actions e Route Handlers.
// Nunca usa a service_role key — sempre a chave anônima pública, respeitando RLS
// com a sessão do usuário autenticado via cookies.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Chamado a partir de um Server Component sem permissão de escrita
          // de cookies — o middleware cuida da renovação de sessão nesse caso.
        }
      },
    },
  });
}
