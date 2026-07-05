import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { OrdenServicioConDetalle } from "@/lib/types";
import { StatusBadge } from "@/components/operador/StatusBadge";
import { ServiceActionButton } from "@/components/operador/ServiceActionButton";

export const dynamic = "force-dynamic";

function formatHora(horaServicio: string) {
  const [h, m] = horaServicio.split(":");
  const date = new Date();
  date.setHours(Number(h), Number(m));
  return date.toLocaleTimeString("es-MX", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export default async function ServicioDetallePage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/operador/login");
  }

  const { data: orden, error } = await supabase
    .from("ordenes_servicio")
    .select(
      `
      *,
      cliente:clientes ( id, nombre_completo, telefono ),
      experiencia:experiencias_catalogo ( id, nombre_tour, ubicacion_maps_url )
    `
    )
    .eq("id", params.id)
    .single<OrdenServicioConDetalle>();

  if (error || !orden) {
    notFound();
  }

  const telefonoCliente = orden.cliente?.telefono;
  const mapsUrl = orden.experiencia?.ubicacion_maps_url;

  return (
    <main className="mobile-shell min-h-screen pb-32">
      {/* Cabecera */}
      <header className="border-b border-slate-100 bg-slate-900 px-5 pb-5 pt-safe-t text-white">
        <div className="flex items-center justify-between pt-4">
          <p className="text-sm font-medium text-slate-300">
            {formatHora(orden.hora_servicio)}
          </p>
          <StatusBadge estatus={orden.estatus} />
        </div>
        <h1 className="mt-1 text-scan-xl text-white">
          {orden.experiencia?.nombre_tour ?? "Experiencia sin asignar"}
        </h1>
      </header>

      <div className="space-y-4 px-4 py-4">
        {/* Sección Cliente */}
        <section className="card-scannable">
          <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">
            Cliente
          </h2>
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-lg font-bold text-slate-900">
                {orden.cliente?.nombre_completo ?? "Sin nombre"}
              </p>
              <p className="text-sm text-slate-500">
                {orden.numero_pasajeros
                  ? `${orden.numero_pasajeros} pasajero(s)`
                  : "Pasajeros no especificados"}
              </p>
            </div>

            {telefonoCliente && (
              <a
                href={`tel:${telefonoCliente}`}
                className="flex h-touch-lg w-touch-lg shrink-0 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-card active:bg-emerald-600"
                aria-label="Llamar al cliente"
              >
                <PhoneIcon />
              </a>
            )}
          </div>
        </section>

        {/* Sección Logística */}
        <section className="card-scannable">
          <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">
            Logística
          </h2>

          {mapsUrl && (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-touch-lg items-center justify-between rounded-xl bg-sky-50 px-4 text-sky-700 active:bg-sky-100"
            >
              <span className="font-semibold">Ver punto de encuentro</span>
              <MapPinIcon />
            </a>
          )}

          {orden.es_servicio_aeropuerto && (
            <div className="mt-3 rounded-xl border-2 border-amber-300 bg-amber-50 p-4">
              <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-amber-700">
                ✈️ Servicio de aeropuerto
                {orden.estatus_vuelo && (
                  <span className="ml-auto rounded-full bg-amber-200 px-2 py-0.5 text-[11px] normal-case text-amber-900">
                    {orden.estatus_vuelo}
                  </span>
                )}
              </p>
              <dl className="grid grid-cols-2 gap-y-2 text-sm">
                <dt className="text-slate-500">Aerolínea</dt>
                <dd className="text-right font-semibold text-slate-900">
                  {orden.aerolinea ?? "—"}
                </dd>
                <dt className="text-slate-500">Vuelo</dt>
                <dd className="text-right font-semibold text-slate-900">
                  {orden.numero_vuelo ?? "—"}
                </dd>
                <dt className="text-slate-500">Terminal</dt>
                <dd className="text-right font-semibold text-slate-900">
                  {orden.terminal ?? "—"}
                </dd>
                {orden.hora_estimada_vuelo && (
                  <>
                    <dt className="text-slate-500">Hora estimada</dt>
                    <dd className="text-right font-semibold text-slate-900">
                      {new Date(orden.hora_estimada_vuelo).toLocaleTimeString(
                        "es-MX",
                        { hour: "numeric", minute: "2-digit" }
                      )}
                    </dd>
                  </>
                )}
              </dl>
            </div>
          )}
        </section>
      </div>

      {/* Botón dinámico fijo abajo */}
      <div className="fixed inset-x-0 bottom-0 mx-auto max-w-mobile-shell border-t border-slate-100 bg-white/95 px-4 pb-safe-b pt-3 backdrop-blur">
        <ServiceActionButton orden={orden} currentUserId={user.id} />
      </div>
    </main>
  );
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
      <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.7 21 3 13.3 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.2.2 2.5.6 3.6.1.4 0 .8-.3 1.1L6.6 10.8z" />
    </svg>
  );
}

function MapPinIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
      <path d="M12 2C7.6 2 4 5.6 4 10c0 5.4 6.9 11.5 7.2 11.7.2.2.5.3.8.3s.6-.1.8-.3C13.1 21.5 20 15.4 20 10c0-4.4-3.6-8-8-8zm0 11c-1.7 0-3-1.3-3-3s1.3-3 3-3 3 1.3 3 3-1.3 3-3 3z" />
    </svg>
  );
}
