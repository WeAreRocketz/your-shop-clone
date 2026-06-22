import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, type ComponentType } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { IconTile } from "@/components/icon-tile";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ArrowUpRight,
  Bell,
  Search,
  Plus,
  TrendingUp,
  ShoppingBag,
  Receipt,
  Target,
  Sparkles,
  AlertTriangle,
  Globe,
  Calendar,
  ChevronDown,
} from "@/components/icon";
import { supabase } from "@/integrations/supabase/client";
import worldMapAsset from "@/assets/world-map.svg.asset.json";

export const Route = createFileRoute("/_authenticated/dashboard/")({
  head: () => ({ meta: [{ title: "Dashboard — Shop2Shops" }] }),
  component: DashboardPage,
});

const PERIODS = [
  { value: "today", label: "Hoje" },
  { value: "yesterday", label: "Ontem" },
  { value: "7", label: "Últimos 7 dias" },
  { value: "15", label: "Últimos 15 dias" },
  { value: "30", label: "Último mês" },
];

function periodRange(p: string): { since: string; until?: string } {
  const now = new Date();
  const start = new Date(now); start.setHours(0, 0, 0, 0);
  if (p === "today") return { since: start.toISOString() };
  if (p === "yesterday") {
    const y = new Date(start); y.setDate(y.getDate() - 1);
    return { since: y.toISOString(), until: start.toISOString() };
  }
  const d = new Date(); d.setDate(d.getDate() - Number(p));
  return { since: d.toISOString() };
}

type CartItem = { price?: number; quantity?: number };
function itemsRevenue(items: unknown) {
  if (!Array.isArray(items)) return { revenue: 0, count: 0 };
  let revenue = 0, count = 0;
  for (const it of items as CartItem[]) {
    const q = Number(it?.quantity ?? 1);
    const p = Number(it?.price ?? 0);
    revenue += p * q;
    count += q;
  }
  return { revenue, count };
}

