export type Categoria = "Ao Vivo" | "Filmes" | "Séries";

export interface Canal {
  id: string;
  nome: string;
  url: string;
  logo: string | null;
  grupo: string;
  categoria: Categoria;
  tvgId: string | null;
  tvgName: string | null;
}

interface ParsedExtInf {
  tvgId: string | null;
  tvgName: string | null;
  tvgLogo: string | null;
  groupTitle: string | null;
  nome: string;
}

function extrairAtributos(inf: string): ParsedExtInf {
  const tvgId = inf.match(/tvg-id="([^"]*)"/)?.[1] ?? null;
  const tvgName = inf.match(/tvg-name="([^"]*)"/)?.[1] ?? null;
  const tvgLogo = inf.match(/tvg-logo="([^"]*)"/)?.[1] ?? null;
  const groupTitle = inf.match(/group-title="([^"]*)"/)?.[1] ?? null;

  // Nome do canal está após a última vírgula
  const ultimaVirgula = inf.lastIndexOf(",");
  const nome = ultimaVirgula !== -1 ? inf.slice(ultimaVirgula + 1).trim() : inf.trim();

  return { tvgId, tvgName, tvgLogo, groupTitle, nome };
}

function categoriaDoGrupo(groupTitle: string | null): Categoria {
  const g = (groupTitle || "").toLowerCase();
  if (g.includes("filme") || g.includes("movie")) return "Filmes";
  if (g.includes("série") || g.includes("series") || g.includes("novela")) return "Séries";
  return "Ao Vivo";
}

function slugId(nome: string, index: number): string {
  const base = (nome || `canal-${index}`)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${base || "canal"}-${index}`;
}

function resolverUrl(url: string, baseUrl?: string): string {
  if (!baseUrl) return url;
  try {
    return new URL(url, baseUrl).toString();
  } catch {
    return url;
  }
}

/**
 * Faz o parse de uma playlist M3U8/M3U e extrai canais, grupos e categorias.
 * Tolerante a linhas vazias, comentários e playlists sem #EXTINF.
 */
export function parseM3U8(
  texto: string,
  baseUrl?: string,
): {
  canais: Canal[];
  categorias: Categoria[];
  grupos: string[];
} {
  const linhas = texto
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const canais: Canal[] = [];
  let i = 0;

  while (i < linhas.length) {
    const linha = linhas[i];
    if (linha.startsWith("#EXTINF")) {
      const inf = linha.replace(/^#EXTINF:[-0-9.]*\s*/, "").trim();
      const parsed = extrairAtributos(inf);
      // A URL do canal está na próxima linha não-comentário
      let url = "";
      let j = i + 1;
      while (j < linhas.length && (linhas[j].startsWith("#") || linhas[j] === "")) j++;
      if (j < linhas.length) {
        url = resolverUrl(linhas[j], baseUrl);
        i = j + 1;
      } else {
        i++;
      }
      if (!url) continue;
      canais.push({
        id: slugId(parsed.nome, canais.length),
        nome: parsed.nome || "Canal sem nome",
        url,
        logo: parsed.tvgLogo,
        grupo: parsed.groupTitle || "Geral",
        categoria: categoriaDoGrupo(parsed.groupTitle),
        tvgId: parsed.tvgId,
        tvgName: parsed.tvgName,
      });
    } else {
      i++;
    }
  }

  const grupos = Array.from(new Set(canais.map((c) => c.grupo))).sort();
  const categorias: Categoria[] = [];
  for (const c of ["Ao Vivo", "Filmes", "Séries"] as Categoria[]) {
    if (canais.some((canal) => canal.categoria === c)) categorias.push(c);
  }

  return { canais, categorias, grupos };
}

/** Filtra canais por termo de busca (nome ou grupo). */
export function filtrarCanais(canais: Canal[], termo: string): Canal[] {
  const t = termo.toLowerCase().trim();
  if (!t) return canais;
  return canais.filter(
    (c) =>
      c.nome.toLowerCase().includes(t) ||
      c.grupo.toLowerCase().includes(t) ||
      c.categoria.toLowerCase().includes(t),
  );
}

/** Imagem local (SVG) para canais sem logo, sem dependência de rede. */
export function placeholderLogo(nome: string): string {
  const inicial = (nome || "C")
    .slice(0, 1)
    .toUpperCase()
    .replace(/[<>&"']/g, "");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="#101511"/><circle cx="100" cy="100" r="78" fill="#10b981" opacity="0.18"/><text x="100" y="132" font-family="Arial,sans-serif" font-size="88" font-weight="bold" fill="#10b981" text-anchor="middle">${inicial}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
