import { createClient } from "@/lib/supabase/server";
import type { CobranzaConCliente } from "@/lib/types";
import { CobranzaTable } from "@/components/admin/CobranzaTable";

export const dynamic = "force-dynamic";

export default async function CobranzaPage() {
  const supabase = createClient();

  // Panel pensado para <100 clientes activos: se trae todo en una sola
  // consulta (sin paginación) y se ordena por fecha límite más próxima.
  const { data: cobranza, error } = await supabase
    .from("control_cobranza")
    .select(
      `
      id, total_servicio, monto_anticipo, saldo_pendiente, fecha_limite_pago,
      orden_servicio:ordenes_servicio (
        id, fecha_servicio,
        cliente:clientes ( id, nombre_completo, telefono )
      )
    `
    )
    .order("fecha_limite_pago", { ascending: true })
    .returns<CobranzaConCliente[]>();

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 md:px-8 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6">
          <p className="text-sm font-medium text-sky-600">Administración</p>
          <h1 className="text-2xl font-extrabold text-slate-900">
            Panel de saldos y cobranza
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {cobranza?.length ?? 0} clientes con saldo registrado
          </p>
        </header>

        {error && (
          <p className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
            No se pudo cargar la información de cobranza.
          </p>
        )}

        {!error && <CobranzaTable filas={cobranza ?? []} />}
      </div>
    </main>
  );
}
