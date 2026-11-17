import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { parseM3U8, filtrarCanais, type Canal } from "@/lib/player-pro.m3u8";
import { PlayerProvider, usePlayer } from "@/components/player-pro/player-provider";
import { PlayerLayout } from "@/components/player-pro/player-layout";
import { ListaCanais } from "@/components/player-pro/lista-canais";
import { PlayerVideo } from "@/components/player-pro/player-video";
import { Search, Tv, Film, PlaySquare, Star, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const M3U8_EXEMPLO = `#EXTM3U
#EXTINF:-1 tvg-id="demo-1" group-title="Ao Vivo",Canal Demo ao vivo
https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8
#EXTINF:-1 tvg-id="demo-2" group-title="Ao Vivo",Notícias Demo
https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8
#EXTINF:-1 tvg-id="demo-10" group-title="Filmes",Big Buck Bunny
https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4
#EXTINF:-1 tvg-id="demo-11" group-title="Filmes",Elephants Dream
https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4
#EXTINF:-1 tvg-id="demo-20" group-title="Séries",Episódio Demo 1
https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4
#EXTINF:-1 tvg-id="demo-21" group-title="Séries",Episódio Demo 2
https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4
`;

type PlayerSearch = { categoria?: string; favoritos?: "1" };

export const Route = createFileRoute("/player/")({
  ssr: false,
  head: () => ({ meta: [{ title: "Player Pro — Canais" }] }),
  validateSearch: (s: Record<string, unknown>): PlayerSearch => ({
    categoria: typeof s.categoria === "string" ? s.categoria : undefined,
    favoritos: s.favoritos === "1" ? "1" : undefined,
  }),
  beforeLoad: () => {
    if (typeof window !== "undefined" && !localStorage.getItem("pp_usuario")) {
      throw redirect({ to: "/player/login" });
    }
  },
  component: PlayerPage,
});

function PlayerPage() {
  return (
    <PlayerProvider>
      <PlayerConteudo />
    </PlayerProvider>
  );
}

function PlayerConteudo() {
  const { usuario, busca: termo, setBusca: setTermo, favoritos } = usePlayer();
  const search = Route.useSearch();
  const categoria = search.categoria;
  const favoritosApenas = search.favoritos === "1";

  const [carregando, setCarregando] = useState(true);
  const [canais, setCanais] = useState<Canal[]>([]);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    (async () => {
      try {
        setCarregando(true);
        const url = usuario?.m3u8_url ?? null;
        let texto = "";

        if (url) {
          try {
            const res = await fetch(url, { cache: "no-store" });
            if (!res.ok) throw new Error("Falha ao baixar a playlist");
            texto = await res.text();
          } catch {
            texto = M3U8_EXEMPLO;
            setErro("Não foi possível carregar sua lista M3u8. Exibindo canais de exemplo.");
          }
        } else {
          texto = M3U8_EXEMPLO;
        }

        if (cancelado) return;
        const { canais: parseados } = parseM3U8(texto, url ?? undefined);
        setCanais(parseados);
      } catch (e) {
        if (cancelado) return;
        setErro(e instanceof Error ? e.message : "Erro ao carregar canais");
      } finally {
        if (!cancelado) setCarregando(false);
      }
    })();
    return () => {
      cancelado = true;
    };
  }, [usuario?.m3u8_url]);

  let exibidos = filtrarCanais(canais, termo);
  if (categoria) exibidos = exibidos.filter((c) => c.categoria === categoria);
  if (favoritosApenas) exibidos = exibidos.filter((c) => favoritos.includes(c.id));

  return (
    <PlayerLayout>
      <div className="space-y-5">
        <header className="flex items-end justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            <h1 className="font-bold text-2xl tracking-tight">Meus Canais</h1>
            <p className="text-xs text-white/50 truncate max-w-lg">
              {usuario?.m3u8_url
                ? `Lista: ${usuario.m3u8_url}`
                : "Sem lista configurada — exibindo canais de demonstração"}
            </p>
          </div>
          <div className="flex items-end gap-2 flex-wrap">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 size-4 text-white/40" />
              <input
                type="text"
                placeholder="Buscar canais…"
                value={termo}
                onChange={(e) => setTermo(e.target.value)}
                className="pl-9 pr-3 py-2 bg-[#1a1a1a] border border-white/10 rounded-lg text-white placeholder-white/40 focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981] w-64 text-sm"
              />
            </div>
            <div className="flex gap-1 flex-wrap">
              <FiltroButton
                ativo={!categoria && !favoritosApenas}
                to="/player"
                icone={<Tv className="size-4" />}
                rotulo="Todos"
              />
              <FiltroButton
                ativo={categoria === "Ao Vivo"}
                to="/player"
                search={{ categoria: "Ao Vivo" }}
                icone={<Tv className="size-4" />}
                rotulo="Ao Vivo"
              />
              <FiltroButton
                ativo={categoria === "Filmes"}
                to="/player"
                search={{ categoria: "Filmes" }}
                icone={<Film className="size-4" />}
                rotulo="Filmes"
              />
              <FiltroButton
                ativo={categoria === "Séries"}
                to="/player"
                search={{ categoria: "Séries" }}
                icone={<PlaySquare className="size-4" />}
                rotulo="Séries"
              />
              <FiltroButton
                ativo={favoritosApenas}
                to="/player"
                search={{ favoritos: "1" }}
                icone={<Star className="size-4" />}
                rotulo="Favoritos"
              />
            </div>
          </div>
        </header>

        {erro && (
          <Card className="border-amber-500/20 bg-amber-500/5">
            <div className="p-4 flex items-start gap-3">
              <AlertTriangle className="size-5 text-amber-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm text-amber-200 font-medium">Aviso</p>
                <p className="text-xs text-amber-300/80 mt-0.5">{erro}</p>
              </div>
            </div>
          </Card>
        )}

        <div className="rounded-xl border border-white/10 bg-[#0a0a0a] p-3">
          <ListaCanais canais={exibidos} carregando={carregando} />
        </div>
        <p className="text-[11px] text-white/40">
          {exibidos.length} canal{exibidos.length !== 1 ? "s" : ""} disponível
          {exibidos.length !== 1 ? "eis" : ""}
        </p>
      </div>
    </PlayerLayout>
  );
}

function FiltroButton({
  ativo,
  icone,
  rotulo,
  to,
  search,
}: {
  ativo: boolean;
  icone: React.ReactNode;
  rotulo: string;
  to: "/player";
  search?: { categoria?: string; favoritos?: "1" };
}) {
  return (
    <Button
      variant={ativo ? "default" : "outline"}
      size="sm"
      asChild
      className={ativo ? "bg-[#10b981] text-black" : "text-white/70 border-white/10"}
    >
      <Link to={to} search={search} className="flex items-center gap-1.5">
        {icone} {rotulo}
      </Link>
    </Button>
  );
}
