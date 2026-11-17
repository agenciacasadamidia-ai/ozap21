import { createFileRoute, redirect } from "@tanstack/react-router";
import { UsuariosAdmin } from "@/components/admin/usuarios-crud";
import { AdminLayout } from "@/components/admin/admin-layout";

export const Route = createFileRoute("/admin/usuarios")({
  ssr: false,
  head: () => ({ meta: [{ title: "Player Pro — Admin | Usuários" }] }),
  beforeLoad: async () => {
    const admin = typeof window !== "undefined" ? localStorage.getItem("pp_admin") : null;
    if (!admin) {
      throw redirect({ to: "/admin/login" });
    }
  },
  component: UsuariosPage,
});

function UsuariosPage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl font-bold tracking-tight">Usuários</h1>
            <p className="text-xs text-[#888]">Cadastre e gerencie os clientes do player IPTV.</p>
          </div>
        </div>
        <UsuariosAdmin />
      </div>
    </AdminLayout>
  );
}
