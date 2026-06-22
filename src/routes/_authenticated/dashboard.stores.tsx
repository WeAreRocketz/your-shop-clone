import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { RefreshCw, AlertTriangle, CheckCircle2, Power, Store as StoreIcon, ShoppingCart, Plus, ExternalLink, ArrowRight, Key, Copy, ChevronDown, ChevronUp, Shield, Loader2, Trash2 } from "@/components/icon";

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { checkStoreHealth, setStoreStatus } from "@/lib/api/store-health.functions";
import { exchangeShopifyInstallCode } from "@/lib/api/shopify-install.functions";
import { StoreRotationTab } from "@/components/store-rotation-tab";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

function ShopifyLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 109 124" className={className} fill="currentColor" aria-hidden="true">
      <path d="M74.7 23.2c0-.4-.3-.6-.6-.7-.2 0-4.7-.3-4.7-.3s-3.1-3.1-3.5-3.4c-.3-.3-1-.2-1.3-.2l-1.8.6c-1.1-3.1-3-5.9-6.3-5.9h-.3c-1-1.2-2.1-1.8-3.1-1.8C45.4 11.8 41.7 21 40.5 25.7c-3 .9-5.2 1.6-5.4 1.7-1.7.5-1.7.6-1.9 2.2-.2 1.2-4.5 34.8-4.5 34.8L62 70.7l36.7-7.9c-.1 0-23.9-39.2-24-39.6zM61 19.7l-2.9.9v-.6c0-1.9-.3-3.5-.7-4.7 1.7.2 2.9 2.2 3.6 4.4zm-5.7-4c.5 1.2.8 3 .8 5.4v.4l-6 1.9c1.1-4.4 3.3-6.6 5.2-7.7zm-2.3-2.2c.4 0 .7.1 1.1.4-2.4 1.1-5.1 4-6.2 9.8l-4.8 1.5c1.4-4.6 4.4-11.7 9.9-11.7z"/>
      <path d="M74.1 22.5s-4.7-.3-4.7-.3-3.1-3.1-3.5-3.4c-.1-.1-.3-.2-.5-.2v105.1l36.7-9.1S74.5 23 74.4 22.7c-.1-.1-.2-.2-.3-.2z"/>
      <path d="M54.7 41.4l-4.5 13.4s-4-2.1-8.9-2.1c-7.2 0-7.6 4.5-7.6 5.7 0 6.2 16.2 8.5 16.2 23.1 0 11.4-7.3 18.8-17 18.8-11.7 0-17.7-7.3-17.7-7.3l3.1-10.4s6.2 5.3 11.4 5.3c3.4 0 4.8-2.7 4.8-4.6 0-8.1-13.3-8.4-13.3-21.8 0-11.2 8-22 24.3-22 6.2 0 9.2 1.9 9.2 1.9z" fill="#fff"/>
    </svg>
  );
}

export const Route = createFileRoute("/_authenticated/dashboard/stores")({
  head: () => ({ meta: [{ title: "Conectar lojas — Shop2Shops" }] }),
  component: StoresPage,
});

type Store = {
  id: string;
  workspace_id: string;
  display_name: string | null;
  shopify_domain: string;
  store_type: string;
  status: "active" | "down" | "disabled";
  last_health_check_at: string | null;
  deactivated_at: string | null;
  deactivation_reason: string | null;
};

type Receivable = {
  id: string;
  store_id: string;
  retained_balance: number;
  release_days: number | null;
  expected_release_date: string | null;
  receiving_account: string | null;
  status: string;
  notes: string | null;
  received_at: string | null;
};

