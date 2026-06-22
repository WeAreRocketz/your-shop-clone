import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Plus, Trash2, Power, History, AlertTriangle } from "@/components/icon";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  listRotationRules, upsertRotationRule, deleteRotationRule,
  getStoreLimitsStatus, listRotationEvents, reactivateCart,
  deleteRotationEvent, clearRotationEvents,
} from "@/lib/api/store-rotation.functions";

type Store = {
  id: string; workspace_id: string; display_name: string | null;
  shopify_domain: string; store_type: string; cart_disabled?: boolean;
  cart_disabled_reason?: string | null;
};

type Rule = {
  id: string; workspace_id: string; store_id: string;
  metric: "orders" | "revenue" | "items";
  time_window: "day" | "week" | "month";
  limit_value: number;
  action: "rotate" | "disable_cart" | "rotate_then_disable" | "notify_only";
  fallback_store_ids: string[];
  enabled: boolean;
};

const METRIC_LABEL: Record<Rule["metric"], string> = {
  orders: "Pedidos", revenue: "Receita (R$)", items: "Itens vendidos",
};
const WINDOW_LABEL: Record<Rule["time_window"], string> = {
  day: "por dia", week: "por semana", month: "por mês",
};
const ACTION_LABEL: Record<Rule["action"], string> = {
  rotate: "Rotacionar para fallback",
  disable_cart: "Desativar carrinho",
  rotate_then_disable: "Rotacionar e desativar",
  notify_only: "Apenas notificar",
};

