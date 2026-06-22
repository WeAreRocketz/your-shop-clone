import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  PieChart, Pie, Cell, Tooltip as RTooltip, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Legend,
} from "recharts";
import { Download } from "@/components/icon";
import { Sparkles, Loader2 } from "lucide-react";

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { generateAnalyticsInsights } from "@/lib/api/ai-insights.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard/analytics")({
  head: () => ({ meta: [{ title: "Analytics — Shop2Shops" }] }),
  component: AnalyticsPage,
});

const COLORS = ["#6366f1", "#ec4899", "#10b981", "#f59e0b", "#3b82f6", "#ef4444", "#8b5cf6", "#14b8a6"];
const PERIODS = [
  { value: "7", label: "Últimos 7 dias" },
  { value: "30", label: "Últimos 30 dias" },
  { value: "90", label: "Últimos 90 dias" },
];

type CartItem = { price?: number; quantity?: number };

function itemsRevenue(items: unknown): { revenue: number; count: number } {
  if (!Array.isArray(items)) return { revenue: 0, count: 0 };
  let revenue = 0;
  let count = 0;
  for (const it of items as CartItem[]) {
    const q = Number(it?.quantity ?? 1);
    const p = Number(it?.price ?? 0);
    revenue += p * q;
    count += q;
  }
  return { revenue, count };
}

