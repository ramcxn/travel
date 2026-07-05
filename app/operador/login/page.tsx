"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function OperadorLoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setLoading(false);

    if (authError) {
      setError("Correo o contraseña incorrectos. Intenta de nuevo.");
      return;
    }

    router.push("/operador/agenda");
    router.refresh();
  }

  return (
    <main className="mobile-shell flex min-h-screen flex-col justify-center px-6 py-10">
      <div className="mb-10 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-600 text-2xl font-black text-white">
          TO
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900">Travel Ops</h1>
        <p className="mt-1 text-sm text-slate-500">
          Acceso para choferes, guías y capitanes
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="mb-1.5 block text-sm font-semibold text-slate-700"
          >
            Correo electrónico
          </label>
          <input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tucorreo@empresa.com"
            className="h-touch-lg w-full rounded-2xl border border-slate-300 px-4 text-lg
                       focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-100"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="mb-1.5 block text-sm font-semibold text-slate-700"
          >
            Contraseña
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="h-touch-lg w-full rounded-2xl border border-slate-300 px-4 text-lg
                       focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-100"
          />
        </div>

        {error && (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="btn-primary-action bg-sky-600 active:bg-sky-700 disabled:bg-sky-400 mt-2"
        >
          {loading ? "Ingresando..." : "Iniciar sesión"}
        </button>
      </form>

      <p className="mt-8 text-center text-xs text-slate-400">
        ¿Problemas para entrar? Contacta a tráfico/operaciones.
      </p>
    </main>
  );
}