export function StoreRotationTab({ stores }: { stores: Store[] }) {
  const qc = useQueryClient();
  const workspaceId = stores[0]?.workspace_id ?? null;
  const listFn = useServerFn(listRotationRules);
  const upsertFn = useServerFn(upsertRotationRule);
  const deleteFn = useServerFn(deleteRotationRule);
  const eventsFn = useServerFn(listRotationEvents);
  const reactivateFn = useServerFn(reactivateCart);
  const deleteEventFn = useServerFn(deleteRotationEvent);
  const clearEventsFn = useServerFn(clearRotationEvents);

  const rulesQ = useQuery({
    queryKey: ["rotation-rules", workspaceId],
    queryFn: () => (workspaceId ? listFn({ data: { workspace_id: workspaceId } }) : Promise.resolve([])),
    enabled: !!workspaceId,
  });
  const eventsQ = useQuery({
    queryKey: ["rotation-events", workspaceId],
    queryFn: () => (workspaceId ? eventsFn({ data: { workspace_id: workspaceId } }) : Promise.resolve([])),
    enabled: !!workspaceId,
  });

  const delMut = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rotation-rules"] });
      toast.success("Regra removida");
    },
  });
  const toggleMut = useMutation({
    mutationFn: (r: Rule) =>
      upsertFn({ data: { id: r.id, rule: { ...r, enabled: !r.enabled } } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rotation-rules"] }),
  });
  const reactivateMut = useMutation({
    mutationFn: (storeId: string) => reactivateFn({ data: { store_id: storeId } }),
    onSuccess: () => {
      toast.success("Carrinho reativado");
      qc.invalidateQueries({ queryKey: ["stores-mgmt"] });
    },
  });
  const deleteEventMut = useMutation({
    mutationFn: (id: string) => deleteEventFn({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rotation-events"] });
      toast.success("Evento removido");
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const clearEventsMut = useMutation({
    mutationFn: async () => {
      if (!workspaceId) return;
      await clearEventsFn({ data: { workspace_id: workspaceId } });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rotation-events"] });
      toast.success("Histórico limpo");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rules = (rulesQ.data ?? []) as Rule[];
  const events = eventsQ.data ?? [];
  const checkoutStores = stores.filter((s) => s.store_type === "checkout");
  const storeById = useMemo(
    () => new Map(stores.map((s) => [s.id, s] as const)),
    [stores],
  );

  if (!workspaceId) {
    return <Card className="p-10 text-center text-muted-foreground">Conecte uma loja primeiro.</Card>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Rotação automática</h2>
          <p className="text-sm text-muted-foreground">
            Defina limites por loja. Quando atingidos, o sistema rotaciona o fluxo ou desativa o carrinho automaticamente.
          </p>
        </div>
        <RuleDialog
          workspaceId={workspaceId}
          stores={checkoutStores}
          onSaved={() => qc.invalidateQueries({ queryKey: ["rotation-rules"] })}
        />
      </div>

      {/* Disabled carts banner */}
      {checkoutStores.filter((s) => s.cart_disabled).map((s) => (
        <Card key={s.id} className="p-4 border-yellow-500/40 bg-yellow-50 dark:bg-yellow-950/20 flex items-center justify-between">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <div className="font-medium">{s.display_name ?? s.shopify_domain}: carrinho desativado</div>
              <div className="text-sm text-muted-foreground">{s.cart_disabled_reason}</div>
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={() => reactivateMut.mutate(s.id)}>
            <Power className="h-3 w-3 mr-1" /> Reativar
          </Button>
        </Card>
      ))}

      {/* Rules list grouped by store */}
      {checkoutStores.length === 0 && (
        <Card className="p-10 text-center text-muted-foreground">
          Conecte ao menos uma loja de checkout para configurar rotação.
        </Card>
      )}
      <div className="space-y-4">
        {checkoutStores.map((store) => {
          const storeRules = rules.filter((r) => r.store_id === store.id);
          return (
            <Card key={store.id} className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">{store.display_name ?? store.shopify_domain}</div>
                  <div className="text-xs text-muted-foreground">{store.shopify_domain}</div>
                </div>
                {store.cart_disabled && <Badge variant="destructive">carrinho desativado</Badge>}
              </div>
              {storeRules.length === 0 ? (
                <div className="text-sm text-muted-foreground italic">Nenhuma regra para esta loja.</div>
              ) : (
                <div className="space-y-2">
                  {storeRules.map((r) => (
                    <RuleRow
                      key={r.id}
                      rule={r}
                      storeById={storeById}
                      onToggle={() => toggleMut.mutate(r)}
                      onDelete={() => delMut.mutate(r.id)}
                    />
                  ))}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Events log */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4" />
            <h3 className="font-medium">Histórico de rotação</h3>
          </div>
          {events.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (confirm("Limpar todo o histórico de rotação?")) clearEventsMut.mutate();
              }}
              disabled={clearEventsMut.isPending}
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" /> Limpar tudo
            </Button>
          )}
        </div>
        {events.length === 0 ? (
          <div className="text-sm text-muted-foreground">Nenhum evento ainda.</div>
        ) : (
          <div className="space-y-1 max-h-80 overflow-auto text-sm">
            {events.map((e: any) => (
              <div key={e.id} className="flex items-center justify-between gap-2 border-b py-1.5 last:border-0">
                <span className="flex-1">
                  <Badge variant="outline" className="mr-2">{e.action_taken}</Badge>
                  {storeById.get(e.store_id)?.display_name ?? "—"}
                  {e.metric && <span className="text-muted-foreground"> · {e.metric} {e.consumed}/{e.limit_value}</span>}
                </span>
                <span className="text-muted-foreground text-xs">{new Date(e.created_at).toLocaleString()}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => deleteEventMut.mutate(e.id)}
                  disabled={deleteEventMut.isPending}
                  aria-label="Excluir evento"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function RuleRow({
  rule, storeById, onToggle, onDelete,
}: {
  rule: Rule;
  storeById: Map<string, Store>;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const statusFn = useServerFn(getStoreLimitsStatus);
  const statusQ = useQuery({
    queryKey: ["rule-status", rule.id],
    queryFn: () => statusFn({ data: { store_id: rule.store_id } }),
    refetchInterval: 60_000,
  });
  const status = (statusQ.data ?? []).find((s) => s.rule_id === rule.id);
  const pct = status ? Math.min(100, (Number(status.consumed) / Number(status.limit_value)) * 100) : 0;

  return (
    <div className="rounded-md border p-3 space-y-2">
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1">
          <div className="text-sm">
            <span className="font-medium">{METRIC_LABEL[rule.metric]}</span>{" "}
            limite <span className="font-medium">{rule.limit_value}</span> {WINDOW_LABEL[rule.time_window]}
            <span className="text-muted-foreground"> · ação: {ACTION_LABEL[rule.action]}</span>
          </div>
          {rule.fallback_store_ids.length > 0 && (
            <div className="text-xs text-muted-foreground mt-0.5">
              Fallback: {rule.fallback_store_ids.map((id) => storeById.get(id)?.display_name ?? id.slice(0, 6)).join(" → ")}
            </div>
          )}
        </div>
        <Switch checked={rule.enabled} onCheckedChange={onToggle} />
        <Button size="sm" variant="ghost" onClick={onDelete}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      {status && (
        <div>
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Consumo atual: {Number(status.consumed).toLocaleString()} / {Number(status.limit_value).toLocaleString()}</span>
            <span>{pct.toFixed(0)}%</span>
          </div>
          <Progress value={pct} className={status.exceeded ? "[&>div]:bg-destructive" : ""} />
        </div>
      )}
    </div>
  );
}

function RuleDialog({
  workspaceId, stores, onSaved,
}: {
  workspaceId: string;
  stores: Store[];
  onSaved: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [storeId, setStoreId] = useState("");
  const [metric, setMetric] = useState<Rule["metric"]>("orders");
  const [timeWindow, setTimeWindow] = useState<Rule["time_window"]>("day");
  const [limit, setLimit] = useState<string>("100");
  const [action, setAction] = useState<Rule["action"]>("rotate_then_disable");
  const [fallback, setFallback] = useState<string[]>([]);
  const upsertFn = useServerFn(upsertRotationRule);

  const mut = useMutation({
    mutationFn: () =>
      upsertFn({
        data: {
          rule: {
            workspace_id: workspaceId,
            store_id: storeId,
            metric, time_window: timeWindow,
            limit_value: Number(limit),
            action,
            fallback_store_ids: fallback,
            enabled: true,
          },
        },
      }),
    onSuccess: () => {
      toast.success("Regra criada");
      setOpen(false);
      setStoreId(""); setLimit("100"); setFallback([]);
      onSaved();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const fallbackCandidates = stores.filter((s) => s.id !== storeId);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" disabled={stores.length === 0}>
          <Plus className="h-4 w-4 mr-1" /> Nova regra
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nova regra de rotação</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Loja</Label>
            <Select value={storeId} onValueChange={setStoreId}>
              <SelectTrigger><SelectValue placeholder="Escolha a loja" /></SelectTrigger>
              <SelectContent>
                {stores.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.display_name ?? s.shopify_domain}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label>Métrica</Label>
              <Select value={metric} onValueChange={(v) => setMetric(v as Rule["metric"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="orders">Pedidos</SelectItem>
                  <SelectItem value="revenue">Receita</SelectItem>
                  <SelectItem value="items">Itens</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Janela</Label>
              <Select value={timeWindow} onValueChange={(v) => setTimeWindow(v as Rule["time_window"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Dia</SelectItem>
                  <SelectItem value="week">Semana</SelectItem>
                  <SelectItem value="month">Mês</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Limite</Label>
              <Input type="number" min={1} value={limit} onChange={(e) => setLimit(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Ação ao atingir</Label>
            <Select value={action} onValueChange={(v) => setAction(v as Rule["action"])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="rotate">Rotacionar para fallback</SelectItem>
                <SelectItem value="disable_cart">Desativar carrinho</SelectItem>
                <SelectItem value="rotate_then_disable">Rotacionar e desativar se sem fallback</SelectItem>
                <SelectItem value="notify_only">Apenas notificar</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {(action === "rotate" || action === "rotate_then_disable") && (
            <div>
              <Label>Lojas de fallback (ordem de prioridade)</Label>
              <div className="space-y-1 mt-1 max-h-40 overflow-auto rounded-md border p-2">
                {fallbackCandidates.length === 0 && (
                  <div className="text-xs text-muted-foreground">Nenhuma outra loja disponível.</div>
                )}
                {fallbackCandidates.map((s) => {
                  const idx = fallback.indexOf(s.id);
                  return (
                    <label key={s.id} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={idx >= 0}
                        onChange={(e) => {
                          setFallback((prev) =>
                            e.target.checked ? [...prev, s.id] : prev.filter((x) => x !== s.id),
                          );
                        }}
                      />
                      <span className="flex-1">{s.display_name ?? s.shopify_domain}</span>
                      {idx >= 0 && <Badge variant="outline">{idx + 1}º</Badge>}
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button
            onClick={() => mut.mutate()}
            disabled={!storeId || !limit || Number(limit) <= 0 || mut.isPending}
          >
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
