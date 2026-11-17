import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { estatisticas } from "@/lib/player-pro.server";
import { Users, Play, Pause, Clock, UserPlus } from "lucide-react";

export function EstatisticasAdmin() {
  const stats = useServerFn(estatisticas);
  const [dados, setDados] = useState<{
    total: number;
    ativos: number;
    bloqueados: number;
    expirados: number;
    online: number;
  } | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const r = await stats();
        setDados(r);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Falha ao carregar estatísticas");
      } finally {
        setCarregando(false);
      }
    })();
  }, [stats]);

  if (carregando) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <SkeletonKpi key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          icon={<Users className="size-4 text-[#38bdf8]" />}
          label="Total de usuários"
          value={dados!.total}
          subtotal="clientes cadastrados"
        />
        <Kpi
          icon={<Play className="size-4 text-[#22c55e]" />}
          label="Ativos"
          value={dados!.ativos}
          subtotal="acesso liberado"
        />
        <Kpi
          icon={<Pause className="size-4 text-[#f59e0b]" />}
          label="Bloqueados"
          value={dados!.bloqueados}
          subtotal="acesso suspenso"
        />
        <Kpi
          icon={<Clock className="size-4 text-[#ef4444]" />}
          label="Expirados"
          value={dados!.expirados}
          subtotal="plano vencido"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          icon={<UserPlus className="size-4 text-[#a78bfa]" />}
          label="Online (proxy)"
          value={dados!.online}
          subtotal="ativos no período"
        />
      </div>
    </div>
  );
}

function Kpi({
  icon,
  label,
  value,
  subtotal,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  subtotal: string;
}) {
  return (
    <Card className="border border-white/10 bg-[#0f101a]">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-semibold">{label}</CardTitle>
        <span className="text-[#667085] text-xs">{subtotal}</span>
        <div className="text-[#38bdf8]">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-[#e8e8ea]">{value}</div>
      </CardContent>
    </Card>
  );
}

function SkeletonKpi() {
  return (
    <Card className="border border-white/10 bg-[#0f101a] animate-pulse">
      <div className="p-4">
        <div className="h-4 w-24 rounded bg-[#1a1b26] mb-2" />
        <div className="h-8 w-full rounded bg-[#1a1b26]" />
      </div>
    </Card>
  );
}