function StoresPage() {
  const qc = useQueryClient();
  const checkFn = useServerFn(checkStoreHealth);
  const setStatusFn = useServerFn(setStoreStatus);
  const exchangeFn = useServerFn(exchangeShopifyInstallCode);
  const installHandled = useRef(false);

  // Callback do install OAuth da Shopify: ?code=...&state=<storeId>&shop=<dominio>
  useEffect(() => {
    if (installHandled.current) return;
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const state = params.get("state");
    const shop = params.get("shop");
    if (!code || !state || !shop) return;
    installHandled.current = true;

    const clean = () => {
      const url = new URL(window.location.href);
      ["code", "state", "shop", "hmac", "host", "timestamp"].forEach((k) => url.searchParams.delete(k));
      window.history.replaceState({}, "", url.pathname + (url.search ? `?${url.searchParams}` : ""));
    };

    toast.loading("Finalizando instalação na Shopify...", { id: "shopify-install" });
    exchangeFn({ data: { storeId: state, code, shop } })
      .then(() => {
        toast.success("App instalado e loja conectada!", { id: "shopify-install" });
        clean();
        qc.invalidateQueries({ queryKey: ["stores-mgmt"] });
      })
      .catch((e: Error) => {
        toast.error(e.message, { id: "shopify-install" });
        clean();
      });
  }, [exchangeFn, qc]);

  const storesQ = useQuery({
    queryKey: ["stores-mgmt"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stores")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Store[];
    },
  });

  const receivablesQ = useQuery({
    queryKey: ["receivables"],
    queryFn: async () => {
      const { data, error } = await supabase.from("store_receivables").select("*");
      if (error) throw error;
      return (data ?? []) as Receivable[];
    },
  });

  const checkMut = useMutation({
    mutationFn: (id: string) => checkFn({ data: { store_id: id } }),
    onSuccess: (r) => {
      toast.success(r.status === "active" ? "Loja ativa" : `Loja caída: ${r.reason ?? ""}`);
      qc.invalidateQueries({ queryKey: ["stores-mgmt"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleMut = useMutation({
    mutationFn: (v: { id: string; status: Store["status"] }) =>
      setStatusFn({ data: { store_id: v.id, status: v.status } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["stores-mgmt"] }),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("stores").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Loja removida");
      qc.invalidateQueries({ queryKey: ["stores-mgmt"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const stores = storesQ.data ?? [];
  const active = stores.filter((s) => s.status === "active");
  const down = stores.filter((s) => s.status !== "active");
  const vitrines = stores.filter((s) => s.store_type === "vitrine");
  const checkouts = stores.filter((s) => s.store_type === "checkout");

  const workspaceQ = useQuery({
    queryKey: ["my-workspace"],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) return null;
      const { data, error } = await supabase
        .from("workspaces")
        .select("id")
        .eq("user_id", uid)
        .maybeSingle();
      if (error) throw error;
      return data?.id ?? null;
    },
  });
  const workspaceId = stores[0]?.workspace_id ?? workspaceQ.data ?? null;

  async function checkAll() {
    for (const s of stores) await checkMut.mutateAsync(s.id);
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex-1 p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <h1 className="text-2xl font-semibold">Conectar lojas</h1>
            </div>
            <Button onClick={checkAll} variant="outline" size="sm" disabled={checkMut.isPending}>
              <RefreshCw className={`h-4 w-4 mr-2 ${checkMut.isPending ? "animate-spin" : ""}`} />
              Verificar todas
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <StoreTypeColumn
              kind="vitrine"
              title="Loja Vitrine"
              subtitle="Recebe o tráfego e exibe os produtos. Não fecha pedidos."
              icon={<StoreIcon className="h-5 w-5" />}
              stores={vitrines}
              workspaceId={workspaceId}
              onCreated={() => qc.invalidateQueries({ queryKey: ["stores-mgmt"] })}
              onDelete={(id) => deleteMut.mutate(id)}
            />
            <StoreTypeColumn
              kind="checkout"
              title="Loja Checkout"
              subtitle="Recebe o carrinho redirecionado e processa o pagamento."
              icon={<ShoppingCart className="h-5 w-5" />}
              stores={checkouts}
              workspaceId={workspaceId}
              onCreated={() => qc.invalidateQueries({ queryKey: ["stores-mgmt"] })}
              onDelete={(id) => deleteMut.mutate(id)}
            />
          </div>

        </main>
      </div>
    </SidebarProvider>
  );
}

function StoresTable({
  stores, onCheck, onToggle,
}: {
  stores: Store[];
  onCheck: (id: string) => void;
  onToggle: (id: string, status: Store["status"]) => void;
}) {
  if (stores.length === 0) {
    return <div className="text-center text-muted-foreground py-10">Nenhuma loja nesta categoria.</div>;
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Loja</TableHead>
          <TableHead>Domínio</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Última verificação</TableHead>
          <TableHead className="text-right">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {stores.map((s) => (
          <TableRow key={s.id}>
            <TableCell className="font-medium">{s.display_name ?? "—"}</TableCell>
            <TableCell className="text-muted-foreground">{s.shopify_domain}</TableCell>
            <TableCell><Badge variant="outline">{s.store_type}</Badge></TableCell>
            <TableCell>
              {s.status === "active" && <Badge className="bg-green-600 text-black hover:bg-green-700">ativa</Badge>}
              {s.status === "down" && <Badge variant="destructive">caída</Badge>}
              {s.status === "disabled" && <Badge variant="secondary">desativada</Badge>}
            </TableCell>
            <TableCell className="text-muted-foreground text-sm">
              {s.last_health_check_at ? new Date(s.last_health_check_at).toLocaleString() : "—"}
            </TableCell>
            <TableCell className="text-right space-x-2">
              <Button size="sm" variant="outline" onClick={() => onCheck(s.id)}>
                <RefreshCw className="h-3 w-3 mr-1" /> Verificar
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onToggle(s.id, s.status === "disabled" ? "active" : "disabled")}
              >
                <Power className="h-3 w-3 mr-1" />
                {s.status === "disabled" ? "Reativar" : "Desativar"}
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function DownStoreCard({
  store, receivable, onReactivate, onSaved,
}: {
  store: Store;
  receivable?: Receivable;
  onReactivate: () => void;
  onSaved: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [balance, setBalance] = useState(receivable?.retained_balance.toString() ?? "");
  const [days, setDays] = useState(receivable?.release_days?.toString() ?? "");
  const [account, setAccount] = useState(receivable?.receiving_account ?? "");
  const [notes, setNotes] = useState(receivable?.notes ?? "");

  async function save() {
    const release_days = days ? Number(days) : null;
    const expected_release_date = release_days && store.deactivated_at
      ? new Date(new Date(store.deactivated_at).getTime() + release_days * 86400000).toISOString().slice(0, 10)
      : null;
    const payload = {
      workspace_id: store.workspace_id,
      store_id: store.id,
      retained_balance: Number(balance) || 0,
      release_days,
      expected_release_date,
      receiving_account: account || null,
      notes: notes || null,
    };
    const q = receivable
      ? await supabase.from("store_receivables").update(payload).eq("id", receivable.id)
      : await supabase.from("store_receivables").insert(payload);
    if (q.error) return toast.error(q.error.message);
    toast.success("Recebível salvo");
    setOpen(false);
    onSaved();
  }

  async function markReceived() {
    if (!receivable) return;
    const { error } = await supabase
      .from("store_receivables")
      .update({ status: "received", received_at: new Date().toISOString() })
      .eq("id", receivable.id);
    if (error) return toast.error(error.message);
    toast.success("Marcado como recebido");
    onSaved();
  }

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <h3 className="font-semibold">{store.display_name ?? store.shopify_domain}</h3>
            <Badge variant="destructive">caída</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">{store.shopify_domain}</p>
          {store.deactivation_reason && (
            <p className="text-sm mt-1"><span className="text-muted-foreground">Motivo:</span> {store.deactivation_reason}</p>
          )}
          {store.deactivated_at && (
            <p className="text-xs text-muted-foreground mt-1">
              Detectada em {new Date(store.deactivated_at).toLocaleString()}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onReactivate}>Marcar como ativa</Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm">{receivable ? "Editar recebível" : "Informar recebível"}</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Recebível — {store.display_name ?? store.shopify_domain}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>Saldo retido (R$)</Label>
                  <Input type="number" step="0.01" value={balance} onChange={(e) => setBalance(e.target.value)} />
                </div>
                <div>
                  <Label>Prazo de liberação (dias)</Label>
                  <Input type="number" value={days} onChange={(e) => setDays(e.target.value)} />
                </div>
                <div>
                  <Label>Conta de recebimento</Label>
                  <Input value={account} onChange={(e) => setAccount(e.target.value)} placeholder="Banco / Agência / Conta ou PIX" />
                </div>
                <div>
                  <Label>Observações</Label>
                  <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button onClick={save}>Salvar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {receivable && (
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 border-t pt-4 text-sm">
          <Info label="Saldo retido" value={`R$ ${Number(receivable.retained_balance).toFixed(2)}`} />
          <Info label="Prazo" value={receivable.release_days ? `${receivable.release_days} dias` : "—"} />
          <Info label="Liberação prevista" value={receivable.expected_release_date ?? "—"} />
          <Info label="Conta" value={receivable.receiving_account ?? "—"} />
          <div className="col-span-2 md:col-span-4 flex items-center justify-between">
            <Badge variant={receivable.status === "received" ? "default" : "secondary"}>
              {receivable.status === "received" ? "recebido" : "pendente"}
            </Badge>
            {receivable.status !== "received" && (
              <Button size="sm" variant="outline" onClick={markReceived}>Marcar como recebido</Button>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs uppercase text-muted-foreground">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}

/* -------------------- Coluna por tipo (Vitrine / Checkout) -------------------- */

function StoreTypeColumn({
  kind, title, subtitle, icon, stores, workspaceId, onCreated, onDelete,
}: {
  kind: "vitrine" | "checkout";
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  stores: Store[];
  workspaceId: string | null;
  onCreated: () => void;
  onDelete: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Card className="p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
            {icon}
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold truncate">{title}</h2>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>
        </div>
        <Badge variant="secondary">{stores.length}</Badge>
      </div>

      <div className="space-y-2">
        {stores.length === 0 ? (
          <div className="rounded-md border border-dashed border-border/60 p-4 text-sm text-muted-foreground text-center">
            Nenhuma loja {kind} conectada ainda.
          </div>
        ) : (
          stores.map((s) => (
            <div key={s.id} className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-card/60 px-3 py-2.5">
              <div className="min-w-0">
                <div className="font-medium text-foreground truncate">{s.display_name ?? s.shopify_domain}</div>
                <div className="text-xs text-muted-foreground truncate">{s.shopify_domain}</div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {s.status === "active"
                  ? <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary">ativa</Badge>
                  : <Badge variant="destructive">{s.status}</Badge>}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  aria-label="Excluir loja"
                  onClick={() => {
                    if (confirm(`Excluir a loja "${s.display_name ?? s.shopify_domain}"? Essa ação não pode ser desfeita.`)) {
                      onDelete(s.id);
                    }
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      <ConnectShopifyDialog
        kind={kind}
        open={open}
        onOpenChange={setOpen}
        workspaceId={workspaceId}
        onCreated={onCreated}
      />
      <Button className="mt-auto" onClick={() => setOpen(true)} disabled={!workspaceId}>
        <Plus className="h-4 w-4 mr-2" />
        Conectar nova {title}
      </Button>
      {!workspaceId && (
        <p className="text-xs text-muted-foreground text-center">
          Conecte sua primeira loja pelo onboarding para criar o workspace.
        </p>
      )}
    </Card>
  );
}

const REQUIRED_SCOPES_VITRINE = [
  // Catálogo (sync + bulk edit de título/imagens)
  "read_products",
  "write_products",
  // Estoque (validar disponibilidade antes de enviar pro checkout)
  "read_inventory",
  "write_inventory",
  "read_locations",
  // Webhook orders/paid (Purchase + métricas)
  "read_orders",
  // Script tag do s2s-cart.js (intercepta "Adicionar ao carrinho")
  "read_script_tags",
  "write_script_tags",
  // Edição do tema (injetar botão "Comprar" / snippet do drawer)
  "read_themes",
  "write_themes",
  // Cliente (atribuição por e-mail/telefone vindo do checkout)
  "read_customers",
];
const REQUIRED_SCOPES_CHECKOUT = [
  // Catálogo (ler produtos do destino p/ vincular ao vitrine, criar/atualizar se faltar)
  "read_products",
  "write_products",
  // Estoque & localização (escolher loja com saldo na rotação)
  "read_inventory",
  "write_inventory",
  "read_locations",
  // Pedidos (webhook orders/paid + edição pós-criação)
  "read_orders",
  "write_orders",
  // Draft Orders (core — geramos o invoice_url para redirect)
  "read_draft_orders",
  "write_draft_orders",
  // Cliente no draft order (e-mail/telefone p/ recuperação de carrinho)
  "read_customers",
  "write_customers",
  // Cupons/descontos aplicados no draft
  "read_price_rules",
  "write_price_rules",
  "read_discounts",
  "write_discounts",
];

function TutorialStep({ number, title, children }: { number: number; title: string; children: React.ReactNode }) {
  return (
    <div className="p-4 rounded-xl bg-card border border-border">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-7 h-7 rounded-full bg-foreground/10 flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-medium text-foreground">{number}</span>
        </div>
        <h4 className="font-medium text-foreground">{title}</h4>
      </div>
      <div className="pl-10">{children}</div>
    </div>
  );
}

function ConnectShopifyDialog({
  kind, open, onOpenChange, workspaceId, onCreated,
}: {
  kind: "vitrine" | "checkout";
  open: boolean;
  onOpenChange: (v: boolean) => void;
  workspaceId: string | null;
  onCreated: () => void;
}) {
  const [displayName, setDisplayName] = useState("");
  const [domain, setDomain] = useState("");
  const [token, setToken] = useState("");
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [saving, setSaving] = useState(false);
  const [tutorialOpen, setTutorialOpen] = useState(true);
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedItem(id);
    setTimeout(() => setCopiedItem(null), 2000);
  };

  function normalizeDomain(v: string) {
    let d = v.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
    if (d && !d.includes(".myshopify.com") && !d.includes(".")) d = `${d}.myshopify.com`;
    return d;
  }

  async function save() {
    if (!workspaceId) return toast.error("Workspace não encontrado");
    const d = normalizeDomain(domain);
    if (!d) return toast.error("Informe o domínio Shopify");
    const hasCreds = clientId.trim() && clientSecret.trim();
    const hasLegacy = token.trim();
    if (!hasCreds && !hasLegacy) return toast.error("Informe Client ID + Client Secret (ou um token shpat_ legado)");
    setSaving(true);
    const { data: inserted, error } = await supabase
      .from("stores")
      .insert({
        workspace_id: workspaceId,
        display_name: displayName || d,
        shopify_domain: d,
        access_token: hasLegacy ? token.trim() : null,
        client_id: hasCreds ? clientId.trim() : null,
        client_secret: hasCreds ? clientSecret.trim() : null,
        store_type: kind,
        status: "active",
        is_active: true,
      })
      .select("id")
      .single();
    if (error || !inserted) {
      setSaving(false);
      return toast.error(error?.message ?? "Falha ao salvar loja");
    }

    // Token legado: não precisa instalar, já está conectado.
    if (hasLegacy && !hasCreds) {
      setSaving(false);
      toast.success("Loja conectada");
      setDisplayName(""); setDomain(""); setToken(""); setClientId(""); setClientSecret("");
      onOpenChange(false);
      onCreated();
      return;
    }

    // Redireciona para a Shopify instalar o app (OAuth).
    const authUrl = new URL(`https://${d}/admin/oauth/authorize`);
    authUrl.searchParams.set("client_id", clientId.trim());
    authUrl.searchParams.set("scope", scopes.join(","));
    authUrl.searchParams.set("redirect_uri", redirectUrl);
    authUrl.searchParams.set("state", inserted.id);
    toast.message("Redirecionando para a Shopify para instalar o app...");
    window.location.href = authUrl.toString();
  }

  const APP_NAME = "Shop2Shops";
  const scopes = kind === "checkout" ? REQUIRED_SCOPES_CHECKOUT : REQUIRED_SCOPES_VITRINE;
  const appOrigin = "https://shop-to-shop-flow.lovable.app";
  const appUrl = appOrigin;
  const redirectUrl = `${appOrigin}/dashboard/stores`;
  const webhookUrl = `${appOrigin}/api/public/shopify-order-webhook`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Conectar {kind === "vitrine" ? "Loja Vitrine" : "Loja Checkout"}</DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">Preencha os dados de acesso à API</p>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="store-name">Nome da Loja</Label>
              <Input id="store-name" placeholder="Ex: Minha Loja Principal" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="bg-card border-border" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="store-url">URL da Loja</Label>
              <Input id="store-url" placeholder="minhaloja.myshopify.com" value={domain} onChange={(e) => setDomain(e.target.value)} className="bg-card border-border" />
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
            <Shield className="w-5 h-5 text-green-600 dark:text-green-400" />
            <span className="text-sm text-green-700 dark:text-green-400">Credenciais protegidas e usadas apenas para gerar tokens via Admin API</span>
          </div>

          <Collapsible open={tutorialOpen} onOpenChange={setTutorialOpen}>
            <CollapsibleTrigger className="w-full">
              <div className="flex items-center justify-between p-4 rounded-xl bg-card border border-border hover:bg-accent transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-foreground/10 flex items-center justify-center">
                    <Key className="w-5 h-5 text-foreground" />
                  </div>
                  <span className="font-medium text-foreground">Tutorial: Como obter as credenciais</span>
                </div>
                {tutorialOpen ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
              </div>
            </CollapsibleTrigger>

            <CollapsibleContent className="mt-4 space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-accent border border-border">
                <AlertTriangle className="w-5 h-5 text-accent-foreground flex-shrink-0" />
                <span className="text-sm text-accent-foreground font-medium">Método atual recomendado pela Shopify (Dev Dashboard, jan/2026).</span>
              </div>

              <div className="space-y-4">
                <TutorialStep number={1} title="Acessar o Dev Dashboard">
                  <p className="text-sm text-muted-foreground mb-2">Acesse o painel de desenvolvedor da Shopify:</p>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2"><ArrowRight className="w-3 h-3 text-foreground/50" />Abra <span className="text-foreground font-medium">https://dev.shopify.com/dashboard</span></li>
                    <li className="flex items-center gap-2"><ArrowRight className="w-3 h-3 text-foreground/50" />Faça login com sua conta Shopify</li>
                    <li className="flex items-center gap-2"><ArrowRight className="w-3 h-3 text-foreground/50" />No menu lateral, clique em <span className="text-foreground font-medium">Apps</span></li>
                    <li className="flex items-center gap-2"><ArrowRight className="w-3 h-3 text-foreground/50" />Clique em <span className="text-foreground font-medium">Create app</span></li>
                  </ul>
                </TutorialStep>

                <TutorialStep number={2} title="Criar o App">
                  <p className="text-sm text-muted-foreground mb-2">Configure o novo aplicativo:</p>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2"><ArrowRight className="w-3 h-3 text-foreground/50" />Selecione <span className="text-foreground font-medium">Create app manually</span></li>
                    <li className="flex items-center gap-2"><ArrowRight className="w-3 h-3 text-foreground/50" />Em <span className="text-foreground font-medium">App name</span>, digite: <span className="text-foreground font-medium">{APP_NAME}</span></li>
                    <li className="flex items-center gap-2"><ArrowRight className="w-3 h-3 text-foreground/50" />Clique em <span className="text-foreground font-medium">Create</span></li>
                  </ul>
                  <div className="mt-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                    <p className="text-sm text-destructive">
                      <strong>IMPORTANTE:</strong> logo abaixo do campo <em>App URL</em>, <strong>desmarque</strong> a opção
                      <span className="font-medium"> "Embed app in Shopify admin"</span> (App embutido no admin). Se ficar marcada,
                      a instalação tenta abrir dentro do iframe da Shopify e o redirect para o Shop2Shops falha.
                    </p>
                  </div>
                </TutorialStep>

                <TutorialStep number={3} title="Configurar App URL e Redirect URLs">
                  <p className="text-sm text-muted-foreground mb-2">
                    Em <span className="text-foreground font-medium">Configuration → App URL</span>, use sempre a URL publicada oficial:
                  </p>
                  <div className="p-3 rounded-lg bg-card border border-border space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-muted-foreground">App URL</span>
                        <Button variant="ghost" size="sm" onClick={() => handleCopy(appUrl, "app-url")} className="h-7 px-2">
                          <Copy className={`w-3.5 h-3.5 ${copiedItem === "app-url" ? "text-green-500" : ""}`} />
                        </Button>
                      </div>
                      <code className="text-xs text-foreground break-all">{appUrl}</code>
                    </div>
                    <div className="pt-2 border-t border-border">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-muted-foreground">Allowed redirection URL(s)</span>
                        <Button variant="ghost" size="sm" onClick={() => handleCopy(redirectUrl, "redirect-url")} className="h-7 px-2">
                          <Copy className={`w-3.5 h-3.5 ${copiedItem === "redirect-url" ? "text-green-500" : ""}`} />
                        </Button>
                      </div>
                      <code className="text-xs text-foreground break-all">{redirectUrl}</code>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Sem essas URLs a Shopify recusa a instalação do app com erro <em>redirect_uri is not whitelisted</em>.
                  </p>
                </TutorialStep>

                <TutorialStep number={4} title="Configurar Access Scopes">
                  <p className="text-sm text-muted-foreground mb-2">Configure os escopos de acesso:</p>
                  <ul className="space-y-1 text-sm text-muted-foreground mb-3">
                    <li className="flex items-center gap-2"><ArrowRight className="w-3 h-3 text-foreground/50" />Em <span className="text-foreground font-medium">Configuration</span>, abra <span className="text-foreground font-medium">Admin API integration</span></li>
                    <li className="flex items-center gap-2"><ArrowRight className="w-3 h-3 text-foreground/50" />Marque os escopos listados abaixo</li>
                  </ul>
                  <div className="p-4 rounded-lg bg-card border border-border">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-foreground font-medium">Access Scopes (copie e cole)</span>
                      <Button variant="ghost" size="sm" onClick={() => handleCopy(scopes.join(", "), "scopes")} className="text-foreground hover:text-foreground/80">
                        <Copy className={`w-4 h-4 mr-2 ${copiedItem === "scopes" ? "text-green-500" : ""}`} />
                        Copiar todos
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {scopes.map((scope) => (
                        <span key={scope} className="px-3 py-1 rounded-full text-xs bg-secondary text-secondary-foreground border border-border">{scope}</span>
                      ))}
                    </div>
                  </div>
                </TutorialStep>

                <TutorialStep number={5} title="Configurar Webhook de pedidos">
                  <p className="text-sm text-muted-foreground mb-2">
                    Em <span className="text-foreground font-medium">Configuration → Webhooks</span>, configure:
                  </p>
                  <div className="p-3 rounded-lg bg-card border border-border space-y-3">
                    <div>
                      <span className="text-xs text-muted-foreground block mb-1">Event</span>
                      <code className="text-xs text-foreground">orders/paid</code>
                    </div>
                    <div className="pt-2 border-t border-border">
                      <span className="text-xs text-muted-foreground block mb-1">Format</span>
                      <code className="text-xs text-foreground">JSON</code>
                    </div>
                    <div className="pt-2 border-t border-border">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-muted-foreground">Endpoint URL</span>
                        <Button variant="ghost" size="sm" onClick={() => handleCopy(webhookUrl, "webhook-url")} className="h-7 px-2">
                          <Copy className={`w-3.5 h-3.5 ${copiedItem === "webhook-url" ? "text-green-500" : ""}`} />
                        </Button>
                      </div>
                      <code className="text-xs text-foreground break-all">{webhookUrl}</code>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Necessário para contabilizar pedidos, disparar Purchase nos pixels e acionar o rodízio de lojas.
                  </p>
                </TutorialStep>

                <TutorialStep number={6} title="Fazer Release do App">
                  <p className="text-sm text-muted-foreground mb-2">Publique a versão do aplicativo:</p>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2"><ArrowRight className="w-3 h-3 text-foreground/50" />Clique em <span className="text-foreground font-medium">Release</span></li>
                    <li className="flex items-center gap-2"><ArrowRight className="w-3 h-3 text-foreground/50" />Version é opcional, não precisa preencher</li>
                    <li className="flex items-center gap-2"><ArrowRight className="w-3 h-3 text-foreground/50" />Clique em <span className="text-foreground font-medium">Release</span> novamente</li>
                    <li className="flex items-center gap-2"><ArrowRight className="w-3 h-3 text-foreground/50" />No menu da esquerda, clique em <span className="text-foreground font-medium">Settings</span></li>
                  </ul>
                </TutorialStep>

                <TutorialStep number={7} title="Obter o Client ID">
                  <p className="text-sm text-muted-foreground mb-2">Copie o Client ID:</p>
                  <ul className="space-y-1 text-sm text-muted-foreground mb-3">
                    <li className="flex items-center gap-2"><ArrowRight className="w-3 h-3 text-foreground/50" />Copie o <span className="text-foreground font-medium">Client ID</span> e cole abaixo:</li>
                  </ul>
                  <div className="space-y-2">
                    <Label htmlFor="client-id" className="text-muted-foreground">Client ID</Label>
                    <Input id="client-id" placeholder="Cole o Client ID aqui" value={clientId} onChange={(e) => setClientId(e.target.value)} className="bg-card border-border" />
                  </div>
                </TutorialStep>

                <TutorialStep number={8} title="Obter o Client Secret">
                  <p className="text-sm text-muted-foreground mb-2">Copie o Client Secret:</p>
                  <ul className="space-y-1 text-sm text-muted-foreground mb-3">
                    <li className="flex items-center gap-2"><ArrowRight className="w-3 h-3 text-foreground/50" />Copie o <span className="text-foreground font-medium">Secret</span> e cole abaixo:</li>
                  </ul>
                  <div className="space-y-2">
                    <Label htmlFor="client-secret" className="text-muted-foreground">Client Secret</Label>
                    <Input id="client-secret" type="password" placeholder="Cole o Client Secret aqui" value={clientSecret} onChange={(e) => setClientSecret(e.target.value)} className="bg-card border-border" />
                  </div>
                </TutorialStep>

                <TutorialStep number={9} title="Conectar no Shop2Shops">
                  <p className="text-sm text-muted-foreground mb-2">Finalize a conexão aqui no Shop2Shops:</p>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2"><ArrowRight className="w-3 h-3 text-foreground/50" />Clique em <span className="text-foreground font-medium">Conectar loja</span> abaixo</li>
                    <li className="flex items-center gap-2"><ArrowRight className="w-3 h-3 text-foreground/50" />Você será redirecionado para a Shopify para <span className="text-foreground font-medium">instalar o app</span> na sua loja</li>
                    <li className="flex items-center gap-2"><ArrowRight className="w-3 h-3 text-foreground/50" />Confirme a instalação e a Shopify devolve para o Shop2Shops automaticamente</li>
                  </ul>
                  <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                    <p className="text-sm text-destructive">
                      <strong>IMPORTANTE:</strong> a sua loja Shopify deve estar logada no mesmo navegador em que você está usando o Shop2Shops.
                    </p>
                  </div>
                </TutorialStep>

                <a href="https://shopify.dev/docs/apps/build/authentication-authorization/access-token-types/generate-app-access-tokens-admin" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-foreground hover:underline">
                  <ExternalLink className="w-4 h-4" />
                  Documentação oficial
                </a>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {!tutorialOpen && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="client-id-main">Client ID</Label>
                <Input id="client-id-main" placeholder="Cole o Client ID aqui" value={clientId} onChange={(e) => setClientId(e.target.value)} className="bg-card border-border" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="client-secret-main">Client Secret</Label>
                <Input id="client-secret-main" type="password" placeholder="Cole o Client Secret aqui" value={clientSecret} onChange={(e) => setClientSecret(e.target.value)} className="bg-card border-border" />
              </div>
            </div>
          )}

          <div>
            <Label className="text-muted-foreground">Token legado (opcional)</Label>
            <Input value={token} onChange={(e) => setToken(e.target.value)} placeholder="shpat_... (apenas apps antigos)" type="password" />
            <p className="text-[11px] text-muted-foreground mt-1">Use apenas se sua loja ainda tem um app antigo com token permanente shpat_.</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
          <Button onClick={save} disabled={saving}>
            {saving ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Conectando...</>) : "Conectar loja"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}