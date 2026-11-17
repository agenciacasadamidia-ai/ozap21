import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut, Users, BarChart3, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();

  async function sair() {
    localStorage.removeItem("pp_admin");
    navigate({ to: "/admin/login" });
  }

  let admin: { email?: string } | null = null;
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem("pp_admin");
      admin = raw ? (JSON.parse(raw) as { email?: string }) : null;
    } catch {
      admin = null;
    }
  }

  return (
    <div className="min-h-screen bg-[#0b0c10] text-[#e8e8ea] flex flex-col">
      <header className="sticky top-0 z-20 flex items-center justify-between gap-2 px-5 py-4 bg-[#0b0c10]/90 backdrop-blur border-b border-white/5">
        <div className="flex items-center gap-2">
          <Shield className="size-6 text-[#38bdf8]" />
          <span className="font-bold text-xl tracking-tight">
            Admin<span className="text-[#38bdf8]">Player</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden sm:block text-xs text-[#888]">{admin?.email}</span>
          <Button
            onClick={sair}
            variant="outline"
            size="sm"
            className="text-white/80 border-white/10 hover:text-white hover:border-white"
          >
            <LogOut className="size-4 mr-1" /> Sair
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="hidden md:flex w-64 flex-col border-r border-white/10 bg-[#0a0b12] shrink-0">
          <div className="p-5 border-b border-white/5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#667085]">Navegação</h2>
          </div>
          <nav className="flex-1 overflow-y-auto p-2 space-y-1">
            <NavItem
              label="Estatísticas"
              icon={<BarChart3 className="size-4" />}
              to="/admin/estatisticas"
            />
            <NavItem label="Usuários" icon={<Users className="size-4" />} to="/admin/usuarios" />
          </nav>
          <div className="p-4 border-t border-white/5">
            <button
              onClick={sair}
              className="w-full flex items-center gap-2 text-sm text-[#a1a1aa] hover:text-white px-3 py-2 rounded-lg transition"
            >
              <LogOut className="size-4" /> Encerrar sessão
            </button>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto p-5 md:p-8">{children}</main>
      </div>
    </div>
  );
}

function NavItem({ label, icon, to }: { label: string; icon: React.ReactNode; to: string }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate({ to })}
      className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-[#a1a1aa] hover:text-white hover:bg-white/5 transition"
    >
      {icon}
      <span className="flex-1">{label}</span>
      <span className="text-[#667085] text-[10px]">▾</span>
    </button>
  );
}
