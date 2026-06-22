import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Sparkles, Store, ShoppingCart, Trash2, Power, Zap } from "@/components/icon";
import { supabase } from "@/integrations/supabase/client";
import { listOperations, deleteOperation, setOperationStatus } from "@/lib/api/operations.functions";
import { OperationWizard } from "@/components/operations/operation-wizard";

export const Route = createFileRoute("/_authenticated/dashboard/products")({
  head: () => ({ meta: [{ title: "Operações — Shop2Shops" }] }),
  component: OperationsPage,
});

function OperationsPage() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <main className="flex-1 overflow-auto">
          <header className="flex h-16 items-center gap-4 border-b border-border px-6">
            <SidebarTrigger />
            <div>
              <h1 className="text-lg font-bold">Operações</h1>
              <p className="text-xs text-muted-foreground">Onde a mágica acontece — wizard passo a passo.</p>
            </div>
          </header>
          <div className="p-6">
            <OperationsList />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

function OperationsList() {
  const qc = useQueryClient();
  const list = useServerFn(listOperations);
  const del = useServerFn(deleteOperation);
  const setStatus = useServerFn(setOperationStatus);
  const [openId, setOpenId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const { data: ws, isLoading: wsLoading } = useQuery({
    queryKey: ["current-workspace"],
    queryFn: async () => {
      const { data: existing } = await supabase
        .from("workspaces")
        .select("id")
        .limit(1)
        .maybeSingle();
      if (existing?.id) return existing.id;
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return null;
      const { data: created, error } = await supabase
        .from("workspaces")
        .insert({ user_id: u.user.id, name: "Meu Workspace" })
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      return created.id;
    },
  });

  const { data: ops, isLoading } = useQuery({
    queryKey: ["operations", ws],
    enabled: !!ws,
    queryFn: () => list({ data: { workspace_id: ws! } }),
  });

  const delMut = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => {
      toast.success("Operação removida");
      qc.invalidateQueries({ queryKey: ["operations", ws] });
    },
  });
  const pauseMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "active" | "paused" }) =>
      setStatus({ data: { id, status } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["operations", ws] }),
  });

  if (wsLoading) return <p className="text-sm text-muted-foreground">Carregando workspace…</p>;
  if (!ws) return <p className="text-sm text-destructive">Não foi possível carregar o workspace. Faça login novamente.</p>;

  if (creating || openId) {
    return (
      <OperationWizard
        workspaceId={ws}
        operationId={openId ?? undefined}
        onClose={() => { setCreating(false); setOpenId(null); }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Suas operações</h2>
          <p className="text-sm text-muted-foreground">Crie e controle os fluxos de tráfego.</p>
        </div>
        <Button onClick={() => setCreating(true)} size="lg">
          <Plus className="mr-1" /> Nova Operação
        </Button>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Carregando…</p>}

      {!isLoading && !ops?.length && (
        <Card className="flex flex-col items-center justify-center gap-3 p-12 text-center">
          <Sparkles className="h-10 w-10 text-primary" />
          <div>
            <h3 className="font-semibold">Nenhuma operação ainda</h3>
            <p className="text-sm text-muted-foreground">Crie sua primeira operação e comece a distribuir tráfego.</p>
          </div>
          <Button onClick={() => setCreating(true)}><Plus className="mr-1" /> Criar primeira operação</Button>
        </Card>
      )}

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {ops?.map((op) => {
          const active = op.status === "active";
          const modeLabel = { direct: "Direta", warmup: "Aquecimento", smart_advance: "SmartAdvance" }[op.mode];
          const checkoutCount = (op.operation_checkout_stores ?? []).length;
          return (
            <Card
              key={op.id}
              className="group relative cursor-pointer overflow-hidden p-4 transition-all hover:shadow-lg"
              onClick={() => setOpenId(op.id)}
            >
              {active && (
                <span className="absolute right-4 top-4 flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary">
                  <span className="relative h-1.5 w-1.5 rounded-full bg-primary">
                    <span className="absolute inset-0 animate-ping rounded-full bg-primary" />
                  </span>
                  AO VIVO
                </span>
              )}
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">{op.name}</h3>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <Badge variant="secondary">{modeLabel}</Badge>
                <Badge variant="outline" className="gap-1"><ShoppingCart className="h-3 w-3" />{checkoutCount}</Badge>
                <Badge variant="outline">{op.status}</Badge>
              </div>
              <div className="mt-4 flex gap-2 opacity-0 transition group-hover:opacity-100">
                {active ? (
                  <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); pauseMut.mutate({ id: op.id, status: "paused" }); }}>
                    <Power className="mr-1 h-3 w-3" /> Pausar
                  </Button>
                ) : op.status === "paused" ? (
                  <Button size="sm" onClick={(e) => { e.stopPropagation(); pauseMut.mutate({ id: op.id, status: "active" }); }}>
                    <Power className="mr-1 h-3 w-3" /> Retomar
                  </Button>
                ) : null}
                <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); if (confirm("Excluir operação?")) delMut.mutate(op.id); }}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}