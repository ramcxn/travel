import { createClient } from "@/lib/supabase/server";
import { TraficoTable, type OrdenTrafico } from "@/components/admin/TraficoTable";

export const dynamic = "force-dynamic";

export default async function TraficoPage() {
  const supabase = createClient();
  const hoy = new Date().toISOString().slice(0, 10);

  const [{ data: ordenes, error }, { data: operadores }, { data: unidades }] =
    await Promise.all([
      supabase
        .from("ordenes_servicio")
        .select(
          `
          id, estatus, hora_servicio, operador_id, unidad_id,
          estatus_vuelo, es_servicio_aeropuerto, numero_vuelo,
          cliente:clientes ( id, nombre_completo ),
          experiencia:experiencias_catalogo ( id, nombre_tour )
        `
        )
        .eq("fecha_servicio", hoy)
        .order("hora_servicio", { ascending: true })
        .returns<OrdenTrafico[]>(),
      supabase
        .from("usuarios")
        .select("id, nombre")
        .eq("rol", "operador")
        .eq("activo", true)
        .order("nombre"),
      supabase
        .from("proveedores_unidades")
        .select("id, nombre, tipo")
        .order("nombre"),
    ]);

  return (
    <div className="px-4 py-6 md:px-8 lg:px-10">
      <header className="mb-6">
        <p className="text-sm font-medium text-sky-600">Administración</p>
        <h1 className="text-2xl font-extrabold text-slate-900">
          Tablero de tráfico — hoy
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Asigna operador y unidad a cada orden de servicio del día.
        </p>
      </header>

      {error && (
        <p className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
          No se pudo cargar el tablero de tráfico.
        </p>
      )}

      {!error && (
        <TraficoTable
          ordenesIniciales={ordenes ?? []}
          operadores={operadores ?? []}
          unidades={unidades ?? []}
        />
      )}
    </div>
  );
}
