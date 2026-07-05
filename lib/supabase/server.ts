import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/types";

type CookieToSet = { name: string; value: string; options: CookieOptions };

/**
 * Cliente de Supabase para Server Components / Route Handlers.
 * Lee y escribe la sesión desde las cookies de Next.js (App Router).
 */
export function createClient() {
  const cookieStore = cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Se puede ignorar si se llama desde un Server Component sin
            // capacidad de escritura; el middleware se encarga de refrescar.
          }
        },
      },
    }
  );
}
