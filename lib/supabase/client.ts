"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/types";

/**
 * Cliente de Supabase para Client Components ('use client').
 * Se usa en /operador/* para leer sesión y hacer los updates de
 * checkin/checkout directamente desde el navegador (RLS protege el acceso:
 * un operador solo puede leer/actualizar sus propias ordenes_servicio).
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
