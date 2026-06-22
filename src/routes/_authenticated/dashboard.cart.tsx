import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Loader2, X } from "@/components/icon";
import { Plus, Trash2, Copy as CopyIcon, ShoppingCart, LayoutGrid, ExternalLink } from "lucide-react";
import { toast } from "sonner";

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

import { supabase } from "@/integrations/supabase/client";
import { getScriptStatus, installScriptTag, uninstallScriptTag } from "@/lib/api/cart.functions";
import {
  listCartConfigs, createCartConfig, deleteCartConfig, duplicateCartConfig,
  getCartConfigById, saveCartConfigById, publishCartConfigById,
  assignCartToStore, unassignCartFromStore,
} from "@/lib/api/cart-builder.functions";
import CartBuilder from "@/components/cart-builder/CartBuilder";
import { defaultCartDrawerConfig } from "@/lib/cart-drawer/defaults";
import type { CartDrawerConfig } from "@/lib/cart-drawer/types";

export const Route = createFileRoute("/_authenticated/dashboard/cart")({
  head: () => ({ meta: [{ title: "Carrinhos — Shop2Shops" }] }),
  component: CartPage,
});

type CartLayout = "drawer" | "page";

function CartPage() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const list = useServerFn(listCartConfigs);
  const create = useServerFn(createCartConfig);
  const remove = useServerFn(deleteCartConfig);
  const duplicate = useServerFn(duplicateCartConfig);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  // Stores (to know workspace and to assign carts)
  const stores = useQuery({
    queryKey: ["all-stores-cart"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stores")
        .select("id, display_name, shopify_domain, store_type, workspace_id, is_active")
        .eq("is_active", true)
        .order("created_at");
      if (error) throw error;
      return data ?? [];
    },
  });
  const workspaceId = stores.data?.[0]?.workspace_id ?? null;

  const carts = useQuery({
    queryKey: ["cart-configs", workspaceId],
    enabled: !!workspaceId,
    queryFn: () => list({ data: { workspaceId: workspaceId! } }),
  });

  const removeMut = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => { toast.success("Carrinho excluído"); qc.invalidateQueries({ queryKey: ["cart-configs"] }); },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : String(e)),
  });
  const duplicateMut = useMutation({
    mutationFn: (id: string) => duplicate({ data: { id } }),
    onSuccess: () => { toast.success("Carrinho duplicado"); qc.invalidateQueries({ queryKey: ["cart-configs"] }); },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : String(e)),
  });

  async function handleCreate(name: string, layout: CartLayout) {
    if (!workspaceId) return;
    try {
      const { id } = await create({ data: { workspaceId, name, layout } });
      toast.success("Carrinho criado");
      qc.invalidateQueries({ queryKey: ["cart-configs"] });
      setShowCreate(false);
      setEditingId(id);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
  }

  if (editingId) {
    return <CartBuilderHost cartId={editingId} onClose={() => setEditingId(null)} />;
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <header className="flex h-14 items-center border-b border-border/50 px-4">
            <SidebarTrigger />
            <div className="ml-auto text-sm text-muted-foreground">{user.email}</div>
          </header>
          <main className="flex-1 p-8">
            <div className="mx-auto max-w-6xl space-y-6">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">Carrinhos</h1>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Crie modelos de carrinho (drawer ou página) e atribua a uma loja vitrine quando estiver pronto.
                  </p>
                </div>
                <Button onClick={() => setShowCreate(true)} disabled={!workspaceId} size="lg">
                  <Plus className="mr-2 h-4 w-4" /> Novo carrinho
                </Button>
              </div>

              {carts.isLoading ? (
                <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Carregando carrinhos…
                </div>
              ) : !carts.data?.items.length ? (
                <Card className="flex flex-col items-center justify-center gap-3 border-dashed border-border/60 bg-card/50 p-12 text-center">
                  <ShoppingCart className="h-10 w-10 text-muted-foreground" />
                  <div>
                    <h3 className="text-base font-semibold">Você ainda não criou nenhum carrinho</h3>
                    <p className="mt-1 text-sm text-muted-foreground">Crie o primeiro modelo para começar a personalizar.</p>
                  </div>
                  <Button onClick={() => setShowCreate(true)} disabled={!workspaceId}>
                    <Plus className="mr-2 h-4 w-4" /> Criar carrinho
                  </Button>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {carts.data.items.map((c: any) => (
                    <CartCard
                      key={c.id}
                      cart={c}
                      onEdit={() => setEditingId(c.id)}
                      onDuplicate={() => duplicateMut.mutate(c.id)}
                      onDelete={() => {
                        if (confirm(`Excluir "${c.name}"? Esta ação não pode ser desfeita.`)) removeMut.mutate(c.id);
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>

      <CreateCartDialog open={showCreate} onClose={() => setShowCreate(false)} onCreate={handleCreate} />
    </SidebarProvider>
  );
}

function CartCard({
  cart, onEdit, onDuplicate, onDelete,
}: {
  cart: { id: string; name: string; layout: string; store_id: string | null; published_at: string | null; updated_at: string; stores: { display_name: string | null; shopify_domain: string } | null };
  onEdit: () => void; onDuplicate: () => void; onDelete: () => void;
}) {
  const layoutLabel = cart.layout === "page" ? "Página" : "Drawer";
  const storeName = cart.stores?.display_name ?? cart.stores?.shopify_domain ?? null;

  return (
    <Card className="group relative overflow-hidden border-border/60 bg-card p-5 transition-all hover:border-primary/40 hover:shadow-lg">
      <div className="absolute right-3 top-3 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <Button size="icon" variant="ghost" onClick={onDuplicate} title="Duplicar"><CopyIcon className="h-3.5 w-3.5" /></Button>
        <Button size="icon" variant="ghost" onClick={onDelete} title="Excluir"><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
      </div>
      <div className="flex items-start gap-3">
        <div className={`grid h-10 w-10 place-items-center rounded-lg ${cart.layout === "page" ? "bg-amber-500/10 text-amber-500" : "bg-primary/10 text-primary"}`}>
          {cart.layout === "page" ? <LayoutGrid className="h-5 w-5" /> : <ShoppingCart className="h-5 w-5" />}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-semibold">{cart.name}</h3>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <Badge variant="secondary" className="text-[10px]">{layoutLabel}</Badge>
            {storeName ? (
              <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-[10px] text-emerald-400">
                <Check className="mr-1 h-2.5 w-2.5" /> Instalado em {storeName}
              </Badge>
            ) : (
              <Badge variant="outline" className="border-muted text-[10px] text-muted-foreground">Não instalado</Badge>
            )}
          </div>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between gap-2">
        <div className="text-xs text-muted-foreground">
          {cart.published_at ? `Publicado ${new Date(cart.published_at).toLocaleDateString("pt-BR")}` : "Rascunho"}
        </div>
        <Button size="sm" onClick={onEdit}>Editar <ExternalLink className="ml-1.5 h-3 w-3" /></Button>
      </div>
    </Card>
  );
}

function CreateCartDialog({
  open, onClose, onCreate,
}: { open: boolean; onClose: () => void; onCreate: (name: string, layout: CartLayout) => void }) {
  const [name, setName] = useState("");
  const [layout, setLayout] = useState<CartLayout>("drawer");
  useEffect(() => { if (open) { setName(""); setLayout("drawer"); } }, [open]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Novo carrinho</DialogTitle>
          <DialogDescription>Dê um nome e escolha o estilo. Você poderá personalizar tudo no builder.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="cart-name" className="text-xs">Nome do carrinho</Label>
            <Input id="cart-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="ex: Carrinho Black Friday" autoFocus />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Estilo</Label>
            <div className="grid grid-cols-2 gap-2">
              {([
                { id: "drawer" as const, title: "Drawer lateral", desc: "Abre ao lado, fluxo rápido", Icon: ShoppingCart },
                { id: "page" as const, title: "Página dedicada", desc: "Carrinho em página separada", Icon: LayoutGrid },
              ]).map((opt) => {
                const active = layout === opt.id;
                return (
                  <button key={opt.id} type="button" onClick={() => setLayout(opt.id)}
                    className={`rounded-xl border p-4 text-left transition-all ${active ? "border-primary bg-primary/[0.04] shadow-[0_0_20px_color-mix(in_oklab,var(--color-primary)_25%,transparent)]" : "border-border hover:border-primary/40"}`}>
                    <opt.Icon className={`h-5 w-5 ${active ? "text-primary" : "text-muted-foreground"}`} />
                    <div className="mt-2 text-sm font-semibold">{opt.title}</div>
                    <div className="text-xs text-muted-foreground">{opt.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={() => onCreate(name.trim(), layout)} disabled={!name.trim()}>Criar e abrir builder</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* -------- Host: load cart + Builder + install/uninstall controls -------- */

function CartBuilderHost({ cartId, onClose }: { cartId: string; onClose: () => void }) {
  const qc = useQueryClient();
  const getOne = useServerFn(getCartConfigById);
  const saveFn = useServerFn(saveCartConfigById);
  const publishFn = useServerFn(publishCartConfigById);
  const assignFn = useServerFn(assignCartToStore);
  const unassignFn = useServerFn(unassignCartFromStore);
  const statusFn = useServerFn(getScriptStatus);
  const installFn = useServerFn(installScriptTag);
  const uninstallFn = useServerFn(uninstallScriptTag);

  const cart = useQuery({
    queryKey: ["cart-config-byid", cartId],
    queryFn: () => getOne({ data: { id: cartId } }),
  });

  const stores = useQuery({
    queryKey: ["vitrine-stores-cart"],
    queryFn: async () => {
      const { data } = await supabase
        .from("stores").select("id, display_name, shopify_domain, store_type, workspace_id")
        .eq("is_active", true).eq("store_type", "vitrine");
      return data ?? [];
    },
  });

  const assignedStoreId = (cart.data as any)?.store_id ?? null;
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  useEffect(() => { if (assignedStoreId) setSelectedStoreId(assignedStoreId); }, [assignedStoreId]);

  const installStatus = useQuery({
    queryKey: ["script-status", assignedStoreId],
    enabled: !!assignedStoreId,
    queryFn: () => statusFn({ data: { storeId: assignedStoreId! } }),
  });

  const assignMut = useMutation({
    mutationFn: (storeId: string) => assignFn({ data: { id: cartId, storeId } }),
    onSuccess: () => { toast.success("Carrinho instalado na loja"); qc.invalidateQueries({ queryKey: ["cart-config-byid", cartId] }); qc.invalidateQueries({ queryKey: ["script-status"] }); },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : String(e)),
  });
  const unassignMut = useMutation({
    mutationFn: () => unassignFn({ data: { id: cartId } }),
    onSuccess: () => { toast.success("Carrinho desinstalado"); qc.invalidateQueries({ queryKey: ["cart-config-byid", cartId] }); qc.invalidateQueries({ queryKey: ["script-status"] }); },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : String(e)),
  });
  const reinstallMut = useMutation({
    mutationFn: () => installFn({ data: { storeId: assignedStoreId! } }),
    onSuccess: () => { toast.success("Script reinstalado"); installStatus.refetch(); },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : String(e)),
  });
  const removeScriptMut = useMutation({
    mutationFn: () => uninstallFn({ data: { storeId: assignedStoreId! } }),
    onSuccess: () => { toast.success("Script removido"); installStatus.refetch(); },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : String(e)),
  });

  const initialConfig: CartDrawerConfig = useMemo(() => {
    const stored = (cart.data as any)?.config as Partial<CartDrawerConfig> | null;
    return { ...defaultCartDrawerConfig, ...(stored ?? {}) } as CartDrawerConfig;
  }, [cart.data]);

  async function handleSave(config: CartDrawerConfig) {
    try {
      await saveFn({ data: { id: cartId, config: config as any } });
      qc.invalidateQueries({ queryKey: ["cart-config-byid", cartId] });
      qc.invalidateQueries({ queryKey: ["cart-configs"] });
      toast.success("Configurações salvas");
    } catch (e) { toast.error(e instanceof Error ? e.message : String(e)); }
  }
  async function handlePublish(config: CartDrawerConfig): Promise<boolean> {
    try {
      await publishFn({ data: { id: cartId, config: config as any } });
      qc.invalidateQueries({ queryKey: ["cart-config-byid", cartId] });
      qc.invalidateQueries({ queryKey: ["cart-configs"] });
      toast.success("Carrinho publicado");
      return true;
    } catch (e) { toast.error(e instanceof Error ? e.message : String(e)); return false; }
  }

  if (cart.isLoading || !cart.data) {
    return (
      <div className="flex h-screen items-center justify-center text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Carregando carrinho…
      </div>
    );
  }

  const installed = installStatus.data?.installed;

  const topBarExtras = (
    <div className="flex items-center gap-2 border-l border-border pl-2">
      <Select value={selectedStoreId ?? undefined} onValueChange={setSelectedStoreId}>
        <SelectTrigger className="h-8 w-[180px] text-xs"><SelectValue placeholder="Atribuir vitrine" /></SelectTrigger>
        <SelectContent>
          {(stores.data ?? []).map((s) => (
            <SelectItem key={s.id} value={s.id}>{s.display_name ?? s.shopify_domain}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      {assignedStoreId === selectedStoreId && assignedStoreId ? (
        <>
          <Badge variant="outline" className={installed
            ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-400"
            : "border-amber-500/30 bg-amber-500/15 text-amber-400"}>
            {installed ? <><Check className="mr-1 h-3 w-3" /> Instalado</> : <><X className="mr-1 h-3 w-3" /> Sem script</>}
          </Badge>
          {!installed && (
            <Button size="sm" variant="outline" onClick={() => reinstallMut.mutate()} disabled={reinstallMut.isPending}>
              {reinstallMut.isPending && <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />} Reinstalar script
            </Button>
          )}
          <Button size="sm" variant="ghost" className="text-destructive" onClick={() => unassignMut.mutate()} disabled={unassignMut.isPending}>
            {unassignMut.isPending && <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />} Desinstalar
          </Button>
        </>
      ) : (
        <Button size="sm" onClick={() => selectedStoreId && assignMut.mutate(selectedStoreId)} disabled={!selectedStoreId || assignMut.isPending}>
          {assignMut.isPending && <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />} Instalar nesta loja
        </Button>
      )}
    </div>
  );

  return (
    <CartBuilder
      onClose={onClose}
      onSave={handleSave}
      onPublish={handlePublish}
      initialConfig={initialConfig}
      topBarExtras={topBarExtras}
    />
  );
}