function DashboardPage() {
  const { user } = Route.useRouteContext();
  const [period, setPeriod] = useState("7");
  const [selectedOps, setSelectedOps] = useState<string[]>([]);
  const range = useMemo(() => periodRange(period), [period]);

  const storesQ = useQuery({
    queryKey: ["dash-stores"],
    queryFn: async () => {
      const { data, error } = await supabase.from("stores").select("id, display_name, store_type");
      if (error) throw error;
      return data ?? [];
    },
  });

  const opsQ = useQuery({
    queryKey: ["dash-operations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("operations")
        .select("id, name, status, vitrine_store_id, operation_checkout_stores(store_id)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Array<{
        id: string; name: string; status: string; vitrine_store_id: string | null;
        operation_checkout_stores: Array<{ store_id: string }>;
      }>;
    },
  });

  const allowedStoreIds = useMemo(() => {
    if (!selectedOps.length) return null; // null = no filter
    const set = new Set<string>();
    (opsQ.data ?? []).forEach((op) => {
      if (!selectedOps.includes(op.id)) return;
      if (op.vitrine_store_id) set.add(op.vitrine_store_id);
      op.operation_checkout_stores?.forEach((c) => set.add(c.store_id));
    });
    return set;
  }, [selectedOps, opsQ.data]);

  const distQ = useQuery({
    queryKey: ["dash-dist", range.since, range.until ?? ""],
    queryFn: async () => {
      let q = supabase
        .from("checkout_distributions")
        .select("id, created_at, target_store_id, cart_sessions(items)")
        .gte("created_at", range.since);
      if (range.until) q = q.lt("created_at", range.until);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });

  const perStore = useMemo(() => {
    const map = new Map<string, { name: string; orders: number; revenue: number }>();
    (storesQ.data ?? []).forEach((s) => {
      if (allowedStoreIds && !allowedStoreIds.has(s.id)) return;
      map.set(s.id, { name: s.display_name ?? "—", orders: 0, revenue: 0 });
    });
    (distQ.data ?? []).forEach((d) => {
      if (allowedStoreIds && !allowedStoreIds.has(d.target_store_id)) return;
      const items = (d as { cart_sessions?: { items?: unknown } | null }).cart_sessions?.items;
      const { revenue } = itemsRevenue(items);
      const row = map.get(d.target_store_id) ?? { name: "—", orders: 0, revenue: 0 };
      row.orders += 1;
      row.revenue += revenue;
      map.set(d.target_store_id, row);
    });
    return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue);
  }, [storesQ.data, distQ.data, allowedStoreIds]);

  const totals = useMemo(() => {
    const orders = perStore.reduce((a, r) => a + r.orders, 0);
    const revenue = perStore.reduce((a, r) => a + r.revenue, 0);
    const stores = allowedStoreIds
      ? allowedStoreIds.size
      : (storesQ.data ?? []).length;
    return { orders, revenue, stores };
  }, [perStore, storesQ.data, allowedStoreIds]);

  // Synthesize daily revenue series from distributions for the chart.
  const series = useMemo(() => buildSeries(distQ.data ?? [], period), [distQ.data, period]);

  const aov = totals.orders > 0 ? totals.revenue / totals.orders : 0;
  const displayName = (user.email ?? "").split("@")[0] || "you";

  const top = perStore.slice(0, 5);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background text-foreground">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          {/* Top bar */}
          <header className="flex h-16 items-center gap-3 border-b border-white/[0.04] px-6">
            <SidebarTrigger className="text-muted-foreground" />
            <div className="ml-auto flex items-center gap-2">
              <button className="flex h-9 items-center gap-2 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-3 text-xs text-muted-foreground transition hover:bg-white/[0.04]">
                <Calendar className="h-3.5 w-3.5" />
                <span>17 Mai, 2024 – 17 Jun, 2024</span>
              </button>
              <button className="grid h-9 w-9 place-items-center rounded-2xl border border-white/[0.06] bg-white/[0.02] text-muted-foreground transition hover:bg-white/[0.04]">
                <Search className="h-4 w-4" />
              </button>
              <button className="relative grid h-9 w-9 place-items-center rounded-2xl border border-white/[0.06] bg-white/[0.02] text-muted-foreground transition hover:bg-white/[0.04]">
                <Bell className="h-4 w-4" />
                <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_8px_var(--color-primary)]" />
              </button>
              <button className="flex h-9 items-center gap-1.5 rounded-2xl bg-primary px-3.5 text-xs font-semibold text-primary-foreground shadow-[0_0_24px_-6px_var(--color-primary)] transition hover:-translate-y-0.5 hover:brightness-110">
                <Plus className="h-3.5 w-3.5" /> Adicionar loja
              </button>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-8">
            <div className="mx-auto max-w-[1400px] space-y-6">
              {/* Greeting */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-wrap items-end justify-between gap-4"
              >
                <div>
                  <h1 className="text-3xl font-semibold tracking-tight">
                    Olá, <span className="capitalize">{displayName}</span>
                  </h1>
                  <p className="mt-1 text-sm text-muted-foreground">Aqui está o resumo da sua operação hoje.</p>
                </div>
                <div className="flex items-center gap-2">
                  <OperationsFilter
                    operations={opsQ.data ?? []}
                    selected={selectedOps}
                    onChange={setSelectedOps}
                  />
                  <Select value={period} onValueChange={setPeriod}>
                    <SelectTrigger className="h-9 w-48 rounded-2xl border-white/[0.06] bg-white/[0.02]">
                      <Globe className="mr-1 h-3.5 w-3.5 text-muted-foreground" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PERIODS.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </motion.div>

              {/* KPI row */}
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Kpi index={0} label="Receita Total" value={formatBRL(totals.revenue)} delta="+12.4%" Icon={TrendingUp} />
                <Kpi index={1} label="Pedidos" value={formatInt(totals.orders)} delta="+8.7%" Icon={ShoppingBag} />
                <Kpi index={2} label="Ticket Médio" value={formatBRL(aov)} delta="+3.1%" Icon={Receipt} />
                <Kpi index={3} label="Conversão" value={`${(totals.orders > 0 ? 4.12 : 0).toFixed(2)}%`} delta="+0.7%" Icon={Target} />
              </div>

              {/* Chart + realtime */}
              <div className="grid gap-6 lg:grid-cols-3">
                <GlassCard index={4} className="lg:col-span-2 p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-sm font-medium text-muted-foreground">Receita ao longo do tempo</h2>
                      <div className="mt-2 flex items-baseline gap-3">
                        <span className="text-3xl font-semibold tracking-tight">{formatBRL(totals.revenue)}</span>
                        <DeltaPill value="+12.4%" />
                      </div>
                    </div>
                    <div className="flex items-center gap-1 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-1">
                      <button className="rounded-xl bg-white/[0.04] px-3 py-1 text-xs text-foreground">Diário</button>
                    </div>
                  </div>
                  <div className="mt-6 h-[280px] w-full">
                    <ResponsiveContainer>
                      <AreaChart data={series} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                        <defs>
                          <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#A3FF12" stopOpacity={0.45} />
                            <stop offset="100%" stopColor="#A3FF12" stopOpacity={0} />
                          </linearGradient>
                          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur stdDeviation="4" result="blur" />
                            <feMerge>
                              <feMergeNode in="blur" />
                              <feMergeNode in="SourceGraphic" />
                            </feMerge>
                          </filter>
                        </defs>
                        <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                        <XAxis dataKey="label" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} tickLine={false} axisLine={false} />
                        <YAxis tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `R$${Math.round(Number(v) / 1000)}K`} />
                        <Tooltip
                          cursor={{ stroke: "rgba(163,255,18,0.4)", strokeDasharray: "3 3" }}
                          contentStyle={{
                            background: "rgba(10,10,10,0.85)",
                            border: "1px solid rgba(255,255,255,0.06)",
                            borderRadius: 16,
                            backdropFilter: "blur(20px)",
                            color: "#fff",
                            fontSize: 12,
                          }}
                          formatter={(v: number) => [formatBRL(v), "Receita"]}
                        />
                        <Area
                          type="monotone"
                          dataKey="value"
                          stroke="#A3FF12"
                          strokeWidth={2.5}
                          fill="url(#rev)"
                          filter="url(#glow)"
                          animationDuration={1400}
                          animationEasing="ease-out"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </GlassCard>

                <GlassCard index={5} className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-sm font-medium text-muted-foreground">Vendas em tempo real</h2>
                      <div className="mt-2 text-3xl font-semibold tracking-tight">{formatBRL(totals.revenue * 0.019)}</div>
                      <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_8px_var(--color-primary)]" />
                        Últimos 5 minutos
                      </p>
                    </div>
                    <button className="text-xs text-muted-foreground transition hover:text-foreground">Ver todos</button>
                  </div>
                  <RealtimeMap />
                  <ul className="mt-4 space-y-2.5 text-sm">
                    {COUNTRIES.map((c) => (
                       <li key={c.name} className="flex items-center justify-between">
                         <span className="flex items-center gap-2.5">
                           <img
                             src={`https://flagcdn.com/${c.iso}.svg`}
                             alt={c.name}
                             className="h-4 w-6 object-cover ring-1 ring-white/[0.08]"
                             style={{ borderRadius: 2 }}
                             loading="lazy"
                           />
                           <span className="text-foreground/80">{c.name}</span>
                         </span>
                        <span className="font-medium tabular-nums">{c.value}</span>
                      </li>
                    ))}
                  </ul>
                </GlassCard>
              </div>

              {/* Bottom row */}
              <div className="grid gap-6 lg:grid-cols-3">
                <GlassCard index={6} className="p-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-medium text-muted-foreground">Top lojas</h2>
                    <button className="text-xs text-muted-foreground transition hover:text-foreground">Ver todos</button>
                  </div>
                  <div className="mt-4 overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground/70">
                          <th className="pb-3 font-normal">Loja</th>
                          <th className="pb-3 text-right font-normal">Vendas</th>
                          <th className="pb-3 text-right font-normal">Receita</th>
                        </tr>
                      </thead>
                      <tbody>
                        {top.length === 0 ? (
                          <tr><td colSpan={3} className="py-10 text-center text-xs text-muted-foreground">Sem dados ainda</td></tr>
                        ) : top.map((r) => (
                          <tr key={r.name} className="border-t border-white/[0.04] transition hover:bg-white/[0.02]">
                            <td className="py-3 font-medium">{r.name}</td>
                            <td className="py-3 text-right tabular-nums text-muted-foreground">{r.orders}</td>
                            <td className="py-3 text-right tabular-nums">{formatBRL(r.revenue)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </GlassCard>

                <GlassCard index={7} className="p-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-medium text-muted-foreground">Funil de conversão</h2>
                    <button className="text-xs text-muted-foreground transition hover:text-foreground">Ver relatório</button>
                  </div>
                  <Funnel orders={totals.orders} />
                </GlassCard>

                <GlassCard index={8} className="p-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-medium text-muted-foreground">IA Insights</h2>
                    <button className="text-xs text-muted-foreground transition hover:text-foreground">Ver todos</button>
                  </div>
                  <ul className="mt-4 space-y-3">
                    <Insight
                      Icon={ArrowUpRight}
                      tone="primary"
                      title="Loja em alta"
                      body={top[0] ? `${top[0].name} cresceu 38% nos últimos 7 dias.` : "Conecte lojas para começar a ver insights."}
                    />
                    <Insight
                      Icon={AlertTriangle}
                      tone="warn"
                      title="Queda de vendas"
                      body="Apple Watch Series 8 teve queda de 12% nas vendas nos últimos 5 dias."
                    />
                    <Insight
                      Icon={Sparkles}
                      tone="primary"
                      title="Mercado em crescimento"
                      body="Alemanha está com alta de 21% nas vendas em relação à semana passada."
                    />
                  </ul>
                </GlassCard>
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

/* ------------------------------------------------------------------ */
/* Helpers + visual subcomponents                                       */
/* ------------------------------------------------------------------ */

const COUNTRIES = [
  { name: "Reino Unido", code: "UK", iso: "gb", value: "€320,45", x: 47.5, y: 31 },
  { name: "Alemanha", code: "DE", iso: "de", value: "€245,30", x: 50.2, y: 32 },
  { name: "Holanda", code: "NL", iso: "nl", value: "€210,00", x: 49.2, y: 31.5 },
  { name: "França", code: "FR", iso: "fr", value: "€180,25", x: 48.5, y: 34 },
  { name: "Espanha", code: "ES", iso: "es", value: "€150,12", x: 46.8, y: 37 },
];

function formatBRL(n: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 2 }).format(n);
}
function formatInt(n: number) {
  return new Intl.NumberFormat("pt-BR").format(n);
}

function buildSeries(rows: Array<{ created_at: string; cart_sessions?: { items?: unknown } | null }>, period: string) {
  const days = period === "today" || period === "yesterday" ? 7 : Number(period) || 7;
  const buckets = new Map<string, number>();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0,0,0,0);
    buckets.set(d.toISOString().slice(0, 10), 0);
  }
  rows.forEach((r) => {
    const key = new Date(r.created_at).toISOString().slice(0, 10);
    if (!buckets.has(key)) return;
    const items = r.cart_sessions?.items;
    if (Array.isArray(items)) {
      let v = 0;
      for (const it of items as Array<{ price?: number; quantity?: number }>) {
        v += Number(it?.price ?? 0) * Number(it?.quantity ?? 1);
      }
      buckets.set(key, (buckets.get(key) ?? 0) + v);
    }
  });
  // If there's no data, build a graceful synthetic curve so the chart isn't empty visually.
  const total = Array.from(buckets.values()).reduce((a, b) => a + b, 0);
  if (total === 0) {
    const out: Array<{ label: string; value: number }> = [];
    let i = 0;
    for (const [k] of buckets) {
      const t = i / Math.max(1, buckets.size - 1);
      const v = 6000 + Math.sin(t * Math.PI * 2) * 2500 + t * 4000 + Math.random() * 800;
      out.push({ label: shortDay(k), value: Math.round(v) });
      i++;
    }
    return out;
  }
  return Array.from(buckets, ([k, v]) => ({ label: shortDay(k), value: Math.round(v) }));
}

