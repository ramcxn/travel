"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { UsuarioRol } from "@/lib/types";

/**
 * Acceso unificado: cualquier rol (admin, cobranza, operador) entra por
 * aquí. Tras autenticar, se lee public.usuarios para decidir a dónde
 * redirigir. Los operadores también pueden usar /operador/login
 * directamente (misma lógica, UI optimizada a móvil).
 */
export default function LoginUnificadoPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function rutaPorRol(rol: UsuarioRol) {
    if (rol === "operador") return "/operador/agenda";
    if (rol === "cobranza") return "/admin/cobranza";
    return "/admin/dashboard";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({ email: email.trim(), password });

    if (authError || !authData.user) {
      setError("Correo o contraseña incorrectos.");
      setLoading(false);
      return;
    }

    const { data: usuario } = await supabase
      .from("usuarios")
      .select("rol")
      .eq("id", authData.user.id)
      .single<{ rol: UsuarioRol }>();

    setLoading(false);
    router.push(rutaPorRol(usuario?.rol ?? "operador"));
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-card">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-600 text-xl font-black text-white">
            TO
          </div>
          <h1 className="text-xl font-extrabold text-slate-900">Travel Ops</h1>
          <p className="mt-1 text-sm text-slate-500">Inicia sesión para continuar</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-slate-700">
              Correo electrónico
            </label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 w-full rounded-xl border border-slate-300 px-4 focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-100"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-semibold text-slate-700">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 w-full rounded-xl border border-slate-300 px-4 focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-100"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="h-12 w-full rounded-xl bg-sky-600 text-sm font-bold text-white transition-colors hover:bg-sky-700 disabled:bg-sky-400"
          >
            {loading ? "Ingresando..." : "Iniciar sesión"}
          </button>
        </form>
      </div>
    </main>
  );
}
