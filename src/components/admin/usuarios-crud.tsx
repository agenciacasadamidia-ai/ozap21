"use client";

import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  listarUsuarios,
  criarUsuario,
  atualizarUsuario,
  excluirUsuario,
} from "@/lib/player-pro.server";
import { toast } from "sonner";
import {
  Users,
  Plus,
  Trash2,
  Edit2,
  Search,
  Loader2,
  Calendar,
  Globe,
  ShieldAlert,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

const schema = z.object({
  nome: z.string().min(2, "Nome obrigatório"),
  usuario: z.string().min(3, "Usuário obrigatório"),
  senha: z.string().min(4, "Senha mínima 4 caracteres").or(z.literal("")).optional(),
  m3u8_url: z.string().url("URL inválida").optional().or(z.literal("")),
  expiracao: z.string().optional().or(z.literal("")),
  status: z.enum(["ativo", "bloqueado", "expirado"]),
});

type UsuarioRow = {
  id: string;
  nome: string;
  usuario: string;
  m3u8_url: string | null;
  expiracao: string | null;
  status: "ativo" | "bloqueado" | "expirado";
  created_at: string;
};

export function UsuariosAdmin() {
  const listar = useServerFn(listarUsuarios);
  const criar = useServerFn(criarUsuario);
  const atualizar = useServerFn(atualizarUsuario);
  const excluir = useServerFn(excluirUsuario);

  const [rows, setRows] = useState<UsuarioRow[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [abrir, setAbrir] = useState(false);
  const [editando, setEditando] = useState<UsuarioRow | null>(null);
  const [termo, setTermo] = useState("");

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const r = await listar();
      setRows(r);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao carregar usuários");
    } finally {
      setCarregando(false);
    }
  }, [listar]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      nome: "",
      usuario: "",
      senha: "",
      m3u8_url: "",
      expiracao: "",
      status: "ativo",
    },
  });

  async function salvar(values: z.infer<typeof schema>) {
    if (!editando && (!values.senha || values.senha.length < 4)) {
      form.setError("senha", { message: "Senha obrigatória" });
      return;
    }
    try {
      if (editando) {
        await atualizar({ data: { id: editando.id, ...values } });
        toast.success("Usuário atualizado");
      } else {
        await criar({ data: { ...values, senha: values.senha ?? "" } });
        toast.success("Usuário criado");
      }
      setAbrir(false);
      form.reset();
      setEditando(null);
      await carregar();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao salvar usuário");
    }
  }

  async function remover(id: string) {
    if (!window.confirm("Tem certeza que deseja excluir este usuário?")) return;
    try {
      await excluir({ data: { id } });
      toast.success("Usuário excluído");
      await carregar();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao excluir");
    }
  }

  function statusBadge(s: string) {
    if (s === "ativo") return <Badge variant="default">Ativo</Badge>;
    if (s === "bloqueado") return <Badge variant="secondary">Bloqueado</Badge>;
    return <Badge variant="destructive">Expirado</Badge>;
  }

  const exibidos = rows.filter(
    (r) =>
      r.nome.toLowerCase().includes(termo.toLowerCase()) ||
      r.usuario.toLowerCase().includes(termo.toLowerCase()),
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight">Usuários IPTV</h1>
          <p className="text-xs text-[#888]">Cadastre, edite e bloqueie clientes do player.</p>
        </div>
        <Button
          onClick={() => {
            setEditando(null);
            form.reset();
            setAbrir(true);
          }}
        >
          <Plus className="size-4 mr-2" /> Novo usuário
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-2.5 size-4 text-[#667085]" />
        <Input
          placeholder="Buscar por nome ou usuário…"
          value={termo}
          onChange={(e) => setTermo(e.target.value)}
          className="pl-10 bg-[#0f101a] border-white/10 text-white placeholder-[#667085]"
        />
      </div>

      <Card className="border border-white/10 bg-[#0a0b12] overflow-hidden">
        {carregando ? (
          <div className="p-8 grid place-items-center">
            <Loader2 className="animate-spin text-[#38bdf8]" />
          </div>
        ) : exibidos.length === 0 ? (
          <div className="p-12 text-center text-[#888]">Nenhum usuário encontrado.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-[11px] uppercase tracking-wider text-[#667085] bg-[#0f101a]/50">
                  <th className="px-4 py-3 font-medium">Nome</th>
                  <th className="px-4 py-3 font-medium">Usuário</th>
                  <th className="px-4 py-3 font-medium">Lista M3u8</th>
                  <th className="px-4 py-3 font-medium">Expira em</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {exibidos.map((r) => (
                  <tr key={r.id} className="hover:bg-[#111220]/50 transition">
                    <td className="px-4 py-3 text-sm font-medium text-[#e8e8ea]">{r.nome}</td>
                    <td className="px-4 py-3 text-sm text-[#a1a1aa]">{r.usuario}</td>
                    <td className="px-4 py-3 text-sm text-[#a1a1aa] truncate max-w-[200px]">
                      {r.m3u8_url || <span className="text-[#667085]">—</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-[#a1a1aa]">
                      {r.expiracao ? (
                        new Date(r.expiracao).toLocaleDateString("pt-BR")
                      ) : (
                        <span className="text-[#667085]">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">{statusBadge(r.status)}</td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditando(r);
                          form.reset({
                            nome: r.nome,
                            usuario: r.usuario,
                            senha: "",
                            m3u8_url: r.m3u8_url ?? "",
                            expiracao: r.expiracao ?? "",
                            status: r.status,
                          });
                          setAbrir(true);
                        }}
                      >
                        <Edit2 className="size-3.5 mr-1" /> Editar
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => remover(r.id)}>
                        <Trash2 className="size-3.5 mr-1" /> Excluir
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Dialog open={abrir} onOpenChange={setAbrir}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editando ? "Editar usuário" : "Novo usuário"}</DialogTitle>
            <DialogDescription>
              Preencha os dados do cliente e atribua a URL da lista M3u8.
            </DialogDescription>
          </DialogHeader>
          <Separator />
          <form id="usuario-form" onSubmit={form.handleSubmit(salvar)} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-medium text-[#a1a1aa]">Nome completo</Label>
                <Input {...form.register("nome")} placeholder="João Silva" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium text-[#a1a1aa]">Usuário (login)</Label>
                <Input {...form.register("usuario")} placeholder="joao.silva" />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-medium text-[#a1a1aa]">Senha</Label>
              <Input {...form.register("senha")} type="password" placeholder="••••••••" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-medium text-[#a1a1aa]">URL da lista M3u8</Label>
              <Input {...form.register("m3u8_url")} placeholder="https://exemplo.com/lista.m3u8" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-medium text-[#a1a1aa]">Expiração</Label>
                <Input {...form.register("expiracao")} type="date" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium text-[#a1a1aa]">Status</Label>
                <select
                  {...form.register("status")}
                  className="bg-[#0f101a] border border-white/10 rounded-lg px-3 py-2 text-sm text-[#e8e8ea] focus:border-[#38bdf8] focus:ring-1 focus:ring-[#38bdf8]"
                >
                  <option value="ativo">Ativo</option>
                  <option value="bloqueado">Bloqueado</option>
                  <option value="expirado">Expirado</option>
                </select>
              </div>
            </div>
          </form>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setAbrir(false)}>
              Cancelar
            </Button>
            <Button type="submit" form="usuario-form" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? (
                <Loader2 className="size-4 mr-2 animate-spin" />
              ) : (
                <ShieldAlert className="size-4 mr-2" />
              )}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
