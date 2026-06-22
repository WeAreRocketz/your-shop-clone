import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/metrics")({
  component: AdminMetricsPage,
});

type CartItem = { price?: number; quantity?: number };

function AdminMetricsPage() {
  const since = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-metrics-30d"],
    queryFn: async () => {
      const [{ data: dists }, { data: carts }, { data: signups }, { data: plans }, { data: ws }] = await Promise.all([
        supabase
          .from("checkout_distributions")
          .select("created_at, cart_session_id")
          .gte("created_at", since)
          .order("created_at"),
        supabase
          .from("cart_sessions")
          .select("id, items, created_at")
          .gte("created_at", since),
        supabase
          .from("profiles")
          .select("created_at")
          .gte("created_at", since)
          .order("created_at"),
        supabase.from("plans").select("id, name, price_monthly, slug"),
        supabase.from("workspaces").select("plan_id"),
      ]);

      const cartById = new Map((carts ?? []).map((c) => [c.id, c]));
      const byDay = new Map<string, { date: string; orders: number; gmv: number; signups: number }>();
      const ensure = (date: string) => {
        if (!byDay.has(date)) byDay.set(date, { date, orders: 0, gmv: 0, signups: 0 });
        return byDay.get(date)!;
      };
      for (const d of dists ?? []) {
        const day = d.created_at.slice(0, 10);
        const row = ensure(day);
        row.orders += 1;
        const c = d.cart_session_id ? cartById.get(d.cart_session_id) : null;
        if (c?.items && Array.isArray(c.items)) {
          for (const it of c.items as CartItem[]) row.gmv += Number(it.price ?? 0) * Number(it.quantity ?? 1);
        }
      }
      for (const s of signups ?? []) {
        const day = s.created_at.slice(0, 10);
        ensure(day).signups += 1;
      }
      const series = Array.from(byDay.values()).sort((a, b) => a.date.localeCompare(b.date));

      const planMap = new Map((plans ?? []).map((p) => [p.id, p]));
      let mrr = 0;
      let payingCustomers = 0;
      for (const w of ws ?? []) {
        const p = w.plan_id ? planMap.get(w.plan_id) : null;
        if (p && p.slug !== "free_trial") {
          mrr += Number(p.price_monthly ?? 0);
          payingCustomers += 1;
        }
      }
      const arpu = payingCustomers ? mrr / payingCustomers : 0;

      // Infra cost rough estimate: $0.000004 per request equivalent + storage flat
      const estCostUsd = (dists?.length ?? 0) * 0.00002 + (carts?.length ?? 0) * 0.00001 + 15;

      return { series, mrr, payingCustomers, arpu, estCostUsd };
    },
  });

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Métricas & Custos</h1>
      <p className="mt-1 text-sm text-muted-foreground">Últimos 30 dias.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KV label="MRR" value={data ? `R$ ${data.mrr.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "—"} />
        <KV label="Clientes pagantes" value={data ? String(data.payingCustomers) : "—"} />
        <KV label="ARPU" value={data ? `R$ ${data.arpu.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "—"} />
        <KV label="Custo infra estimado" value={data ? `US$ ${data.estCostUsd.toFixed(2)}` : "—"} />
      </div>

      <div className="mt-10 rounded-2xl border border-border/60 bg-card/40 p-6">
        <h2 className="text-lg font-semibold">Volume diário</h2>
        <div className="mt-4 h-72">
          {isLoading ? (
            <div className="grid h-full place-items-center text-sm text-muted-foreground">Carregando…</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.series ?? []}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="date" stroke="rgba(255,255,255,0.4)" fontSize={11} />
                <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} />
                <Tooltip
                  contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }}
                />
                <Area type="monotone" dataKey="gmv" stroke="var(--color-primary)" fill="url(#g1)" name="GMV (R$)" />
                <Area type="monotone" dataKey="orders" stroke="#a3ff12" fill="transparent" name="Pedidos" />
                <Area type="monotone" dataKey="signups" stroke="#60a5fa" fill="transparent" name="Cadastros" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}

function KV({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card/40 p-5">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-2 text-2xl font-bold tabular-nums">{value}</div>
    </div>
  );
}