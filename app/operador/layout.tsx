import { OperadorTopBar } from "@/components/operador/OperadorTopBar";

// Layout mobile-first para /operador/*: sin sidebar, solo una barra
// superior delgada (back + cerrar sesión). La verificación de sesión
// y de rol vive en cada page.tsx (agenda, servicio/[id]) para evitar
// loops de redirección con /operador/login.
export default function OperadorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <OperadorTopBar />
      {children}
    </div>
  );
}
