import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, Crown } from "@/components/icon";

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspacePlan, type PlanRow } from "@/hooks/use-workspace-plan";

export const Route = createFileRoute("/_authenticated/dashboard/settings")({
  head: () => ({ meta: [{ title: "Configurações — Shop2Shops" }] }),
  component: SettingsPage,
});

const PLAN_ORDER = ["free_trial", "starter", "growth", "pro"];

function fmtLimit(v: number | null | undefined, suffix = "") {
  return v == null ? "Ilimitado" : `${v}${suffix}`;
}

function SettingsPage() {
  const wp = useWorkspacePlan();
  const [upgradeTo, setUpgradeTo] = useState<PlanRow | null>(null);

  const plansQ = useQuery({
    queryKey: ["plans-all"],
    queryFn: async () => {
      const { data, error } = await supabase.from("plans").select("*");
      if (error) throw error;
      return (data ?? []).sort(
        (a, b) => PLAN_ORDER.indexOf(a.slug ?? "") - PLAN_ORDER.indexOf(b.slug ?? ""),
      ) as PlanRow[];
    },
  });

  const current = wp.data?.plan;
  const usage = wp.data?.usage ?? { stores: 0, products: 0, orders: 0 };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex-1 p-6 space-y-6">
          <div className="flex items-center gap-3">
            <SidebarTrigger />
            <h1 className="text-2xl font-semibold">Configurações</h1>
          </div>

          <Tabs defaultValue="plan">
            <TabsList>
              <TabsTrigger value="workspace">Workspace</TabsTrigger>
              <TabsTrigger value="plan">Plano e Faturamento</TabsTrigger>
              <TabsTrigger value="integrations">Integrações</TabsTrigger>
            </TabsList>

            <TabsContent value="workspace" className="mt-6">
              <Card className="p-6">
                <h2 className="font-medium mb-1">Workspace</h2>
                <p className="text-sm text-muted-foreground">
                  Configurações gerais do seu workspace (em breve).
                </p>
              </Card>
            </TabsContent>

            <TabsContent value="plan" className="mt-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                {(plansQ.data ?? []).map((p) => {
                  const isCurrent = current?.id === p.id;
                  return (
                    <Card
                      key={p.id}
                      className={`p-5 flex flex-col ${isCurrent ? "border-primary ring-2 ring-primary/40" : ""}`}
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold flex items-center gap-2">
                          {p.slug === "pro" && <Crown className="h-4 w-4 text-yellow-500" />}
                          {p.name}
                        </h3>
                        {isCurrent && <Badge>Plano atual</Badge>}
                      </div>
                      <div className="mt-3">
                        {p.is_trial ? (
                          <div className="text-2xl font-bold">14 dias grátis</div>
                        ) : (
                          <div className="text-2xl font-bold">
                            ${Number(p.price_monthly).toFixed(0)}
                            <span className="text-sm text-muted-foreground font-normal">/mês</span>
                          </div>
                        )}
                      </div>
                      <ul className="mt-4 space-y-2 text-sm flex-1">
                        <li className="flex gap-2"><Check className="h-4 w-4 text-primary" /> {fmtLimit(p.max_stores)} lojas</li>
                        <li className="flex gap-2"><Check className="h-4 w-4 text-primary" /> {fmtLimit(p.max_products)} produtos</li>
                        <li className="flex gap-2"><Check className="h-4 w-4 text-primary" /> {fmtLimit(p.max_orders_monthly)} pedidos/mês</li>
                      </ul>
                      <Button
                        className="mt-5"
                        variant={isCurrent ? "outline" : "default"}
                        disabled={isCurrent}
                        onClick={() => setUpgradeTo(p)}
                      >
                        {isCurrent ? "Plano ativo" : "Fazer upgrade"}
                      </Button>
                    </Card>
                  );
                })}
              </div>

              <Card className="p-6">
                <h2 className="font-medium mb-4">Uso atual</h2>
                <div className="space-y-5">
                  <UsageBar label="Lojas conectadas" used={usage.stores} max={current?.max_stores ?? null} />
                  <UsageBar label="Produtos sincronizados" used={usage.products} max={current?.max_products ?? null} />
                  <UsageBar label="Pedidos distribuídos este mês" used={usage.orders} max={current?.max_orders_monthly ?? null} />
                </div>
                {wp.data?.trialExpired && (
                  <div className="mt-5 rounded-md bg-yellow-500/10 border border-yellow-500/40 p-3 text-sm">
                    Seu trial expirou. Algumas ações estão bloqueadas até o upgrade.
                  </div>
                )}
              </Card>
            </TabsContent>

            <TabsContent value="integrations" className="mt-6">
              <Card className="p-6">
                <h2 className="font-medium mb-1">Integrações</h2>
                <p className="text-sm text-muted-foreground">
                  Conecte suas lojas em <span className="text-foreground">Conectar lojas</span>.
                </p>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>

      <Dialog open={!!upgradeTo} onOpenChange={(o) => !o && setUpgradeTo(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upgrade para {upgradeTo?.name}</DialogTitle>
            <DialogDescription>
              O pagamento via Stripe será integrado em breve. Em seguida você poderá assinar
              {upgradeTo && !upgradeTo.is_trial && ` por $${Number(upgradeTo.price_monthly).toFixed(0)}/mês`} diretamente por aqui.
            </DialogDescription>
          </DialogHeader>
          <div className="text-sm text-muted-foreground">
            Por enquanto, entre em contato com o suporte para ativar manualmente seu novo plano.
          </div>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}

function UsageBar({ label, used, max }: { label: string; used: number; max: number | null }) {
  const pct = max == null ? 0 : Math.min(100, (used / max) * 100);
  const color = max == null
    ? "bg-primary"
    : pct >= 100 ? "bg-red-500"
    : pct >= 80 ? "bg-yellow-500"
    : "bg-primary";
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span>{label}</span>
        <span className="text-muted-foreground">
          {used} / {max == null ? "∞" : max}
        </span>
      </div>
      <div className="h-2 bg-muted rounded overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${max == null ? 5 : Math.max(2, pct)}%` }} />
      </div>
    </div>
  );
}