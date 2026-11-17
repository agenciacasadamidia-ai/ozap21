import { createContext, useContext, useCallback, useState, useEffect, type ReactNode } from "react";

type UsuarioPlayer = {
  id: string;
  nome: string;
  usuario: string;
  m3u8_url: string | null;
};

interface PlayerContextoTipo {
  usuario: UsuarioPlayer | null;
  setUsuario: (u: UsuarioPlayer | null) => void;
  busca: string;
  setBusca: (busca: string) => void;
  favoritos: string[];
  toggleFavorito: (canalId: string) => void;
  estaFavorito: (canalId: string) => boolean;
}

const PlayerContexto = createContext<PlayerContextoTipo | null>(null);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuarioState] = useState<PlayerContextoTipo["usuario"]>(() => {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem("pp_usuario");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [favoritos, setFavoritos] = useState<string[]>([]);
  const [busca, setBusca] = useState("");

  const setUsuario = useCallback((u: UsuarioPlayer | null) => {
    setUsuarioState(u);
    try {
      if (u) localStorage.setItem("pp_usuario", JSON.stringify(u));
      else localStorage.removeItem("pp_usuario");
    } catch {
      return;
    }
  }, []);

  const toggleFavorito = useCallback(
    (canalId: string) => {
      if (!usuario) return;
      const next = favoritos.includes(canalId)
        ? favoritos.filter((id) => id !== canalId)
        : [...favoritos, canalId];
      setFavoritos(next);
      try {
        localStorage.setItem("pp_favoritos_" + usuario.id, JSON.stringify(next));
      } catch {
        void 0;
      }
    },
    [usuario, favoritos],
  );

  const estaFavorito = useCallback((canalId: string) => favoritos.includes(canalId), [favoritos]);

  useEffect(() => {
    if (!usuario) {
      setFavoritos([]);
      return;
    }
    try {
      const salvo = localStorage.getItem("pp_favoritos_" + usuario.id);
      setFavoritos(salvo ? (JSON.parse(salvo) as string[]) : []);
    } catch {
      setFavoritos([]);
    }
  }, [usuario?.id]);

  return (
    <PlayerContexto.Provider
      value={{ usuario, setUsuario, busca, setBusca, favoritos, toggleFavorito, estaFavorito }}
    >
      {children}
    </PlayerContexto.Provider>
  );
}

export function usePlayer() {
  const ctx = useContext(PlayerContexto);
  if (!ctx) throw new Error("usePlayer deve ser usado dentro de PlayerProvider");
  return ctx;
}
