import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { loginCliente } from "@/lib/player-pro.server";
import { Tv, User, Lock, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const schema = z.object({
  usuario: z.string().min(2, "Usuário obrigatório"),
  senha: z.string().min(1, "Senha obrigatória"),
});

export const Route = createFileRoute("/player/login")({
  ssr: false,
  head: () => ({ meta: [{ title: "Player Pro — Entrar" }] }),
  validateSearch: (s: Record<string, unknown>): { redirect?: "/player" } => ({
    redirect: s.redirect === "/player" ? "/player" : undefined,
  }),
  beforeLoad: () => {
    if (typeof window !== "undefined" && localStorage.getItem("pp_usuario")) {
      throw redirect({ to: "/player" });
    }
  },
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const redirectTo = Route.useSearch().redirect ?? "/player";
  const login = useServerFn(loginCliente);
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { usuario: "", senha: "" },
  });

  async function onSubmit(values: z.infer<typeof schema>) {
    setLoading(true);
    try {
      const r = await login({ data: values });
      if (r.ok) {
        localStorage.setItem("pp_usuario", JSON.stringify(r.usuario));
        toast.success(`Bem-vindo, ${r.usuario.nome}`);
        navigate({ to: redirectTo, replace: true });
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao entrar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] px-4">
      <Card className="w-full max-w-md bg-[#111] border border-white/10 shadow-2xl">
        <CardHeader className="text-center">
          <div className="inline-flex items-center justify-center gap-1.5 mb-3">
            <Tv className="size-6 text-[#10b981]" />
            <span className="font-bold text-xl tracking-tight">
              Player<span className="text-[#10b981]">Pro</span>
            </span>
          </div>
          <CardTitle className="text-2xl">Acesso ao Player</CardTitle>
          <CardDescription>Entre com seus dados cadastrados pelo administrador.</CardDescription>
        </CardHeader>
        <CardContent>
          <form id="player-login-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 pl-2">
                <User className="size-4 text-white/40" />
                <Input
                  {...form.register("usuario")}
                  placeholder="Usuário"
                  className="pl-8 bg-[#1a1a1a] border-white/10 text-white placeholder-white/40"
                />
              </div>
              {form.formState.errors.usuario && (
                <p className="text-[11px] text-destructive pl-2">
                  {form.formState.errors.usuario.message}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 pl-2">
                <Lock className="size-4 text-white/40" />
                <Input
                  {...form.register("senha")}
                  type="password"
                  placeholder="Senha"
                  className="pl-8 bg-[#1a1a1a] border-white/10 text-white placeholder-white/40"
                />
              </div>
              {form.formState.errors.senha && (
                <p className="text-[11px] text-destructive pl-2">
                  {form.formState.errors.senha.message}
                </p>
              )}
            </div>
            <div className="text-[11px] text-white/50 text-left">
              Não tem acesso? Procure o administrador para cadastrar sua lista M3u8.
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex justify-between items-center">
          <Button
            type="submit"
            form="player-login-form"
            disabled={loading}
            className="w-full md:w-auto bg-[#10b981] text-black hover:bg-[#12e39a]"
          >
            {loading ? (
              <Loader2 className="size-4 mr-2 animate-spin" />
            ) : (
              <Tv className="size-4 mr-2" />
            )}{" "}
            Entrar
          </Button>
        </CardFooter>
      </Card>
      <div className="fixed bottom-4 left-4 text-[11px] text-white/40 flex items-center gap-1">
        <AlertTriangle className="size-3" />
        <span>Simulação — credenciais validadas contra o banco de usuários.</span>
      </div>
    </div>
  );
}
