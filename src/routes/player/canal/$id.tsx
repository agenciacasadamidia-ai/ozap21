import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { PlayerVideo } from "@/components/player-pro/player-video";
import { Tv, ArrowLeft, Play } from "lucide-react";
import { Card } from "@/components/ui/card";

type CanalSearch = {
  url?: string;
  nome?: string;
  logo?: string | null;
  grupo?: string;
  categoria?: string;
};

export const Route = createFileRoute("/player/canal/$id")({
  ssr: false,
  head: () => ({ meta: [{ title: "Player Pro — Canal ao vivo" }] }),
  validateSearch: (s: Record<string, unknown>): CanalSearch => ({
    url: typeof s.url === "string" ? s.url : "",
    nome: typeof s.nome === "string" ? s.nome : "Canal",
    logo: typeof s.logo === "string" ? s.logo : undefined,
    grupo: typeof s.grupo === "string" ? s.grupo : "Geral",
    categoria: typeof s.categoria === "string" ? s.categoria : "Ao Vivo",
  }),
  beforeLoad: () => {
    if (typeof window !== "undefined" && !localStorage.getItem("pp_usuario")) {
      throw redirect({ to: "/player/login" });
    }
  },
  component: CanalPage,
});

function CanalPage() {
  const search = Route.useSearch();
  const url = search.url ?? "";
  const nome = search.nome ?? "Canal";
  const logo = search.logo ?? null;
  const grupo = search.grupo ?? "Geral";
  const categoria = search.categoria ?? "Ao Vivo";

  if (!url) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] px-4">
        <Card className="p-8 text-center bg-[#111] border border-white/10">
          <Tv className="size-12 mx-auto mb-3 text-white/40" />
          <h2 className="text-lg font-bold text-white mb-1">Canal não encontrado</h2>
          <p className="text-sm text-white/50 mb-4">
            Não há URL de vídeo informada para este canal.
          </p>
          <Link
            to="/player"
            className="inline-flex items-center gap-2 text-[#10b981] hover:text-[#12e39a]"
          >
            <ArrowLeft className="size-4" /> Voltar aos canais
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#0a0a0a]">
      <header className="sticky top-0 z-10 px-4 py-3 bg-[#0a0a0a]/90 backdrop-blur border-b border-white/5 flex items-center justify-between">
        <Link to="/player" className="flex items-center gap-2 text-white/70 hover:text-white">
          <ArrowLeft className="size-4" /> <span>Voltar aos canais</span>
        </Link>
        <div className="flex items-center gap-2 text-xs text-white/40">
          <Play className="size-3.5 text-[#10b981]" />
          <span>Ao vivo · {categoria}</span>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-6">
        <Card className="border border-white/10 bg-black shadow-2xl overflow-hidden">
          <div className="p-3 sm:p-4 border-b border-white/5 flex items-center justify-between bg-[#0a0a0a]">
            <div className="flex items-center gap-3">
              {logo ? (
                <img
                  src={logo}
                  alt={nome}
                  className="size-10 rounded object-cover border border-white/20"
                />
              ) : (
                <div className="size-10 rounded-full grid place-items-center text-[#10b981] font-bold border border-[#10b981]/30">
                  {nome.slice(0, 1).toUpperCase()}
                </div>
              )}
              <div>
                <h2 className="font-bold text-white text-lg truncate">{nome}</h2>
                <p className="text-xs text-white/50">{grupo}</p>
              </div>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center bg-black">
            <PlayerVideo url={url} nome={nome} logo={logo} grupo={grupo} categoria={categoria} />
          </div>
        </Card>
      </main>
    </div>
  );
}
