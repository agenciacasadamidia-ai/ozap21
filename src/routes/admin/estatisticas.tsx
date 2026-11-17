import { createFileRoute, redirect } from "@tanstack/react-router";
import { EstatisticasAdmin } from "@/components/admin/estatisticas";
import { AdminLayout } from "@/components/admin/admin-layout";

export const Route = createFileRoute("/admin/estatisticas")({
  ssr: false,
  head: () => ({ meta: [{ title: "Player Pro — Admin | Estatísticas" }] }),
  beforeLoad: async () => {
    const admin = typeof window !== "undefined" ? localStorage.getItem("pp_admin") : null;
    if (!admin) {
      throw redirect({ to: "/admin/login" });
    }
  },
  component: EstatisticasPage,
});

function EstatisticasPage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl font-bold tracking-tight">Estatísticas</h1>
            <p className="text-xs text-[#888]">Visão geral dos clientes IPTV cadastrados.</p>
          </div>
        </div>
        <EstatisticasAdmin />
      </div>
    </AdminLayout>
  );
}
