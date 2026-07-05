"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const NAV_ITEMS = [
  { href: "/admin/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/admin/trafico", label: "Tráfico", icon: "🚐" },
  { href: "/admin/cobranza", label: "Cobranza", icon: "💰" },
  { href: "/admin/contratos", label: "Contratos", icon: "📄" },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [abierto, setAbierto] = useState(false);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      {/* Barra superior móvil (< md) */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 md:hidden">
        <span className="text-lg font-extrabold text-slate-900">Travel Ops</span>
        <button
          type="button"
          onClick={() => setAbierto((v) => !v)}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200"
          aria-label="Abrir menú"
        >
          {abierto ? "✕" : "☰"}
        </button>
      </div>

      {/* Overlay móvil */}
      {abierto && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={() => setAbierto(false)}
        />
      )}

      {/* Sidebar: drawer en móvil, fija en desktop (md+) */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white
          transition-transform duration-200 md:sticky md:top-0 md:h-screen md:translate-x-0
          ${abierto ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="hidden items-center gap-2 border-b border-slate-100 px-6 py-5 md:flex">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-600 text-sm font-black text-white">
            TO
          </div>
          <span className="text-lg font-extrabold text-slate-900">Travel Ops</span>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {NAV_ITEMS.map((item) => {
            const activo = pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setAbierto(false)}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors
                  ${
                    activo
                      ? "bg-sky-50 text-sky-700"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
              >
                <span aria-hidden>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-100 p-3">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50"
          >
            <span aria-hidden>🚪</span>
            Cerrar sesión
          </button>
        </div>
      </aside>
    </>
  );
}
