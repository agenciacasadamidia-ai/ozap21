import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { useServerFn } from "@tanstack/react-start";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginAdmin } from "@/lib/player-pro.server";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Loader2, Mail, Lock } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const schema = z.object({
  email: z.string().email("E-mail inválido"),
  senha: z.string().min(1, "Senha obrigatória"),
});

export const Route = createFileRoute("/admin/login")({
  ssr: false,
  head: () => ({ meta: [{ title: "Player Pro — Admin | Entrar" }] }),
  validateSearch: (s: Record<string, unknown>): { redirect?: "/admin/estatisticas" } => ({
    redirect: s.redirect === "/admin/estatisticas" ? "/admin/estatisticas" : undefined,
  }),
  beforeLoad: () => {
    if (typeof window !== "undefined" && localStorage.getItem("pp_admin")) {
      throw redirect({ to: "/admin/estatisticas" });
    }
  },
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const navigate = useNavigate();
  const redirectTo = Route.useSearch().redirect ?? "/admin/estatisticas";
  const login = useServerFn(loginAdmin);
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", senha: "" },
  });

  async function onSubmit(values: z.infer<typeof schema>) {
    setLoading(true);
    try {
      const r = await login({ data: values });
      if (r.ok) {
        localStorage.setItem("pp_admin", JSON.stringify(r.admin));
        toast.success(`Bem-vindo, ${r.admin.email}`);
        navigate({ to: redirectTo });
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao entrar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0b0c10] px-4">
      <Card className="w-full max-w-md bg-[#0f101a] border border-white/10 shadow-2xl">
        <CardHeader className="text-center">
          <div className="inline-flex items-center justify-center gap-1.5 mb-3">
            <Shield className="size-6 text-[#38bdf8]" />
            <span className="font-bold text-xl tracking-tight">
              Admin<span className="text-[#38bdf8]">Player</span>
            </span>
          </div>
          <CardTitle className="text-2xl">Painel Administrativo</CardTitle>
          <CardDescription>Acesso restrito ao administrador do Player Pro.</CardDescription>
        </CardHeader>
        <CardContent>
          <form id="admin-login-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs font-medium text-[#a1a1aa]">E-mail</Label>
              <div className="flex items-center gap-2 pl-2">
                <Mail className="size-4 text-white/40" />
                <Input
                  {...form.register("email")}
                  type="email"
                  placeholder="admin@playerpro.local"
                  className="pl-8 bg-[#1a1a1a] border-white/10 text-white placeholder-white/40"
                />
              </div>
              {form.formState.errors.email && (
                <p className="text-[11px] text-destructive pl-2">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-medium text-[#a1a1aa]">Senha</Label>
              <div className="flex items-center gap-2 pl-2">
                <Lock className="size-4 text-white/40" />
                <Input
                  {...form.register("senha")}
                  type="password"
                  placeholder="••••••••"
                  className="pl-8 bg-[#1a1a1a] border-white/10 text-white placeholder-white/40"
                />
              </div>
              {form.formState.errors.senha && (
                <p className="text-[11px] text-destructive pl-2">
                  {form.formState.errors.senha.message}
                </p>
              )}
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex justify-between items-center">
          <div className="text-[11px] text-[#667085]">
            E-mail: admin@playerpro.local
            <br />
            Senha: admin123
          </div>
          <Button
            type="submit"
            form="admin-login-form"
            disabled={loading}
            className="w-full md:w-auto bg-[#38bdf8] text-black hover:bg-[#4fd1ff]"
          >
            {loading ? (
              <Loader2 className="size-4 mr-2 animate-spin" />
            ) : (
              <Shield className="size-4 mr-2" />
            )}{" "}
            Entrar
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
