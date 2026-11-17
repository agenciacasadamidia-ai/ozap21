import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  LogOut,
  User,
  Tv,
  Film,
  PlaySquare,
  Search as SearchIcon,
  Menu,
  ChevronDown,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePlayer } from "@/components/player-pro/player-provider";
import { cn } from "@/lib/utils";

export function PlayerLayout({ children }: { children: React.ReactNode }) {
  const { usuario, setUsuario, busca, setBusca } = usePlayer();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  function sair() {
    setUsuario(null);
    navigate({ to: "/player/login" });
  }

  if (!usuario) return null;

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-20 flex items-center justify-between gap-2 px-4 py-3 bg-[#0f0f0f]/80 backdrop-blur border-b border-white/5">
        <div className="flex items-center gap-2">
          <button
            className="md:hidden size-9 rounded-lg text-white/70 hover:text-white"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="size-5" />
          </button>
          <div className="flex items-center gap-1.5">
            <Tv className="size-6 text-[#10b981]" />
            <span className="font-bold text-xl tracking-tight">
              Player<span className="text-[#10b981]">Pro</span>
            </span>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-3">
          <div className="relative">
            <SearchIcon className="absolute left-2.5 top-2.5 size-4 text-white/40" />
            <Input
              placeholder="Buscar canais…"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-9 pr-8 bg-[#1a1a1a] border border-white/10 text-white placeholder-white/40 focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981] w-64"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 text-white/80 text-sm font-medium">
            <User className="size-4 text-[#10b981]" />
            <span>{usuario.nome}</span>
          </div>
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
        {/* Sidebar mobile overlay */}
        {sidebarOpen && (
          <div
            className="md:hidden fixed inset-0 z-30 bg-black/80 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <aside
          className={cn(
            "w-72 flex-col border-r border-white/10 bg-[#0a0a0a] shrink-0",
            sidebarOpen ? "fixed inset-y-0 left-0 z-40 flex" : "hidden md:flex",
          )}
        >
          <div className="p-4 border-b border-white/5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-white/50">Categorias</h2>
          </div>
          <nav className="flex-1 overflow-y-auto p-2 space-y-1">
            <NavItemCat
              label="Ao Vivo"
              icon={<Tv className="size-4" />}
              categoria="Ao Vivo"
              onNavigate={() => setSidebarOpen(false)}
            />
            <NavItemCat
              label="Filmes"
              icon={<Film className="size-4" />}
              categoria="Filmes"
              onNavigate={() => setSidebarOpen(false)}
            />
            <NavItemCat
              label="Séries"
              icon={<PlaySquare className="size-4" />}
              categoria="Séries"
              onNavigate={() => setSidebarOpen(false)}
            />
            <div className="pt-3 border-t border-white/5 mb-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-white/50">
                Minha lista
              </h2>
            </div>
            <NavItemCat
              label="Favoritos"
              icon={<Star className="size-4" />}
              favoritos
              onNavigate={() => setSidebarOpen(false)}
            />
          </nav>
          <div className="p-4 border-t border-white/5">
            <button
              onClick={sair}
              className="w-full flex items-center gap-2 text-sm text-white/70 hover:text-white px-3 py-2 rounded-lg transition"
            >
              <LogOut className="size-4" /> Encerrar sessão
            </button>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}

function NavItemCat({
  label,
  icon,
  categoria,
  favoritos,
  onNavigate,
}: {
  label: string;
  icon: React.ReactNode;
  categoria?: string;
  favoritos?: boolean;
  onNavigate: () => void;
}) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => {
        onNavigate();
        navigate({
          to: "/player",
          search: favoritos
            ? { favoritos: "1" }
            : { categoria: categoria === "Ao Vivo" ? undefined : categoria },
        });
      }}
      className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-white/60 hover:text-white hover:bg-white/5 transition"
    >
      {icon}
      <span className="flex-1">{label}</span>
      <ChevronDown className="size-3.5 text-white/30" />
    </button>
  );
}
