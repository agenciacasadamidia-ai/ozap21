"use server";

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

type PpUsuario = {
  id: string;
  nome: string;
  usuario: string;
  senha_hash: string;
  m3u8_url: string | null;
  expiracao: string | null;
  status: "ativo" | "bloqueado" | "expirado";
  created_at: string;
  updated_at: string;
};

type PpAdmin = {
  id: string;
  email: string;
  role: string;
  senha_hash: string;
  created_at: string;
};

async function adminClient() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

async function hashSenha(senha: string): Promise<string> {
  const bytes = new TextEncoder().encode(`${senha}:playerpro-v1`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  const hex = Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `sha256-salt:${hex}`;
}

async function senhaCorreta(senha: string, armazenado: string): Promise<boolean> {
  const calculado = await hashSenha(senha);
  return calculado === armazenado;
}

function usuarioSemSenha(u: PpUsuario) {
  const { senha_hash: _senha_hash, ...rest } = u;
  return rest;
}

function agoraISO() {
  return new Date().toISOString();
}

function statusPorExpiracao(
  expiracao: string | null,
  statusAtual: "ativo" | "bloqueado" | "expirado",
): "ativo" | "bloqueado" | "expirado" {
  if (statusAtual === "bloqueado") return "bloqueado";
  if (expiracao && new Date(expiracao) < new Date()) return "expirado";
  return "ativo";
}

/** Lista todos os usuários clientes do IPTV. */
export const listarUsuarios = createServerFn({ method: "GET" }).handler(async () => {
  const sb = await adminClient();
  const { data, error } = await sb
    .from("pp_usuarios")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((u: PpUsuario) => ({
    ...usuarioSemSenha(u),
    status: statusPorExpiracao(u.expiracao, u.status),
  }));
});

/** Cria um novo usuário cliente. */
export const criarUsuario = createServerFn({ method: "POST" })
  .validator(
    z.object({
      nome: z.string().min(2, "Nome obrigatório"),
      usuario: z.string().min(3, "Usuário obrigatório"),
      senha: z.string().min(4, "Senha muito curta"),
      m3u8_url: z.string().url("URL inválida").optional().or(z.literal("")),
      expiracao: z.string().optional().or(z.literal("")),
      status: z.enum(["ativo", "bloqueado", "expirado"]).default("ativo"),
    }),
  )
  .handler(async ({ data }) => {
    const sb = await adminClient();
    const { data: existente } = await sb
      .from("pp_usuarios")
      .select("id")
      .eq("usuario", data.usuario)
      .maybeSingle();
    if (existente) throw new Error("Usuário já cadastrado");

    const expiracao = data.expiracao || null;
    const status = statusPorExpiracao(expiracao, data.status);

    const { data: criado, error } = await sb
      .from("pp_usuarios")
      .insert([
        {
          nome: data.nome,
          usuario: data.usuario,
          senha_hash: await hashSenha(data.senha),
          m3u8_url: data.m3u8_url || null,
          expiracao,
          status,
          created_at: agoraISO(),
          updated_at: agoraISO(),
        },
      ])
      .select()
      .single();
    if (error) throw error;
    return usuarioSemSenha(criado as PpUsuario);
  });

/** Atualiza um usuário cliente existente. */
export const atualizarUsuario = createServerFn({ method: "POST" })
  .validator(
    z.object({
      id: z.string().uuid(),
      nome: z.string().min(2),
      usuario: z.string().min(3),
      senha: z.string().min(4).or(z.literal("")).optional(),
      m3u8_url: z.string().url("URL inválida").optional().or(z.literal("")),
      expiracao: z.string().optional().or(z.literal("")),
      status: z.enum(["ativo", "bloqueado", "expirado"]),
    }),
  )
  .handler(async ({ data }) => {
    const sb = await adminClient();
    const expiracao = data.expiracao || null;
    const status = statusPorExpiracao(expiracao, data.status);

    const update: {
      nome: string;
      usuario: string;
      m3u8_url: string | null;
      expiracao: string | null;
      status: "ativo" | "bloqueado" | "expirado";
      updated_at: string;
      senha_hash?: string;
    } = {
      nome: data.nome,
      usuario: data.usuario,
      m3u8_url: data.m3u8_url || null,
      expiracao,
      status,
      updated_at: agoraISO(),
    };
    if (data.senha) update.senha_hash = await hashSenha(data.senha);

    const { data: atualizado, error } = await sb
      .from("pp_usuarios")
      .update(update)
      .eq("id", data.id)
      .select()
      .single();
    if (error) throw error;
    return usuarioSemSenha(atualizado as PpUsuario);
  });

/** Exclui um usuário cliente. */
export const excluirUsuario = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data }) => {
    const sb = await adminClient();
    const { error } = await sb.from("pp_usuarios").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

/** Estatísticas gerais do módulo Player Pro. */
export const estatisticas = createServerFn({ method: "GET" }).handler(async () => {
  const sb = await adminClient();
  const { data: usuarios } = await sb.from("pp_usuarios").select("status, expiracao, id");
  const lista = (usuarios ?? []).map(
    (u: { id: string; status: PpUsuario["status"]; expiracao: string | null }) => ({
      id: u.id,
      status: statusPorExpiracao(u.expiracao, u.status),
    }),
  );
  const total = lista.length;
  const ativos = lista.filter((u) => u.status === "ativo").length;
  const bloqueados = lista.filter((u) => u.status === "bloqueado").length;
  const expirados = lista.filter((u) => u.status === "expirado").length;
  // "online" simulado: usuários ativos com acesso válido (métrica de proxy)
  const online = ativos;
  return { total, ativos, bloqueados, expirados, online };
});

/** Login do cliente (área do player). Compara credenciais em pp_usuarios. */
export const loginCliente = createServerFn({ method: "POST" })
  .validator(z.object({ usuario: z.string(), senha: z.string() }))
  .handler(async ({ data }) => {
    const sb = await adminClient();
    const { data: usuario, error } = await sb
      .from("pp_usuarios")
      .select("*")
      .eq("usuario", data.usuario)
      .maybeSingle();
    if (error) throw error;
    if (!usuario) throw new Error("Usuário ou senha inválidos");

    const status = statusPorExpiracao(usuario.expiracao, usuario.status);
    if (status === "expirado") throw new Error("Acesso expirado. Renove seu plano.");
    if (status === "bloqueado") throw new Error("Usuário bloqueado. Contate o administrador.");
    if (!(await senhaCorreta(data.senha, usuario.senha_hash))) {
      throw new Error("Usuário ou senha inválidos");
    }

    return {
      ok: true,
      usuario: usuarioSemSenha({ ...usuario, status } as PpUsuario),
    };
  });

/** Login do administrador do painel Player Pro. */
export const loginAdmin = createServerFn({ method: "POST" })
  .validator(z.object({ email: z.string().email(), senha: z.string() }))
  .handler(async ({ data }) => {
    const sb = await adminClient();
    const { data: admin, error } = await sb
      .from("pp_admins")
      .select("*")
      .eq("email", data.email)
      .maybeSingle();
    if (error) throw error;
    if (!admin) throw new Error("E-mail ou senha inválidos");

    if (!(await senhaCorreta(data.senha, admin.senha_hash))) {
      throw new Error("E-mail ou senha inválidos");
    }

    return { ok: true, admin: { id: admin.id, email: admin.email, role: admin.role } };
  });
