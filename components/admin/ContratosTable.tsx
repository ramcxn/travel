"use client";

import { useMemo, useState } from "react";
import type { ContratoTarifa, ProveedorTipo } from "@/lib/types";

const TIPO_LABEL: Record<ProveedorTipo, string> = {
  yate: "Yate",
  van: "Van",
  guia_externo: "Guía externo",
  hotel: "Hotel",
};

function formatMoneda(valor: number) {
  return valor.toLocaleString("es-MX", { style: "currency", currency: "MXN" });
}

function formatFecha(fecha: string) {
  return new Date(`${fecha}T00:00:00`).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function ContratosTable({ contratos }: { contratos: ContratoTarifa[] }) {
  const [busqueda, setBusqueda] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState<ProveedorTipo | "">("");
  const [exportando, setExportando] = useState(false);

  const filtrados = useMemo(() => {
    return contratos.filter((c) => {
      const coincideTexto =
        busqueda.trim() === "" ||
        c.nombre_convenio.toLowerCase().includes(busqueda.toLowerCase()) ||
        c.proveedor?.nombre.toLowerCase().includes(busqueda.toLowerCase());
      const coincideTipo = tipoFiltro === "" || c.proveedor?.tipo === tipoFiltro;
      return coincideTexto && coincideTipo;
    });
  }, [contratos, busqueda, tipoFiltro]);

  async function exportarExcel() {
    setExportando(true);
    try {
      const XLSX = await import("xlsx");

      const filas = filtrados.map((c) => ({
        Proveedor: c.proveedor?.nombre ?? "",
        Tipo: c.proveedor ? TIPO_LABEL[c.proveedor.tipo] : "",
        Convenio: c.nombre_convenio,
        "Costo neto": c.costo_neto,
        "Vigencia inicio": c.vigencia_inicio,
        "Vigencia fin": c.vigencia_fin,
      }));

      const hoja = XLSX.utils.json_to_sheet(filas);
      const libro = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(libro, hoja, "Contratos");

      const fechaArchivo = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(libro, `reporte-contratos-${fechaArchivo}.xlsx`);
    } finally {
      setExportando(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 gap-3">
          <input
            type="text"
            placeholder="Buscar proveedor o convenio..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="h-11 w-full max-w-xs rounded-xl border border-slate-300 px-3 text-sm focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-100"
          />
          <select
            value={tipoFiltro}
            onChange={(e) => setTipoFiltro(e.target.value as ProveedorTipo | "")}
            className="h-11 rounded-xl border border-slate-300 px-3 text-sm"
          >
            <option value="">Todos los tipos</option>
            {Object.entries(TIPO_LABEL).map(([valor, label]) => (
              <option key={valor} value={valor}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={exportarExcel}
          disabled={exportando || filtrados.length === 0}
          className="flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          📊 {exportando ? "Generando..." : "Exportar a Excel"}
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-card">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wide text-slate-400">
              <th className="px-4 py-3">Proveedor</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Convenio</th>
              <th className="px-4 py-3 text-right">Costo neto</th>
              <th className="px-4 py-3">Vigencia</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((c) => (
              <tr key={c.id} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-3 font-semibold text-slate-800">
                  {c.proveedor?.nombre ?? "—"}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {c.proveedor ? TIPO_LABEL[c.proveedor.tipo] : "—"}
                </td>
                <td className="px-4 py-3 text-slate-700">{c.nombre_convenio}</td>
                <td className="px-4 py-3 text-right font-semibold text-slate-900">
                  {formatMoneda(c.costo_neto)}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {formatFecha(c.vigencia_inicio)} – {formatFecha(c.vigencia_fin)}
                </td>
              </tr>
            ))}
            {filtrados.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-slate-400">
                  Sin resultados para los filtros aplicados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
