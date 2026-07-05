import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { OrdenServicioConDetalle } from "@/lib/types";
import { ServiceCard } from "@/components/operador/ServiceCard";

export const dynamic = "force-dynamic";

function formatFechaLarga(date: Date) {
  const texto = date.toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export default async function AgendaPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/operador/login");
  }

  const hoy = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  const { data: ordenes, error } = await supabase
    .from("ordenes_servicio")
    .select(
      `
      id, estatus, hora_servicio, fecha_servicio, es_servicio_aeropuerto,
      cliente:clientes ( id, nombre_completo, telefono ),
      experiencia:experiencias_catalogo ( id, nombre_tour )
    `
    )
    .eq("operador_id", user.id)
    .eq("fecha_servicio", hoy)
    .order("hora_servicio", { ascending: true })
    .returns<OrdenServicioConDetalle[]>();

  const enCurso = ordenes?.filter((o) =>
    ["en_espera", "en_progreso"].includes(o.estatus)
  ) ?? [];
  const otras = ordenes?.filter(
    (o) => !["en_espera", "en_progreso"].includes(o.estatus)
  ) ?? [];

  return (
    <main className="mobile-shell pb-safe-b">
      <header className="sticky top-0 z-10 border-b border-slate-100 bg-white/95 px-5 pb-4 pt-safe-t backdrop-blur">
        <p className="pt-4 text-sm font-medium text-sky-600">Mi agenda</p>
        <h1 className="text-xl font-extrabold text-slate-900">
          {formatFechaLarga(new Date())}
        </h1>
      </header>

      <section className="px-4 py-4">
        {error && (
          <p className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
            No se pudo cargar la agenda. Desliza hacia abajo para reintentar.
          </p>
        )}

        {!error && ordenes?.length === 0 && (
          <div className="mt-16 text-center">
            <p className="text-4xl">☀️</p>
            <p className="mt-3 text-base font-semibold text-slate-700">
              No tienes servicios asignados hoy
            </p>
            <p className="mt-1 text-sm text-slate-400">
              Vuelve a revisar más tarde
            </p>
          </div>
        )}

        {enCurso.length > 0 && (
          <div className="mb-5">
            <h2 className="mb-2 px-1 text-xs font-bold uppercase tracking-wide text-slate-400">
              Activos ahora
            </h2>
            <div className="space-y-3">
              {enCurso.map((orden) => (
                <ServiceCard key={orden.id} orden={orden} />
              ))}
            </div>
          </div>
        )}

        {otras.length > 0 && (
          <div>
            <h2 className="mb-2 px-1 text-xs font-bold uppercase tracking-wide text-slate-400">
              Resto del día
            </h2>
            <div className="space-y-3">
              {otras.map((orden) => (
                <ServiceCard key={orden.id} orden={orden} />
              ))}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
