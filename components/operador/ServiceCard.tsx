import Link from "next/link";
import type { OrdenServicioConDetalle } from "@/lib/types";
import { StatusBadge } from "./StatusBadge";

function formatHora(horaServicio: string) {
  // hora_servicio viene como "HH:MM:SS" desde Postgres
  const [h, m] = horaServicio.split(":");
  const date = new Date();
  date.setHours(Number(h), Number(m));
  return date.toLocaleTimeString("es-MX", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function ServiceCard({ orden }: { orden: OrdenServicioConDetalle }) {
  return (
    <Link
      href={`/operador/servicio/${orden.id}`}
      className="card-scannable block"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="text-scan-lg text-slate-900">
          {formatHora(orden.hora_servicio)}
        </span>
        <StatusBadge estatus={orden.estatus} />
      </div>

      <p className="mt-2 truncate text-base font-semibold text-slate-800">
        {orden.cliente?.nombre_completo ?? "Cliente sin nombre"}
      </p>

      <div className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
        {orden.es_servicio_aeropuerto && (
          <span aria-hidden className="text-base leading-none">
            ✈️
          </span>
        )}
        <span className="truncate">
          {orden.experiencia?.nombre_tour ?? "Experiencia sin asignar"}
        </span>
      </div>
    </Link>
  );
}
