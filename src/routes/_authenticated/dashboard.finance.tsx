import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, AlertTriangle, CheckCircle2, Receipt, TrendingUp, Calendar, Store as StoreIcon, Activity } from "@/components/icon";
import { supabase } from "@/integrations/supabase/client";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, CartesianGrid,
} from "recharts";

export const Route = createFileRoute("/_authenticated/dashboard/finance")({
  head: () => ({ meta: [{ title: "Financeiro por loja — Shop2Shops" }] }),
  component: FinancePage,
});

type Store = {
  id: string;
  display_name: string | null;
  shopify_domain: string;
  store_type: string;
  status: "active" | "down" | "disabled";
  deactivated_at: string | null;
  deactivation_reason: string | null;
};

type Receivable = {
  id: string;
  store_id: string;
  retained_balance: number;
  release_days: number | null;
  expected_release_date: string | null;
  status: string;
  received_at: string | null;
};

type CartItem = { price?: number | string; quantity?: number | string };
type Distribution = {
  target_store_id: string;
  cart_sessions: { items: CartItem[] | null } | null;
};

const BRL = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const COMPACT = (n: number) =>
  n >= 1000
    ? n.toLocaleString("pt-BR", { notation: "compact", maximumFractionDigits: 1, style: "currency", currency: "BRL" })
    : BRL(n);

const PIE_COLORS = [
  "var(--color-primary)",
  "color-mix(in oklab, var(--color-primary) 65%, white)",
  "color-mix(in oklab, var(--color-primary) 40%, white)",
  "color-mix(in oklab, var(--color-primary) 20%, white)",
  "color-mix(in oklab, var(--color-primary) 80%, black)",
];

