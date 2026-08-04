import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";
import { env } from "@/lib/env";

interface ActionClientOptions {
  /**
   * Quando `false`, os cookies de sessão emitidos nesta chamada são gravados como
   * cookies de sessão do navegador (sem `maxAge`), expirando ao fechar o navegador.
   * Usado para implementar "Lembrar de mim" no login.
   */
  persistSession?: boolean;
}

export async function createActionClient(options: ActionClientOptions = {}) {
  const cookieStore = await cookies();
  const persistSession = options.persistSession ?? true;

  return createServerClient<Database>(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options: cookieOptions }) => {
            const finalOptions = persistSession
              ? cookieOptions
              : { ...cookieOptions, maxAge: undefined, expires: undefined };
            cookieStore.set(name, value, finalOptions);
          });
        } catch {
          // Server Component sem permissão de escrita — o middleware cobre a renovação.
        }
      },
    },
  });
}