function AnalyticsPage() {
  const [period, setPeriod] = useState<string>("30");
  const [page, setPage] = useState(0);
  const [storeFilter, setStoreFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [insights, setInsights] = useState<string>("");
  const [loadingInsights, setLoadingInsights] = useState(false);
  const genInsights = useServerFn(generateAnalyticsInsights);

  const since = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - Number(period));
    return d.toISOString();
  }, [period]);

  const storesQ = useQuery({
    queryKey: ["analytics-stores"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stores")
        .select("id, display_name, store_type");
      if (error) throw error;
      return data ?? [];
    },
  });

  const distQ = useQuery({
    queryKey: ["analytics-dist", since],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("checkout_distributions")
        .select("id, created_at, source_store_id, target_store_id, status, cart_session_id, cart_sessions(items)")
        .gte("created_at", since)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const cartsQ = useQuery({
    queryKey: ["analytics-carts", since],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cart_sessions")
        .select("id, status, created_at")
        .gte("created_at", since);
      if (error) throw error;
      return data ?? [];
    },
  });

  const storeMap = useMemo(() => {
    const m = new Map<string, string>();
    (storesQ.data ?? []).forEach((s) => m.set(s.id, s.display_name ?? "—"));
    return m;
  }, [storesQ.data]);

  const rows = useMemo(() => {
    return (distQ.data ?? []).map((d) => {
      const items = (d as { cart_sessions?: { items?: unknown } | null }).cart_sessions?.items;
      const { revenue, count } = itemsRevenue(items);
      const createdAt = d.created_at ?? new Date().toISOString();
      return {
        id: d.id,
        created_at: createdAt,
        source: storeMap.get(d.source_store_id) ?? "—",
        target_id: d.target_store_id,
        target: storeMap.get(d.target_store_id) ?? "—",
        status: d.status,
        product_count: count,
        revenue,
      };
    });
  }, [distQ.data, storeMap]);

  const kpis = useMemo(() => {
    const total = rows.length;
    const revenue = rows.reduce((a, r) => a + r.revenue, 0);
    const byStore = new Map<string, number>();
    rows.forEach((r) => byStore.set(r.target, (byStore.get(r.target) ?? 0) + 1));
    let topStore = "—";
    let topCount = 0;
    byStore.forEach((v, k) => { if (v > topCount) { topCount = v; topStore = k; } });
    const carts = cartsQ.data ?? [];
    const completed = carts.filter((c) => c.status === "completed").length;
    const conv = carts.length ? (completed / carts.length) * 100 : 0;
    return { total, revenue, topStore, conv };
  }, [rows, cartsQ.data]);

  const pieData = useMemo(() => {
    const m = new Map<string, number>();
    rows.forEach((r) => m.set(r.target, (m.get(r.target) ?? 0) + 1));
    return Array.from(m, ([name, value]) => ({ name, value }));
  }, [rows]);

  const lineData = useMemo(() => {
    const days = new Map<string, Record<string, number | string>>();
    rows.forEach((r) => {
      const day = r.created_at.slice(0, 10);
      const entry = days.get(day) ?? { day };
      entry[r.target] = ((entry[r.target] as number) ?? 0) + 1;
      days.set(day, entry);
    });
    return Array.from(days.values()).sort((a, b) => String(a.day).localeCompare(String(b.day)));
  }, [rows]);

  const targetStores = useMemo(() => Array.from(new Set(rows.map((r) => r.target))), [rows]);

  const funnel = useMemo(() => {
    const carts = cartsQ.data ?? [];
    const visitors = carts.length;
    const started = carts.filter((c) => c.status === "checkout_started" || c.status === "completed").length;
    const completed = carts.filter((c) => c.status === "completed").length;
    return [
      { label: "Carrinhos criados", value: visitors, pct: 100 },
      { label: "Iniciaram checkout", value: started, pct: visitors ? (started / visitors) * 100 : 0 },
      { label: "Pedidos completados", value: completed, pct: started ? (completed / started) * 100 : 0 },
    ];
  }, [cartsQ.data]);

  const filtered = useMemo(() => rows.filter((r) =>
    (storeFilter === "all" || r.target_id === storeFilter) &&
    (statusFilter === "all" || r.status === statusFilter)
  ), [rows, storeFilter, statusFilter]);

  const pageSize = 10;
  const pageRows = filtered.slice(page * pageSize, (page + 1) * pageSize);

  function exportCsv() {
    const header = ["data", "loja_vitrine", "loja_destino", "produtos", "valor", "status"];
    const lines = [header.join(",")];
    rows.forEach((r) => {
      lines.push([r.created_at, r.source, r.target, r.product_count, r.revenue.toFixed(2), r.status]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","));
    });
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analytics-${period}d.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleGenerateInsights() {
    setLoadingInsights(true);
    try {
      const perStore = pieData.map((d) => ({ name: d.name, orders: d.value }));
      const { insights: text } = await genInsights({
        data: {
          periodDays: Number(period),
          kpis: {
            total: kpis.total,
            revenue: Number(kpis.revenue.toFixed(2)),
            topStore: kpis.topStore,
            conv: Number(kpis.conv.toFixed(2)),
          },
          perStore,
          timeline: lineData as Array<Record<string, string | number>>,
          funnel: funnel.map((f) => ({ label: f.label, value: f.value, pct: Number(f.pct.toFixed(2)) })),
        },
      });
      setInsights(text);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao gerar insights");
    } finally {
      setLoadingInsights(false);
    }
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex-1 p-6 space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <h1 className="text-2xl font-semibold">Analytics</h1>
            </div>
            <div className="flex items-center gap-2">
              <Select value={period} onValueChange={(v) => { setPeriod(v); setPage(0); }}>
                <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PERIODS.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button onClick={exportCsv} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" /> Exportar CSV
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Kpi label="Pedidos distribuídos" value={kpis.total.toString()} />
            <Kpi label="Receita total" value={`R$ ${kpis.revenue.toFixed(2)}`} />
            <Kpi label="Loja destaque" value={kpis.topStore} />
            <Kpi label="Conversão do carrinho" value={`${kpis.conv.toFixed(1)}%`} />
          </div>

          <Card className="p-4 border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
            <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <h2 className="font-medium">Insights de IA</h2>
                <Badge variant="secondary" className="text-xs">Gemini</Badge>
              </div>
              <Button size="sm" onClick={handleGenerateInsights} disabled={loadingInsights || rows.length === 0}>
                {loadingInsights ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
                {insights ? "Gerar novamente" : "Gerar insights"}
              </Button>
            </div>
            {insights ? (
              <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap text-sm leading-relaxed">
                {insights}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {rows.length === 0
                  ? "Sem dados no período para analisar."
                  : "Clique em \"Gerar insights\" para receber uma análise automática dos seus dados."}
              </p>
            )}
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="p-4">
              <h2 className="font-medium mb-3">Distribuição por loja</h2>
              <div className="h-72">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} label>
                      {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <RTooltip formatter={(v: number, n: string) => {
                      const total = pieData.reduce((a, b) => a + b.value, 0);
                      return [`${v} (${total ? ((v / total) * 100).toFixed(1) : 0}%)`, n];
                    }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="p-4">
              <h2 className="font-medium mb-3">Volume ao longo do tempo</h2>
              <div className="h-72">
                <ResponsiveContainer>
                  <LineChart data={lineData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis allowDecimals={false} />
                    <RTooltip />
                    <Legend />
                    {targetStores.map((s, i) => (
                      <Line key={s} type="monotone" dataKey={s} stroke={COLORS[i % COLORS.length]} />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          <Card className="p-4">
            <h2 className="font-medium mb-4">Funil de conversão</h2>
            <div className="space-y-2">
              {funnel.map((f, i) => (
                <div key={f.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{f.label}</span>
                    <span className="text-muted-foreground">{f.value} ({f.pct.toFixed(1)}%)</span>
                  </div>
                  <div className="h-8 bg-muted rounded overflow-hidden">
                    <div
                      className="h-full"
                      style={{
                        width: `${Math.max(5, f.pct)}%`,
                        background: COLORS[i % COLORS.length],
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
              <h2 className="font-medium">Pedidos recentes</h2>
              <div className="flex gap-2">
                <Select value={storeFilter} onValueChange={(v) => { setStoreFilter(v); setPage(0); }}>
                  <SelectTrigger className="w-44"><SelectValue placeholder="Loja" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as lojas</SelectItem>
                    {(storesQ.data ?? []).map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.display_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(0); }}>
                  <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos status</SelectItem>
                    <SelectItem value="pending">pending</SelectItem>
                    <SelectItem value="completed">completed</SelectItem>
                    <SelectItem value="failed">failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Vitrine</TableHead>
                  <TableHead>Destino</TableHead>
                  <TableHead>Produtos</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageRows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{new Date(r.created_at).toLocaleString()}</TableCell>
                    <TableCell>{r.source}</TableCell>
                    <TableCell>{r.target}</TableCell>
                    <TableCell>{r.product_count}</TableCell>
                    <TableCell>R$ {r.revenue.toFixed(2)}</TableCell>
                    <TableCell><Badge variant="outline">{r.status}</Badge></TableCell>
                  </TableRow>
                ))}
                {pageRows.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhum pedido no período</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
            <div className="flex items-center justify-between mt-3 text-sm">
              <span className="text-muted-foreground">{filtered.length} resultados</span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Anterior</Button>
                <Button size="sm" variant="outline" disabled={(page + 1) * pageSize >= filtered.length} onClick={() => setPage((p) => p + 1)}>Próxima</Button>
              </div>
            </div>
          </Card>
        </main>
      </div>
    </SidebarProvider>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-4">
      <div className="text-xs uppercase text-muted-foreground">{label}</div>
      <div className="text-2xl font-semibold mt-1 truncate">{value}</div>
    </Card>
  );
}