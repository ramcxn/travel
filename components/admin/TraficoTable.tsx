"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { StatusBadge } from "@/components/operador/StatusBadge";
import type { OrdenEstatus } from "@/lib/types";

export interface OrdenTrafico {
  id: string;
  estatus: OrdenEstatus;
  hora_servicio: string;
  operador_id: string | null;
  unidad_id: string | null;
  estatus_vuelo: string | null;
  es_servicio_aeropuerto: boolean;
  numero_vuelo: string | null;
  cliente: { id: string; nombre_completo: string } | null;
  experiencia: { id: string; nombre_tour: string } | null;
}

interface OpcionSimple {
  id: string;
  nombre: string;
}

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

function esVueloDemorado(estatusVuelo: string | null) {
  if (!estatusVuelo) return false;
  return /demor|delay|retras/i.test(estatusVuelo);
}

export function TraficoTable({
  ordenesIniciales,
  operadores,
  unidades,
}: {
  ordenesIniciales: OrdenTrafico[];
  operadores: OpcionSimple[];
  unidades: OpcionSimple[];
}) {
  const supabase = createClient();
  const [ordenes, setOrdenes] = useState(ordenesIniciales);
  const [guardando, setGuardando] = useState<string | null>(null);

  async function asignar(
    ordenId: string,
    campo: "operador_id" | "unidad_id",
    valor: string
  ) {
    setGuardando(ordenId);
    const valorFinal = valor === "" ? null : valor;

    const { error } = await supabase
      .from("ordenes_servicio")
      .update({ [campo]: valorFinal })
      .eq("id", ordenId);

    if (!error) {
      setOrdenes((prev) =>
        prev.map((o) => (o.id === ordenId ? { ...o, [campo]: valorFinal } : o))
      );
    }
    setGuardando(null);
  }

  if (ordenes.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
        No hay órdenes de servicio programadas para hoy.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-card">
      <table className="w-full min-w-[900px] text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wide text-slate-400">
            <th className="px-4 py-3">Hora</th>
            <th className="px-4 py-3">Cliente</th>
            <th className="px-4 py-3">Experiencia</th>
            <th className="px-4 py-3">Vuelo</th>
            <th className="px-4 py-3">Operador</th>
            <th className="px-4 py-3">Unidad</th>
            <th className="px-4 py-3">Estatus</th>
          </tr>
        </thead>
        <tbody>
          {ordenes.map((orden) => (
            <tr
              key={orden.id}
              className="border-b border-slate-100 last:border-0"
            >
              <td className="px-4 py-3 font-semibold text-slate-800">
                {formatHora(orden.hora_servicio)}
              </td>
              <td className="px-4 py-3 text-slate-700">
                {orden.cliente?.nombre_completo ?? "—"}
              </td>
              <td className="px-4 py-3 text-slate-700">
                {orden.experiencia?.nombre_tour ?? "—"}
              </td>
              <td className="px-4 py-3">
                {orden.es_servicio_aeropuerto ? (
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${
                      esVueloDemorado(orden.estatus_vuelo)
                        ? "bg-red-100 text-red-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                    title={orden.numero_vuelo ?? undefined}
                  >
                    ✈️ {orden.estatus_vuelo ?? "En horario"}
                  </span>
                ) : (
                  <span className="text-slate-300">—</span>
                )}
              </td>
              <td className="px-4 py-3">
                <select
                  value={orden.operador_id ?? ""}
                  disabled={guardando === orden.id}
                  onChange={(e) =>
                    asignar(orden.id, "operador_id", e.target.value)
                  }
                  className="w-full min-w-[140px] rounded-lg border border-slate-300 px-2 py-1.5 text-sm disabled:opacity-50"
                >
                  <option value="">Sin asignar</option>
                  {operadores.map((op) => (
                    <option key={op.id} value={op.id}>
                      {op.nombre}
                    </option>
                  ))}
                </select>
              </td>
              <td className="px-4 py-3">
                <select
                  value={orden.unidad_id ?? ""}
                  disabled={guardando === orden.id}
                  onChange={(e) =>
                    asignar(orden.id, "unidad_id", e.target.value)
                  }
                  className="w-full min-w-[140px] rounded-lg border border-slate-300 px-2 py-1.5 text-sm disabled:opacity-50"
                >
                  <option value="">Sin asignar</option>
                  {unidades.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nombre}
                    </option>
                  ))}
                </select>
              </td>
              <td className="px-4 py-3">
                <StatusBadge estatus={orden.estatus} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
