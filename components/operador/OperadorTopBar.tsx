"use client";

import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Barra superior simple para la app del operador: sin sidebar, sin menús
 * pesados. Solo botón de regresar (cuando aplica) y cerrar sesión.
 */
export function OperadorTopBar() {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  const enAgenda = pathname === "/operador/agenda";

  // La pantalla de login no lleva esta barra (aún no hay sesión que cerrar).
  if (pathname?.startsWith("/operador/login")) {
    return null;
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/operador/login");
    router.refresh();
  }

  return (
    <div className="sticky top-0 z-20 mx-auto flex h-12 w-full max-w-mobile-shell items-center justify-between bg-slate-950 px-3 pt-safe-t text-white">
      {enAgenda ? (
        <span className="text-sm font-bold">Travel Ops</span>
      ) : (
        <button
          type="button"
          onClick={() => router.back()}
          className="flex h-9 items-center gap-1 rounded-lg px-2 text-sm font-semibold active:bg-white/10"
        >
          ← Agenda
        </button>
      )}

      <button
        type="button"
        onClick={handleLogout}
        className="flex h-9 items-center gap-1 rounded-lg px-2 text-sm font-semibold text-slate-300 active:bg-white/10"
        aria-label="Cerrar sesión"
      >
        Salir 🚪
      </button>
    </div>
  );
}