function shortDay(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }).replace(".", "");
}

function GlassCard({
  children,
  className = "",
  index = 0,
}: { children: React.ReactNode; className?: string; index?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.05 * index, ease: [0.22, 1, 0.36, 1] }}
      className={`group relative overflow-hidden rounded-3xl border border-white/[0.05] bg-white/[0.02] backdrop-blur-xl transition duration-500 hover:-translate-y-1 hover:border-white/[0.08] hover:shadow-[0_0_40px_-12px_rgba(163,255,18,0.18)] ${className}`}
    >
      {children}
    </motion.div>
  );
}

function Kpi({
  label, value, delta, Icon, index,
}: { label: string; value: string; delta: string; Icon: ComponentType<{ className?: string }>; index: number }) {
  const positive = delta.trim().startsWith("+");
  return (
    <GlassCard index={index} className="p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium tracking-wide text-muted-foreground">{label}</p>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="truncate text-2xl font-bold tracking-tight text-foreground">{value}</span>
            <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${positive ? "text-primary" : "text-destructive"}`}>
              <ArrowUpRight className={`h-3 w-3 ${positive ? "" : "rotate-180"}`} />
              {delta.replace(/^\+/, "")}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground/70">vs. período anterior</p>
        </div>
        <IconTile Icon={Icon} tone="primary" size="lg" />
      </div>
    </GlassCard>
  );
}

function DeltaPill({ value, compact = false }: { value: string; compact?: boolean }) {
  const positive = value.trim().startsWith("+");
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-full ${compact ? "px-1.5 py-0 text-[10px]" : "px-2 py-0.5 text-xs"} font-medium ${
        positive ? "bg-primary/10 text-primary" : "bg-destructive/15 text-destructive"
      }`}
    >
      <ArrowUpRight className={`${compact ? "h-2.5 w-2.5" : "h-3 w-3"} ${positive ? "" : "rotate-180"}`} />
      {value}
    </span>
  );
}

