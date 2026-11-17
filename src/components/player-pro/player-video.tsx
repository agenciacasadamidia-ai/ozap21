"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Hls from "hls.js";
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, Tv, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PlayerVideoProps {
  url: string;
  nome: string;
  logo: string | null;
  grupo: string;
  categoria: string;
}

export function PlayerVideo({ url, nome, logo, grupo, categoria }: PlayerVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [playing, setPlaying] = useState(false);
  const [volumeMutado, setVolumeMutado] = useState(false);
  const [telaCheia, setTelaCheia] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const destruirHls = useCallback(() => {
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    destruirHls();

    setCarregando(true);
    setErro(null);

    try {
      if (Hls.isSupported() && /\.m3u8(\?|$)/i.test(url)) {
        const hls = new Hls({ enableWorker: false });
        hls.loadSource(url);
        hls.attachMedia(video);
        hlsRef.current = hls;
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setCarregando(false);
          void video.play().catch(() => {});
        });
        hls.on(Hls.Events.ERROR, (_event, dados) => {
          if (!dados.fatal) return;
          if (dados.type === Hls.ErrorTypes.NETWORK_ERROR) hls.startLoad();
          else if (dados.type === Hls.ErrorTypes.MEDIA_ERROR) hls.recoverMediaError();
          else {
            setCarregando(false);
            setErro("Erro ao carregar o stream HLS.");
          }
        });
      } else if (video.canPlayType("application/vnd.apple.mpegurl") && /\.m3u8(\?|$)/i.test(url)) {
        video.src = url;
        video.onloadeddata = () => setCarregando(false);
        video.onerror = () => {
          setCarregando(false);
          setErro("Não foi possível reproduzir este vídeo.");
        };
      } else {
        // Fallback: tenta reproduzir direto (MP4 etc.)
        video.src = url;
        video.onloadeddata = () => setCarregando(false);
        video.onerror = () => {
          setCarregando(false);
          setErro("Não foi possível reproduzir este vídeo.");
        };
      }
    } catch {
      setCarregando(false);
      setErro("Erro ao inicializar o player.");
    }

    return () => {
      destruirHls();
      video.src = "";
    };
  }, [url, destruirHls]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (playing) video.pause();
    else video.play().catch(() => {});
  };

  const alternarTelaCheia = () => {
    const el = videoRef.current;
    if (!el) return;
    if (!telaCheia) {
      el.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setTelaCheia((p) => !p);
  };

  useEffect(() => {
    const onChange = () => setTelaCheia(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  if (erro) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-[#0a0a0a] text-white/60 rounded-2xl border border-white/10">
        <Tv className="size-24 mb-4 opacity-30" />
        <p className="text-sm font-medium">{erro}</p>
      </div>
    );
  }

  return (
    <div className="group relative w-full aspect-video bg-black rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
      <video
        ref={videoRef}
        className="w-full h-full object-contain bg-black"
        autoPlay={false}
        playsInline
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />
      {carregando && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-10">
          <Loader2 className="animate-spin size-10 text-[#10b981] mb-2" />
          <p className="text-white/80 text-sm">Carregando canal…</p>
        </div>
      )}
      {/* Controles sobrepostos (hover) */}
      <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity group">
        <button
          onClick={togglePlay}
          className="pointer-events-auto size-14 rounded-full bg-black/60 backdrop-blur text-white flex items-center justify-center shadow-lg hover:bg-[#10b981] transition"
          aria-label={playing ? "Pausar" : "Reproduzir"}
        >
          {playing ? <Pause className="size-5" /> : <Play className="size-5" />}
        </button>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent z-30 flex items-center justify-between gap-2 pointer-events-auto">
        <div className="flex items-center gap-2 min-w-0">
          {logo ? (
            <img
              src={logo}
              alt={nome}
              className="size-8 rounded object-cover border border-white/20"
            />
          ) : (
            <div className="size-8 rounded-full grid place-items-center text-[#10b981] font-bold border border-[#10b981]/30">
              {nome.slice(0, 1).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <div className="text-sm font-bold text-white truncate">{nome}</div>
            <div className="text-xs text-white/50 truncate">
              {grupo} · {categoria}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              setVolumeMutado((p) => {
                const next = !p;
                const v = videoRef.current;
                if (v) v.muted = next;
                return next;
              });
            }}
            className="size-8 rounded text-white/80 hover:text-white hover:bg-white/10"
            title="Áudio"
          >
            {volumeMutado ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
          </button>
          <Button
            size="icon"
            onClick={alternarTelaCheia}
            className="text-white/80 hover:text-white hover:bg-white/10"
            title={telaCheia ? "Sair da tela cheia" : "Tela cheia"}
          >
            {telaCheia ? <Minimize className="size-4" /> : <Maximize className="size-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