function FinancePage() {
  const storesQ = useQuery({
    queryKey: ["finance-stores"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stores")
        .select("id, display_name, shopify_domain, store_type, status, deactivated_at, deactivation_reason")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Store[];
    },
  });

  const receivablesQ = useQuery({
    queryKey: ["finance-receivables"],
    queryFn: async () => {
      const { data, error } = await supabase.from("store_receivables").select("*");
      if (error) throw error;
      return (data ?? []) as Receivable[];
    },
  });

  const distributionsQ = useQuery({
    queryKey: ["finance-distributions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("checkout_distributions")
        .select("target_store_id, cart_sessions(items)")
        .limit(5000);
      if (error) throw error;
      return (data ?? []) as unknown as Distribution[];
    },
  });

  const stores = storesQ.data ?? [];
  const receivables = receivablesQ.data ?? [];
  const distributions = distributionsQ.data ?? [];

  const perStore = useMemo(() => {
    const map = new Map<string, { revenue: number; orders: number }>();
    for (const s of stores) map.set(s.id, { revenue: 0, orders: 0 });
    for (const d of distributions) {
      if (!d.target_store_id) continue;
      const row = map.get(d.target_store_id);
      if (!row) continue;
      row.orders += 1;
      const items = d.cart_sessions?.items ?? [];
      if (Array.isArray(items)) {
        for (const i of items) {
          const price = Number(i?.price ?? 0);
          const qty = Number(i?.quantity ?? 1);
          if (!Number.isNaN(price)) row.revenue += price * (Number.isNaN(qty) ? 1 : qty);
        }
      }
    }
    return map;
  }, [stores, distributions]);

  const today = new Date();
  const reminders = useMemo(() => {
    return receivables.filter((r) => {
      if (r.status === "received") return false;
      if (!r.expected_release_date) return false;
      const d = new Date(r.expected_release_date + "T00:00:00");
      return d.getTime() <= today.getTime() + 2 * 86400000; // libera em ≤2 dias ou já liberado
    });
  }, [receivables]);

  const totalRevenue = Array.from(perStore.values()).reduce((a, b) => a + b.revenue, 0);
  const totalOrders = Array.from(perStore.values()).reduce((a, b) => a + b.orders, 0);
  const totalRetained = receivables
    .filter((r) => r.status !== "received")
    .reduce((a, b) => a + Number(b.retained_balance ?? 0), 0);
  const avgTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const activeStores = stores.filter((s) => s.status === "active").length;

  const chartData = useMemo(() => {
    return stores
      .map((s) => {
        const agg = perStore.get(s.id) ?? { revenue: 0, orders: 0 };
        return {
          id: s.id,
          name: (s.display_name ?? s.shopify_domain ?? "").slice(0, 14),
          revenue: Math.round(agg.revenue),
          orders: agg.orders,
        };
      })
      .sort((a, b) => b.revenue - a.revenue);
  }, [stores, perStore]);

  const ordersPie = chartData.filter((c) => c.orders > 0).slice(0, 5);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex-1 p-6 space-y-6">
          <div className="flex items-center gap-3">
            <SidebarTrigger />
            <div>
              <h1 className="text-2xl font-semibold">Financeiro por loja</h1>
              <p className="text-sm text-muted-foreground">
                Faturamento, status operacional e saldos retidos por loja conectada.
              </p>
            </div>
          </div>

          {/* KPIs */}
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <KPI tone="primary" icon={<TrendingUp className="h-5 w-5" />} label="Faturamento total"
                 value={BRL(totalRevenue)} hint={`${activeStores} ${activeStores === 1 ? "loja ativa" : "lojas ativas"}`} />
            <KPI tone="sky" icon={<Receipt className="h-5 w-5" />} label="Pedidos distribuídos"
                 value={totalOrders.toLocaleString("pt-BR")} hint={`Ticket médio ${BRL(avgTicket)}`} />
            <KPI tone="amber" icon={<AlertTriangle className="h-5 w-5" />} label="Saldo retido"
                 value={BRL(totalRetained)} hint={`${reminders.length} liberações próximas`} />
            <KPI tone="emerald" icon={<Activity className="h-5 w-5" />} label="Lojas conectadas"
                 value={String(stores.length)} hint={`${stores.length - activeStores} fora do ar`} />
          </div>

          {/* Reminders */}
          {reminders.length > 0 && (
            <Card className="p-4 border-primary/40 bg-primary/5">
              <div className="flex items-start gap-3">
                <Bell className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div className="flex-1 space-y-2">
                  <p className="text-sm font-semibold">Lembretes de liberação de saldo</p>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {reminders.map((r) => {
                      const s = stores.find((x) => x.id === r.store_id);
                      const releaseDate = r.expected_release_date
                        ? new Date(r.expected_release_date + "T00:00:00")
                        : null;
                      const released = releaseDate && releaseDate <= today;
                      return (
                        <li key={r.id} className="flex items-center gap-2">
                          <Calendar className="h-3.5 w-3.5 shrink-0" />
                          <span className="font-medium text-foreground">
                            {s?.display_name ?? s?.shopify_domain ?? "Loja"}
                          </span>
                          <span>—</span>
                          <span>{BRL(Number(r.retained_balance ?? 0))}</span>
                          <span>•</span>
                          {released ? (
                            <Badge className="bg-primary text-primary-foreground">Liberado hoje</Badge>
                          ) : (
                            <Badge variant="secondary">
                              Libera em {r.expected_release_date}
                            </Badge>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            </Card>
          )}

          {/* Gráficos */}
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2 p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-sm font-semibold">Faturamento por loja</h2>
                  <p className="text-xs text-muted-foreground">Top lojas pela receita acumulada</p>
                </div>
                <Badge variant="outline" className="text-[10px]">BRL</Badge>
              </div>
              <div className="h-72">
                {chartData.length === 0 ? (
                  <EmptyChart label="Sem faturamento registrado" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.95} />
                          <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0.35} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="color-mix(in oklab, var(--color-border) 50%, transparent)" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} />
                      <YAxis tickFormatter={(v) => COMPACT(Number(v))} tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} width={60} />
                      <Tooltip
                        cursor={{ fill: "color-mix(in oklab, var(--color-primary) 10%, transparent)" }}
                        contentStyle={{
                          background: "var(--color-popover)",
                          border: "1px solid var(--color-border)",
                          borderRadius: 10,
                          fontSize: 12,
                        }}
                        formatter={(v: number) => BRL(Number(v))}
                      />
                      <Bar dataKey="revenue" fill="url(#rev)" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>

            <Card className="p-5">
              <div className="mb-3">
                <h2 className="text-sm font-semibold">Distribuição de pedidos</h2>
                <p className="text-xs text-muted-foreground">Participação no volume</p>
              </div>
              <div className="h-72">
                {ordersPie.length === 0 ? (
                  <EmptyChart label="Nenhum pedido distribuído" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Tooltip
                        contentStyle={{
                          background: "var(--color-popover)",
                          border: "1px solid var(--color-border)",
                          borderRadius: 10,
                          fontSize: 12,
                        }}
                      />
                      <Pie
                        data={ordersPie}
                        dataKey="orders"
                        nameKey="name"
                        innerRadius={55}
                        outerRadius={90}
                        paddingAngle={3}
                        stroke="var(--color-background)"
                        strokeWidth={2}
                      >
                        {ordersPie.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>
          </div>

          {/* Grade de lojas */}
          <div>
            <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <StoreIcon className="h-4 w-4 text-primary" /> Lojas conectadas
            </h2>
            {stores.length === 0 ? (
              <Card className="p-10 text-center text-sm text-muted-foreground">
                Nenhuma loja conectada ainda.
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {stores.map((s) => {
                  const agg = perStore.get(s.id) ?? { revenue: 0, orders: 0 };
                  const r = receivables.find((x) => x.store_id === s.id && x.status !== "received");
                  const daysLeft = r?.expected_release_date
                    ? Math.ceil(
                        (new Date(r.expected_release_date + "T00:00:00").getTime() - today.getTime()) /
                          86400000,
                      )
                    : null;
                  const maxRev = Math.max(1, ...chartData.map((c) => c.revenue));
                  const pct = Math.min(100, Math.round((agg.revenue / maxRev) * 100));
                  return (
                    <Card key={s.id} className="p-5 space-y-4 hover:shadow-lg transition-shadow group">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-semibold truncate">{s.display_name ?? s.shopify_domain}</div>
                          <div className="text-xs text-muted-foreground truncate">{s.shopify_domain}</div>
                        </div>
                        <StatusBadge store={s} />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Faturamento</div>
                          <div className="text-lg font-semibold tabular-nums">{BRL(agg.revenue)}</div>
                        </div>
                        <div>
                          <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Pedidos</div>
                          <div className="text-lg font-semibold tabular-nums">{agg.orders}</div>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                          <span>Participação na receita</span>
                          <span className="tabular-nums">{pct}%</span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-primary to-primary/50 transition-all duration-700"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2">
                        <div>
                          <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Saldo retido</div>
                          <div className="text-sm font-semibold tabular-nums">
                            {r ? BRL(Number(r.retained_balance ?? 0)) : "—"}
                          </div>
                        </div>
                        {r?.expected_release_date ? (
                          daysLeft !== null && daysLeft <= 0 ? (
                            <Badge className="bg-primary text-primary-foreground">
                              <CheckCircle2 className="h-3 w-3 mr-1" /> Liberado
                            </Badge>
                          ) : (
                            <div className="text-right">
                              <div className="text-[10px] text-muted-foreground">Libera em</div>
                              <div className="text-xs font-medium tabular-nums">{daysLeft}d</div>
                            </div>
                          )
                        ) : (
                          <span className="text-xs text-muted-foreground">sem retenção</span>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

const TONES = {
  primary: "from-primary/25 to-primary/0 text-primary ring-primary/30",
  sky: "from-sky-500/25 to-sky-500/0 text-sky-400 ring-sky-500/30",
  amber: "from-amber-500/25 to-amber-500/0 text-amber-400 ring-amber-500/30",
  emerald: "from-emerald-500/25 to-emerald-500/0 text-emerald-400 ring-emerald-500/30",
} as const;

function KPI({
  icon, label, value, hint, tone = "primary",
}: { icon: React.ReactNode; label: string; value: string; hint?: string; tone?: keyof typeof TONES }) {
  return (
    <Card className="relative overflow-hidden p-5 group">
      <div className={`pointer-events-none absolute -top-12 -right-12 h-32 w-32 rounded-full bg-gradient-to-br ${TONES[tone]} blur-2xl opacity-70 group-hover:opacity-100 transition-opacity`} />
      <div className="relative space-y-3">
        <div className="flex items-center justify-between">
          <div className={`grid h-10 w-10 place-items-center rounded-xl ring-1 ring-inset bg-background/40 ${TONES[tone]}`}>
            {icon}
          </div>
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
          <div className="text-2xl font-semibold tabular-nums leading-tight">{value}</div>
          {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
        </div>
      </div>
    </Card>
  );
}

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="grid h-full place-items-center text-xs text-muted-foreground">
      {label}
    </div>
  );
}

function StatusBadge({ store }: { store: Store }) {
  if (store.status === "active") {
    return <Badge className="bg-green-600 text-black hover:bg-green-700">Ativa</Badge>;
  }
  if (store.status === "disabled") {
    return <Badge variant="secondary">Desativada</Badge>;
  }
  // down → tratamos como bloqueada / caída
  const blocked = (store.deactivation_reason ?? "").toLowerCase().includes("block") ||
    (store.deactivation_reason ?? "").toLowerCase().includes("bloque");
  return (
    <div className="flex flex-col gap-0.5">
      <Badge variant="destructive">{blocked ? "Bloqueada" : "Caída"}</Badge>
      {store.deactivation_reason && (
        <span className="text-[10px] text-muted-foreground">{store.deactivation_reason}</span>
      )}
    </div>
  );
}