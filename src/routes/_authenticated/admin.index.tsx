import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Users, ShoppingBag, Crown, Receipt, TrendingUp, AlertTriangle } from "@/components/icon";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminOverview,
});

type CartItem = { price?: number; quantity?: number };

function AdminOverview() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: async () => {
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const [users, workspaces, stores, distMonth, openReports, plans, wsPlans, distMonthCarts] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("workspaces").select("id", { count: "exact", head: true }),
        supabase.from("stores").select("id", { count: "exact", head: true }),
        supabase
          .from("checkout_distributions")
          .select("id", { count: "exact", head: true })
          .gte("created_at", monthStart.toISOString()),
        supabase
          .from("abuse_reports")
          .select("id", { count: "exact", head: true })
          .eq("status", "open"),
        supabase.from("plans").select("id, name, price_monthly, slug"),
        supabase.from("workspaces").select("plan_id"),
        supabase
          .from("checkout_distributions")
          .select("cart_session_id")
          .gte("created_at", monthStart.toISOString())
          .limit(1000),
      ]);

      const planMap = new Map((plans.data ?? []).map((p) => [p.id, p]));
      let mrr = 0;
      const planCounts: Record<string, number> = {};
      for (const w of wsPlans.data ?? []) {
        const p = w.plan_id ? planMap.get(w.plan_id) : null;
        if (!p) continue;
        planCounts[p.name] = (planCounts[p.name] ?? 0) + 1;
        if (p.slug !== "free_trial") mrr += Number(p.price_monthly ?? 0);
      }

      // Approx GMV this month from cart sessions referenced by distributions
      const ids = Array.from(new Set((distMonthCarts.data ?? []).map((d) => d.cart_session_id).filter(Boolean))) as string[];
      let gmv = 0;
      if (ids.length) {
        const { data: carts } = await supabase.from("cart_sessions").select("items").in("id", ids);
        for (const c of carts ?? []) {
          const items = (c.items ?? []) as CartItem[];
          if (!Array.isArray(items)) continue;
          for (const it of items) gmv += Number(it.price ?? 0) * Number(it.quantity ?? 1);
        }
      }

      return {
        users: users.count ?? 0,
        workspaces: workspaces.count ?? 0,
        stores: stores.count ?? 0,
        ordersMonth: distMonth.count ?? 0,
        openReports: openReports.count ?? 0,
        mrr,
        gmv,
        planCounts,
      };
    },
  });

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Visão geral</h1>
      <p className="mt-1 text-sm text-muted-foreground">Métricas em tempo real da plataforma.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={Users} label="Usuários" value={data?.users} loading={isLoading} />
        <Stat icon={ShoppingBag} label="Workspaces" value={data?.workspaces} loading={isLoading} />
        <Stat icon={ShoppingBag} label="Lojas conectadas" value={data?.stores} loading={isLoading} />
        <Stat icon={Receipt} label="Pedidos no mês" value={data?.ordersMonth} loading={isLoading} />
        <Stat
          icon={Crown}
          label="MRR estimado"
          value={data ? `R$ ${data.mrr.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : undefined}
          loading={isLoading}
        />
        <Stat
          icon={TrendingUp}
          label="GMV no mês"
          value={data ? `R$ ${data.gmv.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : undefined}
          loading={isLoading}
        />
        <Stat icon={AlertTriangle} label="Denúncias abertas" value={data?.openReports} loading={isLoading} />
      </div>

      <div className="mt-10 rounded-2xl border border-border/60 bg-card/40 p-6">
        <h2 className="text-lg font-semibold">Distribuição por plano</h2>
        <div className="mt-4 space-y-2">
          {Object.entries(data?.planCounts ?? {}).map(([name, count]) => (
            <div key={name} className="flex items-center justify-between text-sm">
              <span className="text-foreground/85">{name}</span>
              <span className="tabular-nums font-medium">{count}</span>
            </div>
          ))}
          {!isLoading && Object.keys(data?.planCounts ?? {}).length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhum workspace com plano atribuído.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  loading,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string | undefined;
  loading: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card/40 p-5">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="h-4 w-4" />
        <span>{label}</span>
      </div>
      <div className="mt-2 text-2xl font-bold tabular-nums">
        {loading ? "—" : value ?? 0}
      </div>
    </div>
  );
}