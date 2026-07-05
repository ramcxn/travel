import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: usuario } = await supabase
    .from("usuarios")
    .select("rol")
    .eq("id", user.id)
    .single<{ rol: string }>();

  // Solo admin/cobranza tienen acceso al panel de escritorio.
  if (!usuario || !["admin", "cobranza"].includes(usuario.rol)) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 md:flex-row">
      <AdminSidebar />
      <main className="flex-1 md:min-w-0">{children}</main>
    </div>
  );
}
