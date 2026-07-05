import { createClient } from "@/lib/supabase/server";
import type { ContratoTarifa } from "@/lib/types";
import { ContratosTable } from "@/components/admin/ContratosTable";

export const dynamic = "force-dynamic";

export default async function ContratosPage() {
  const supabase = createClient();

  const { data: contratos, error } = await supabase
    .from("contratos_tarifas")
    .select(
      `
      id, nombre_convenio, costo_neto, vigencia_inicio, vigencia_fin, documento_url,
      proveedor:proveedores_unidades ( id, nombre, tipo )
    `
    )
    .order("vigencia_inicio", { ascending: false })
    .returns<ContratoTarifa[]>();

  return (
    <div className="px-4 py-6 md:px-8 lg:px-10">
      <header className="mb-6 flex flex-col gap-1">
        <p className="text-sm font-medium text-sky-600">Administración</p>
        <h1 className="text-2xl font-extrabold text-slate-900">
          Historial de proveedores y tarifas
        </h1>
      </header>

      {error && (
        <p className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
          No se pudo cargar el historial de contratos.
        </p>
      )}

      {!error && <ContratosTable contratos={contratos ?? []} />}
    </div>
  );
}
