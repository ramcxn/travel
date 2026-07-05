// Esqueleto visual del dashboard. Pendiente: conectar cada tarjeta a
// consultas reales de Supabase (ordenes_servicio, control_cobranza).

const TARJETAS = [
  { label: "Servicios hoy", valor: "—", icon: "🗓️" },
  { label: "Ingresos del día", valor: "—", icon: "💵" },
  { label: "Saldos pendientes", valor: "—", icon: "⚠️" },
  { label: "Operadores activos", valor: "—", icon: "🧑‍✈️" },
];

export default function AdminDashboardPage() {
  return (
    <div className="px-4 py-6 md:px-8 lg:px-10">
      <header className="mb-6">
        <p className="text-sm font-medium text-sky-600">Administración</p>
        <h1 className="text-2xl font-extrabold text-slate-900">
          Resumen del día
        </h1>
      </header>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {TARJETAS.map((t) => (
          <div
            key={t.label}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card"
          >
            <span className="text-2xl">{t.icon}</span>
            <p className="mt-3 text-2xl font-extrabold text-slate-900">
              {t.valor}
            </p>
            <p className="text-sm text-slate-500">{t.label}</p>
          </div>
        ))}
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-400">
            Servicios en curso
          </h2>
          <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-slate-200 text-sm text-slate-400">
            Pendiente de conectar a ordenes_servicio
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-400">
            Alertas de cobranza
          </h2>
          <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-slate-200 text-sm text-slate-400">
            Pendiente de conectar a control_cobranza
          </div>
        </div>
      </section>
    </div>
  );
}