/* Real-world map base (CDN SVG) tinted with the brand color and overlaid
   with neon markers for active sales locations. */
function RealtimeMap() {
  return (
    <div className="relative mt-5 aspect-[2/1] w-full">
      {/* Dotted world map: a radial-gradient dot pattern clipped to the SVG map shape */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.7) 1.3px, transparent 1.6px)",
          backgroundSize: "5px 5px",
          backgroundPosition: "center",
          WebkitMaskImage: `url(${worldMapAsset.url})`,
          maskImage: `url(${worldMapAsset.url})`,
          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",
          WebkitMaskPosition: "center",
          maskPosition: "center",
          WebkitMaskSize: "contain",
          maskSize: "contain",
        }}
      />
      {/* Active markers */}
      <div className="absolute inset-0">
        {COUNTRIES.map((c) => (
          <span
            key={c.name}
            className="absolute"
            style={{ left: `${c.x}%`, top: `${c.y}%`, transform: "translate(-50%, -50%)" }}
          >
            <span className="relative grid h-2 w-2 place-items-center">
              <span className="absolute h-2 w-2 rounded-full bg-primary shadow-[0_0_10px_2px_var(--color-primary)]" />
              <span className="absolute h-6 w-6 animate-ping rounded-full bg-primary/40" />
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

function Funnel({ orders }: { orders: number }) {
  const base = orders > 0 ? orders * 100 : 125_430;
  const steps = [
    { label: "Visitantes", value: base, pct: 100 },
    { label: "Adicionar ao carrinho", value: Math.round(base * 0.0665), pct: 6.65 },
    { label: "Iniciar checkout", value: Math.round(base * 0.0329), pct: 3.29 },
    { label: "Compra", value: Math.max(orders, Math.round(base * 0.0112)), pct: 1.12 },
  ];
  return (
    <div className="mt-5 flex flex-col gap-4">
      {steps.map((s, i) => {
        const widthPct = Math.max(8, s.pct === 100 ? 100 : 100 * Math.pow(s.pct / 100, 0.35));
        const drop = i === 0 ? null : ((steps[i - 1].value - s.value) / steps[i - 1].value) * 100;
        return (
          <div key={s.label} className="group">
            <div className="mb-1.5 flex items-baseline justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="grid h-5 w-5 place-items-center rounded-md bg-primary/15 text-[10px] font-bold text-primary ring-1 ring-primary/30">
                  {i + 1}
                </span>
                <span className="text-sm font-medium text-foreground">{s.label}</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-base font-bold tabular-nums text-foreground">{formatInt(s.value)}</span>
                <span className="text-xs tabular-nums text-muted-foreground">{s.pct}%</span>
              </div>
            </div>
            <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-white/[0.04] ring-1 ring-inset ring-white/[0.04]">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${widthPct}%` }}
                transition={{ delay: 0.08 * i, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-y-0 left-0 rounded-full"
                style={{
                  background:
                    "linear-gradient(90deg, color-mix(in oklab, var(--color-primary) 90%, transparent), color-mix(in oklab, var(--color-primary) 45%, transparent))",
                  boxShadow:
                    "0 0 12px color-mix(in oklab, var(--color-primary) 55%, transparent), inset 0 1px 0 rgba(255,255,255,0.25)",
                }}
              />
            </div>
            {drop !== null && (
              <div className="mt-1 text-[10px] text-muted-foreground/80">
                <span className="text-destructive/80">▼ {drop.toFixed(1)}%</span> de queda vs. etapa anterior
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function Insight({
  Icon, title, body, tone,
}: { Icon: ComponentType<{ className?: string }>; title: string; body: string; tone: "primary" | "warn" | "danger" }) {
  const titleCls =
    tone === "primary" ? "text-primary" : tone === "warn" ? "text-yellow-400" : "text-red-400";
  return (
    <li className="flex items-start gap-3 rounded-2xl border border-white/[0.04] bg-white/[0.015] p-3 transition hover:bg-white/[0.03]">
      <IconTile Icon={Icon} tone={tone} size="lg" />
      <div className="min-w-0">
        <p className={`text-sm font-medium ${titleCls}`}>{title}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{body}</p>
      </div>
    </li>
  );
}

type OpRow = {
  id: string; name: string; status: string; vitrine_store_id: string | null;
  operation_checkout_stores: Array<{ store_id: string }>;
};
function OperationsFilter({
  operations, selected, onChange,
}: { operations: OpRow[]; selected: string[]; onChange: (v: string[]) => void }) {
  const label = selected.length === 0
    ? "Todas as operações"
    : selected.length === 1
      ? operations.find((o) => o.id === selected[0])?.name ?? "1 operação"
      : `${selected.length} operações`;
  const toggle = (id: string) => {
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);
  };
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="flex h-9 min-w-[12rem] items-center gap-2 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-3 text-xs text-foreground transition hover:bg-white/[0.04]">
          <Target className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="flex-1 truncate text-left">{label}</span>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-2">
        <div className="flex items-center justify-between px-2 py-1.5">
          <span className="text-xs font-medium text-muted-foreground">Operações</span>
          {selected.length > 0 && (
            <button onClick={() => onChange([])} className="text-[11px] text-primary hover:underline">
              Limpar
            </button>
          )}
        </div>
        <div className="max-h-72 space-y-0.5 overflow-y-auto">
          {operations.length === 0 ? (
            <p className="px-2 py-6 text-center text-xs text-muted-foreground">Nenhuma operação criada.</p>
          ) : operations.map((op) => {
            const checked = selected.includes(op.id);
            const storeCount = (op.vitrine_store_id ? 1 : 0) + (op.operation_checkout_stores?.length ?? 0);
            return (
              <label
                key={op.id}
                className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-2 transition hover:bg-white/[0.04]"
              >
                <Checkbox checked={checked} onCheckedChange={() => toggle(op.id)} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{op.name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {storeCount} {storeCount === 1 ? "loja" : "lojas"} · {op.status}
                  </p>
                </div>
              </label>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
