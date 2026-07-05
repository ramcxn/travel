import type { OrdenEstatus } from "@/lib/types";

const ESTATUS_CONFIG: Record<
  OrdenEstatus,
  { label: string; className: string }
> = {
  cotizado: { label: "Cotizado", className: "bg-slate-100 text-slate-600" },
  confirmado: { label: "Confirmado", className: "bg-sky-100 text-sky-700" },
  pagado: { label: "Pagado", className: "bg-cyan-100 text-cyan-700" },
  en_espera: { label: "En espera", className: "bg-amber-100 text-amber-800" },
  en_progreso: {
    label: "En progreso",
    className: "bg-blue-100 text-blue-700",
  },
  finalizado: {
    label: "Finalizado",
    className: "bg-emerald-100 text-emerald-700",
  },
  cancelado: { label: "Cancelado", className: "bg-red-100 text-red-700" },
};

export function StatusBadge({ estatus }: { estatus: OrdenEstatus }) {
  const config = ESTATUS_CONFIG[estatus];

  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${config.className}`}
    >
      {estatus === "en_progreso" && (
        <span className="mr-1.5 h-1.5 w-1.5 animate-pulse-rec rounded-full bg-blue-600" />
      )}
      {config.label}
    </span>
  );
}
