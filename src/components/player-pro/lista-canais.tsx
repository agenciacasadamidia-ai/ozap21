import { Link } from "@tanstack/react-router";
import { usePlayer } from "@/components/player-pro/player-provider";
import { Star, Play, Loader2, Tv } from "lucide-react";
import { placeholderLogo } from "@/lib/player-pro.m3u8";
import { type Canal } from "@/lib/player-pro.m3u8";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ListaCanaisProps {
  canais: Canal[];
  carregando?: boolean;
}

export function ListaCanais({ canais, carregando = false }: ListaCanaisProps) {
  const { toggleFavorito, estaFavorito } = usePlayer();
  const exibidos = canais;

  if (carregando) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-white/40">
        <Loader2 className="animate-spin size-10 mb-2" />
        <p className="text-sm">Carregando canais…</p>
      </div>
    );
  }

  if (exibidos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-white/40">
        <Tv className="size-16 mb-3 opacity-50" />
        <p className="text-sm">Nenhum canal encontrado.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
      {exibidos.map((canal) => (
        <CanalCard
          key={canal.id}
          canal={canal}
          estaFavoritoAtivo={estaFavorito(canal.id)}
          toggleFavorito={toggleFavorito}
        />
      ))}
    </div>
  );
}

function CanalCard({
  canal,
  estaFavoritoAtivo,
  toggleFavorito,
}: {
  canal: Canal;
  estaFavoritoAtivo: boolean;
  toggleFavorito: (id: string) => void;
}) {
  return (
    <Link
      to="/player/canal/$id"
      params={{ id: canal.id }}
      search={{
        url: canal.url,
        nome: canal.nome,
        logo: canal.logo ?? "",
        grupo: canal.grupo,
        categoria: canal.categoria,
      }}
      className="group block"
    >
      <div className="relative aspect-video rounded-xl overflow-hidden bg-[#111] border border-white/10 hover:border-[#10b981]/50 transition-all group-hover:scale-[1.02] cursor-pointer">
        <img
          src={canal.logo || placeholderLogo(canal.nome)}
          alt={canal.nome}
          className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
          <div className="flex items-end gap-2 w-full">
            <span className="text-xs font-bold text-white truncate">{canal.nome}</span>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleFavorito(canal.id);
              }}
              className={`p-1.5 rounded transition ${estaFavoritoAtivo ? "text-[#facc15]" : "text-white/60 hover:text-white"}`}
              aria-label={estaFavoritoAtivo ? "Remover dos favoritos" : "Adicionar aos favoritos"}
            >
              <Star className={`size-4 ${estaFavoritoAtivo ? "fill-current" : ""}`} />
            </button>
          </div>
        </div>
        <Badge
          variant="outline"
          className="absolute top-2 left-2 text-[10px] border-white/20 text-white/80 bg-black/60 backdrop-blur"
        >
          {canal.categoria}
        </Badge>
        <div className="absolute bottom-2 left-2 right-2">
          <Play className="size-12 text-[#10b981] bg-black/40 p-1 rounded-full drop-shadow-lg" />
        </div>
      </div>
      <div className="mt-1 text-xs text-white/70 truncate">{canal.nome}</div>
      <div className="text-[10px] text-white/40 truncate">{canal.grupo}</div>
    </Link>
  );
}
