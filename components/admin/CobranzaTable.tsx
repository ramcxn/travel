"use client";

import { useState } from "react";
import type { CobranzaConCliente } from "@/lib/types";

type RiesgoNivel = "vencido" | "proximo" | "ok";

const ROW_STYLES: Record<RiesgoNivel, string> = {
  vencido: "bg-cobranza-vencido border-l-4 border-cobranza-vencido-border",
  proximo: "bg-cobranza-proximo border-l-4 border-cobranza-proximo-border",
  ok: "border-l-4 border-transparent",
};

const BADGE_STYLES: Record<RiesgoNivel, string> = {
  vencido: "bg-red-100 text-red-700",
  proximo: "bg-amber-100 text-amber-800",
  ok: "bg-slate-100 text-slate-500",
};

const BADGE_LABEL: Record<RiesgoNivel, string> = {
  vencido: "Vencido",
  proximo: "Próximo a vencer",
  ok: "Al corriente",
};

function calcularRiesgo(fechaLimite: string): {
  nivel: RiesgoNivel;
  diasRestantes: number;
} {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const limite = new Date(`${fechaLimite}T00:00:00`);
  const diasRestantes = Math.round(
    (limite.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diasRestantes < 0) return { nivel: "vencido", diasRestantes };
  if (diasRestantes <= 3) return { nivel: "proximo", diasRestantes };
  return { nivel: "ok", diasRestantes };
}

function formatMoneda(valor: number) {
  return valor.toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
  });
}

function formatFecha(fecha: string) {
  return new Date(`${fecha}T00:00:00`).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

type EnvioEstado = "idle" | "enviando" | "enviado" | "error";

export function CobranzaTable({ filas }: { filas: CobranzaConCliente[] }) {
  const [estadoEnvio, setEstadoEnvio] = useState<Record<string, EnvioEstado>>(
    {}
  );

  async function enviarRecordatorioWhatsapp(fila: CobranzaConCliente) {
    const cliente = fila.orden_servicio?.cliente;
    if (!cliente) return;

    setEstadoEnvio((prev) => ({ ...prev, [fila.id]: "enviando" }));

    try {
      const res = await fetch("/api/whatsapp/cobranza", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          controlCobranzaId: fila.id,
          clienteId: cliente.id,
          telefono: cliente.telefono,
          nombreCliente: cliente.nombre_completo,
          saldoPendiente: fila.saldo_pendiente,
          fechaLimite: fila.fecha_limite_pago,
        }),
      });

      if (!res.ok) throw new Error("request failed");

      setEstadoEnvio((prev) => ({ ...prev, [fila.id]: "enviado" }));
    } catch {
      setEstadoEnvio((prev) => ({ ...prev, [fila.id]: "error" }));
    }
  }

  if (filas.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
        No hay saldos pendientes registrados.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-card">
      <table className="w-full min-w-[820px] text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wide text-slate-400">
            <th className="px-4 py-3">Cliente</th>
            <th className="px-4 py-3 text-right">Total contratado</th>
            <th className="px-4 py-3 text-right">Anticipo</th>
            <th className="px-4 py-3 text-right">Saldo pendiente</th>
            <th className="px-4 py-3">Fecha límite</th>
            <th className="px-4 py-3">Estatus</th>
            <th className="px-4 py-3 text-center">Acción</th>
          </tr>
        </thead>
        <tbody>
          {filas.map((fila) => {
            const cliente = fila.orden_servicio?.cliente;
            const { nivel, diasRestantes } = calcularRiesgo(
              fila.fecha_limite_pago
            );
            const envio = estadoEnvio[fila.id] ?? "idle";

            return (
              <tr
                key={fila.id}
                className={`border-b border-slate-100 last:border-0 ${ROW_STYLES[nivel]}`}
              >
                <td className="px-4 py-3 font-semibold text-slate-800">
                  {cliente?.nombre_completo ?? "—"}
                  <div className="text-xs font-normal text-slate-400">
                    {cliente?.telefono}
                  </div>
                </td>
                <td className="px-4 py-3 text-right text-slate-700">
                  {formatMoneda(fila.total_servicio)}
                </td>
                <td className="px-4 py-3 text-right text-slate-700">
                  {formatMoneda(fila.monto_anticipo)}
                </td>
                <td className="px-4 py-3 text-right font-bold text-slate-900">
                  {formatMoneda(fila.saldo_pendiente)}
                </td>
                <td className="px-4 py-3 text-slate-700">
                  {formatFecha(fila.fecha_limite_pago)}
                  <div className="text-xs text-slate-400">
                    {diasRestantes < 0
                      ? `Vencido hace ${Math.abs(diasRestantes)} día(s)`
                      : `En ${diasRestantes} día(s)`}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${BADGE_STYLES[nivel]}`}
                  >
                    {BADGE_LABEL[nivel]}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={() => enviarRecordatorioWhatsapp(fila)}
                      disabled={envio === "enviando" || !cliente}
                      className="flex items-center gap-1.5 rounded-full bg-emerald-500 px-3 py-2 text-xs font-bold text-white
                                 transition-colors hover:bg-emerald-600 disabled:opacity-50"
                      title="Enviar recordatorio de cobro por WhatsApp"
                    >
                      <WhatsAppIcon />
                      {envio === "enviando" && "Enviando..."}
                      {envio === "enviado" && "Enviado ✓"}
                      {envio === "error" && "Reintentar"}
                      {envio === "idle" && "Cobrar"}
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path d="M12.04 2c-5.5 0-10 4.5-10 10 0 1.77.46 3.45 1.27 4.9L2 22l5.25-1.38A9.94 9.94 0 0012.04 22c5.5 0 10-4.5 10-10s-4.5-10-10-10zm0 18.2c-1.6 0-3.13-.43-4.46-1.24l-.32-.19-3.12.82.84-3.04-.21-.32A8.17 8.17 0 013.85 12c0-4.5 3.68-8.18 8.19-8.18 4.5 0 8.18 3.68 8.18 8.18 0 4.5-3.68 8.2-8.18 8.2zm4.48-6.13c-.24-.12-1.44-.71-1.67-.79-.22-.08-.38-.12-.55.12-.16.24-.63.79-.77.95-.14.16-.28.18-.53.06-.24-.12-1.02-.38-1.94-1.2-.72-.64-1.2-1.43-1.34-1.67-.14-.24-.02-.37.1-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.55-1.33-.76-1.82-.2-.48-.4-.42-.55-.42h-.47c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2s.86 2.32.98 2.48c.12.16 1.7 2.6 4.13 3.64.58.25 1.03.4 1.38.51.58.18 1.11.16 1.53.1.47-.07 1.44-.59 1.64-1.16.2-.57.2-1.06.14-1.16-.06-.1-.22-.16-.46-.28z" />
    </svg>
  );
}
