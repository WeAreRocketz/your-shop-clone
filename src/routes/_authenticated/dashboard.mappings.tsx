import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Check, Link2, Loader2, Sparkles, Tag, Trash2, X, Zap } from "@/components/icon";

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { aiSuggestMappings } from "@/lib/api/ai-map-products.functions";

export const Route = createFileRoute("/_authenticated/dashboard/mappings")({
  head: () => ({ meta: [{ title: "Mapeamentos — Shop2Shops" }] }),
  component: MappingsPage,
});

type Store = { id: string; display_name: string | null; shopify_domain: string; store_type: string; workspace_id: string };
type Variant = { id: number | string; title: string; price: string; sku: string | null };
type Product = {
  id: string;
  store_id: string;
  title: string;
  handle: string | null;
  images: string[] | null;
  variants: Variant[] | null;
  tags: string[] | null;
};
type Mapping = {
  id: string;
  source_product_id: string;
  target_product_id: string;
  target_store_id: string;
  source_variant_id: string | null;
  target_variant_id: string | null;
  mapping_method: "manual" | "tag" | "ai" | "auto";
  confidence_score: number | null;
};

function MappingsPage() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();

  const [sourceId, setSourceId] = useState<string | null>(null);
  const [targetId, setTargetId] = useState<string | null>(null);

  const storesQuery = useQuery({
    queryKey: ["all-stores"],
    queryFn: async (): Promise<Store[]> => {
      const { data, error } = await supabase
        .from("stores")
        .select("id, display_name, shopify_domain, store_type, workspace_id")
        .eq("is_active", true)
        .order("created_at");
      if (error) throw error;
      return data ?? [];
    },
  });

  const vitrines = useMemo(() => storesQuery.data?.filter((s) => s.store_type === "vitrine") ?? [], [storesQuery.data]);
  const checkouts = useMemo(() => storesQuery.data?.filter((s) => s.store_type === "checkout") ?? [], [storesQuery.data]);

  useEffect(() => {
    if (!sourceId && vitrines[0]) setSourceId(vitrines[0].id);
    if (!targetId && checkouts[0]) setTargetId(checkouts[0].id);
  }, [vitrines, checkouts, sourceId, targetId]);

  const workspaceId = vitrines.find((s) => s.id === sourceId)?.workspace_id ?? null;

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
            <div className="mx-auto max-w-7xl">
              <div className="mb-6">
                <h1 className="text-3xl font-bold tracking-tight">Mapeamentos</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Conecte produtos da Loja Vitrine às Lojas de Checkout.
                </p>
              </div>

              <Card className="mb-6 border-border/60 bg-card p-4">
                <div className="flex flex-wrap items-end gap-4">
                  <div className="min-w-[240px] flex-1">
                    <Label className="text-xs text-muted-foreground">Loja Vitrine</Label>
                    <Select value={sourceId ?? undefined} onValueChange={setSourceId} disabled={!vitrines.length}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        {vitrines.map((s) => <SelectItem key={s.id} value={s.id}>{s.display_name ?? s.shopify_domain}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <ArrowRight className="mb-2 h-5 w-5 text-muted-foreground" />
                  <div className="min-w-[240px] flex-1">
                    <Label className="text-xs text-muted-foreground">Loja de Checkout</Label>
                    <Select value={targetId ?? undefined} onValueChange={setTargetId} disabled={!checkouts.length}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        {checkouts.map((s) => <SelectItem key={s.id} value={s.id}>{s.display_name ?? s.shopify_domain}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </Card>

              {!sourceId || !targetId ? (
                <Card className="border-border/60 bg-card p-12 text-center text-sm text-muted-foreground">
                  Conecte ao menos uma Loja Vitrine e uma Loja de Checkout para começar.
                </Card>
              ) : (
                <Tabs defaultValue="manual">
                  <TabsList className="grid w-full max-w-xl grid-cols-4">
                    <TabsTrigger value="manual">Manual</TabsTrigger>
                    <TabsTrigger value="tag"><Tag className="mr-1 h-3.5 w-3.5" />Por Tag</TabsTrigger>
                    <TabsTrigger value="ai"><Sparkles className="mr-1 h-3.5 w-3.5" />Por IA</TabsTrigger>
                    <TabsTrigger value="auto"><Zap className="mr-1 h-3.5 w-3.5" />Automático</TabsTrigger>
                  </TabsList>

                  <TabsContent value="manual" className="mt-4">
                    <ManualTab sourceId={sourceId} targetId={targetId} workspaceId={workspaceId} />
                  </TabsContent>
                  <TabsContent value="tag" className="mt-4">
                    <TagTab sourceId={sourceId} targetId={targetId} workspaceId={workspaceId} />
                  </TabsContent>
                  <TabsContent value="ai" className="mt-4">
                    <AiTab sourceId={sourceId} targetId={targetId} workspaceId={workspaceId} />
                  </TabsContent>
                  <TabsContent value="auto" className="mt-4">
                    <AutoTab sourceId={sourceId} workspaceId={workspaceId} checkouts={checkouts} />
                  </TabsContent>
                </Tabs>
              )}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );

  // ===== helpers (closure-free; defined at module level below) =====
}

function useStoreProducts(storeId: string | null) {
  return useQuery({
    queryKey: ["products", storeId],
    enabled: !!storeId,
    queryFn: async (): Promise<Product[]> => {
      const { data, error } = await supabase
        .from("products")
        .select("id, store_id, title, handle, images, variants, tags")
        .eq("store_id", storeId!)
        .order("title");
      if (error) throw error;
      return (data ?? []) as unknown as Product[];
    },
  });
}

function useMappings(sourceId: string | null, targetId: string | null) {
  return useQuery({
    queryKey: ["mappings", sourceId, targetId],
    enabled: !!sourceId && !!targetId,
    queryFn: async (): Promise<Mapping[]> => {
      const { data, error } = await supabase
        .from("product_mappings")
        .select("id, source_product_id, target_product_id, target_store_id, source_variant_id, target_variant_id, mapping_method, confidence_score")
        .eq("source_store_id", sourceId!)
        .eq("target_store_id", targetId!)
        .eq("is_active", true);
      if (error) throw error;
      return (data ?? []) as Mapping[];
    },
  });
}

/* ----------------- MANUAL TAB ----------------- */
function ManualTab({ sourceId, targetId, workspaceId }: { sourceId: string; targetId: string; workspaceId: string | null }) {
  const qc = useQueryClient();
  const source = useStoreProducts(sourceId);
  const target = useStoreProducts(targetId);
  const mappings = useMappings(sourceId, targetId);

  const [searchL, setSearchL] = useState("");
  const [searchR, setSearchR] = useState("");
  const [dragging, setDragging] = useState<Product | null>(null);
  const [pair, setPair] = useState<{ source: Product; target: Product } | null>(null);

  const mapBySource = useMemo(() => {
    const m = new Map<string, Mapping>();
    mappings.data?.forEach((x) => m.set(x.source_product_id, x));
    return m;
  }, [mappings.data]);
  const mappedTargetIds = useMemo(() => new Set(mappings.data?.map((m) => m.target_product_id) ?? []), [mappings.data]);

  const filteredL = (source.data ?? []).filter((p) => p.title.toLowerCase().includes(searchL.toLowerCase()));
  const filteredR = (target.data ?? []).filter((p) => p.title.toLowerCase().includes(searchR.toLowerCase()));

  const createMapping = useMutation({
    mutationFn: async (input: { source: Product; target: Product; sourceVariant: string | null; targetVariant: string | null }) => {
      if (!workspaceId) throw new Error("Workspace não encontrado");
      const { error } = await supabase.from("product_mappings").upsert(
        {
          workspace_id: workspaceId,
          source_product_id: input.source.id,
          source_store_id: sourceId,
          target_product_id: input.target.id,
          target_store_id: targetId,
          source_variant_id: input.sourceVariant,
          target_variant_id: input.targetVariant,
          mapping_method: "manual",
        },
        { onConflict: "source_product_id,target_store_id" },
      );
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Mapeamento criado");
      qc.invalidateQueries({ queryKey: ["mappings", sourceId, targetId] });
      setPair(null);
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : String(e)),
  });

  const removeMapping = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("product_mappings").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["mappings", sourceId, targetId] }),
  });

  return (
    <>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="flex flex-col border-border/60 bg-card">
          <div className="border-b border-border/60 p-3">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold">Loja Vitrine</h3>
              <Badge variant="secondary">{filteredL.length}</Badge>
            </div>
            <Input placeholder="Buscar…" value={searchL} onChange={(e) => setSearchL(e.target.value)} />
          </div>
          <div className="max-h-[600px] overflow-auto p-3">
            {filteredL.map((p) => {
              const mapping = mapBySource.get(p.id);
              return (
                <div
                  key={p.id}
                  draggable
                  onDragStart={() => setDragging(p)}
                  onDragEnd={() => setDragging(null)}
                  className={`mb-2 flex cursor-grab items-center gap-3 rounded-lg border p-2 transition active:cursor-grabbing ${
                    mapping ? "border-emerald-500/40 bg-emerald-500/5" : "border-border/60 hover:bg-muted/50"
                  }`}
                >
                  <ProductThumb p={p} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{p.title}</p>
                    <p className="truncate text-xs text-muted-foreground">{p.variants?.[0]?.sku || p.handle}</p>
                  </div>
                  {mapping && (
                    <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/15 text-emerald-400">
                      <Link2 className="mr-1 h-3 w-3" />Mapeado
                    </Badge>
                  )}
                </div>
              );
            })}
            {filteredL.length === 0 && <EmptyHint text="Nenhum produto." />}
          </div>
        </Card>

        <Card className="flex flex-col border-border/60 bg-card">
          <div className="border-b border-border/60 p-3">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold">Loja de Checkout</h3>
              <Badge variant="secondary">{filteredR.length}</Badge>
            </div>
            <Input placeholder="Buscar…" value={searchR} onChange={(e) => setSearchR(e.target.value)} />
          </div>
          <div className="max-h-[600px] overflow-auto p-3">
            {filteredR.map((p) => {
              const isTarget = mappedTargetIds.has(p.id);
              return (
                <div
                  key={p.id}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => {
                    if (dragging) setPair({ source: dragging, target: p });
                  }}
                  className={`mb-2 flex items-center gap-3 rounded-lg border p-2 transition ${
                    dragging ? "border-primary/60 bg-primary/5" : isTarget ? "border-emerald-500/40 bg-emerald-500/5" : "border-border/60"
                  }`}
                >
                  <ProductThumb p={p} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{p.title}</p>
                    <p className="truncate text-xs text-muted-foreground">{p.variants?.[0]?.sku || p.handle}</p>
                  </div>
                  {isTarget && (
                    <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/15 text-emerald-400">
                      <Link2 className="mr-1 h-3 w-3" />Mapeado
                    </Badge>
                  )}
                </div>
              );
            })}
            {filteredR.length === 0 && <EmptyHint text="Nenhum produto." />}
          </div>
        </Card>
      </div>

      {(mappings.data?.length ?? 0) > 0 && (
        <Card className="mt-4 border-border/60 bg-card p-4">
          <h3 className="mb-3 text-sm font-semibold">Mapeamentos ativos ({mappings.data!.length})</h3>
          <div className="space-y-2">
            {mappings.data!.map((m) => {
              const s = source.data?.find((p) => p.id === m.source_product_id);
              const t = target.data?.find((p) => p.id === m.target_product_id);
              return (
                <div key={m.id} className="flex items-center gap-3 rounded border border-border/60 p-2 text-sm">
                  <span className="truncate flex-1">{s?.title ?? "—"}</span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <span className="truncate flex-1">{t?.title ?? "—"}</span>
                  <Badge variant="outline" className="text-xs">{m.mapping_method}</Badge>
                  <Button size="icon" variant="ghost" onClick={() => removeMapping.mutate(m.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <VariantMatchModal pair={pair} onClose={() => setPair(null)} onConfirm={(sv, tv) => pair && createMapping.mutate({ source: pair.source, target: pair.target, sourceVariant: sv, targetVariant: tv })} />
    </>
  );
}

function ProductThumb({ p }: { p: Product }) {
  const img = p.images?.[0];
  return (
    <div className="h-10 w-10 shrink-0 overflow-hidden rounded bg-muted">
      {img ? <img src={img} alt="" className="h-full w-full object-cover" loading="lazy" /> : null}
    </div>
  );
}

function EmptyHint({ text }: { text: string }) {
  return <p className="py-8 text-center text-xs text-muted-foreground">{text}</p>;
}

function VariantMatchModal({
  pair,
  onClose,
  onConfirm,
}: {
  pair: { source: Product; target: Product } | null;
  onClose: () => void;
  onConfirm: (sourceVariant: string | null, targetVariant: string | null) => void;
}) {
  const [sv, setSv] = useState<string>("");
  const [tv, setTv] = useState<string>("");

  useEffect(() => {
    if (pair) {
      setSv(String(pair.source.variants?.[0]?.id ?? ""));
      setTv(String(pair.target.variants?.[0]?.id ?? ""));
    }
  }, [pair]);

  if (!pair) return null;

  return (
    <Dialog open={!!pair} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Confirmar mapeamento</DialogTitle>
          <DialogDescription>Escolha a variante correspondente em cada loja.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <SidePanel label="Vitrine" p={pair.source} value={sv} onChange={setSv} />
          <SidePanel label="Checkout" p={pair.target} value={tv} onChange={setTv} />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={() => onConfirm(sv || null, tv || null)}>Confirmar mapeamento</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SidePanel({ label, p, value, onChange }: { label: string; p: Product; value: string; onChange: (v: string) => void }) {
  return (
    <div className="rounded-lg border border-border/60 p-3">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="mt-2 flex gap-3">
        <ProductThumb p={p} />
        <p className="text-sm font-medium">{p.title}</p>
      </div>
      <div className="mt-3">
        <Label className="text-xs">Variante</Label>
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
          <SelectContent>
            {(p.variants ?? []).map((v) => (
              <SelectItem key={String(v.id)} value={String(v.id)}>{v.title} {v.sku ? `· ${v.sku}` : ""}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

/* ----------------- TAG TAB ----------------- */
function TagTab({ sourceId, targetId, workspaceId }: { sourceId: string; targetId: string; workspaceId: string | null }) {
  const qc = useQueryClient();
  const [tag, setTag] = useState("");

  const rules = useQuery({
    queryKey: ["tag-rules", sourceId, targetId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tag_mapping_rules")
        .select("id, tag")
        .eq("source_store_id", sourceId)
        .eq("target_store_id", targetId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const apply = useMutation({
    mutationFn: async (newTag: string) => {
      if (!workspaceId) throw new Error("Workspace não encontrado");
      const { error: insErr } = await supabase.from("tag_mapping_rules").insert({
        workspace_id: workspaceId, source_store_id: sourceId, target_store_id: targetId, tag: newTag,
      });
      if (insErr && !insErr.message.includes("duplicate")) throw insErr;

      // Find source products with the tag and target products by handle/title match
      const { data: sourceProducts } = await supabase
        .from("products").select("id, handle, title, tags").eq("store_id", sourceId).contains("tags", [newTag]);
      const { data: targetProducts } = await supabase
        .from("products").select("id, handle, title").eq("store_id", targetId);
      if (!sourceProducts?.length) return { created: 0 };

      const targetByHandle = new Map((targetProducts ?? []).map((p) => [p.handle, p.id]));
      const targetByTitle = new Map((targetProducts ?? []).map((p) => [p.title.toLowerCase(), p.id]));
      type MappingInsert = {
        workspace_id: string;
        source_product_id: string;
        source_store_id: string;
        target_product_id: string;
        target_store_id: string;
        mapping_method: "tag";
      };
      const rows: MappingInsert[] = sourceProducts
        .map((sp) => {
          const tid = (sp.handle && targetByHandle.get(sp.handle)) || targetByTitle.get(sp.title.toLowerCase());
          if (!tid) return null;
          return {
            workspace_id: workspaceId, source_product_id: sp.id, source_store_id: sourceId,
            target_product_id: tid, target_store_id: targetId, mapping_method: "tag" as const,
          };
        })
        .filter((r): r is MappingInsert => r !== null);
      if (rows.length === 0) return { created: 0 };
      const { error } = await supabase.from("product_mappings").upsert(rows, { onConflict: "source_product_id,target_store_id" });
      if (error) throw error;
      return { created: rows.length };
    },
    onSuccess: (r) => {
      toast.success(`${r.created} mapeamentos criados`);
      setTag("");
      qc.invalidateQueries({ queryKey: ["tag-rules", sourceId, targetId] });
      qc.invalidateQueries({ queryKey: ["mappings", sourceId, targetId] });
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : String(e)),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tag_mapping_rules").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tag-rules", sourceId, targetId] }),
  });

  return (
    <Card className="border-border/60 bg-card p-6">
      <h3 className="text-base font-semibold">Mapeamento por tag</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Produtos da vitrine com a tag escolhida serão mapeados com produtos de mesmo handle ou título na loja destino.
      </p>
      <div className="mt-4 flex gap-2">
        <Input placeholder="ex.: launch-2024" value={tag} onChange={(e) => setTag(e.target.value)} />
        <Button onClick={() => tag && apply.mutate(tag.trim())} disabled={apply.isPending || !tag.trim()}>
          {apply.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Aplicar
        </Button>
      </div>
      <div className="mt-6">
        <h4 className="text-sm font-semibold">Regras ativas</h4>
        <div className="mt-2 space-y-2">
          {rules.data?.map((r) => (
            <div key={r.id} className="flex items-center justify-between rounded border border-border/60 p-2 text-sm">
              <Badge variant="secondary"><Tag className="mr-1 h-3 w-3" />{r.tag}</Badge>
              <Button size="icon" variant="ghost" onClick={() => remove.mutate(r.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
            </div>
          ))}
          {!rules.data?.length && <p className="text-xs text-muted-foreground">Nenhuma regra configurada.</p>}
        </div>
      </div>
    </Card>
  );
}

/* ----------------- AI TAB ----------------- */
function AiTab({ sourceId, targetId, workspaceId }: { sourceId: string; targetId: string; workspaceId: string | null }) {
  const qc = useQueryClient();
  const suggest = useServerFn(aiSuggestMappings);
  const [suggestions, setSuggestions] = useState<Array<{ source_product_id: string; target_product_id: string; confidence: number; reason: string }>>([]);
  const [ignored, setIgnored] = useState<Set<string>>(new Set());
  const source = useStoreProducts(sourceId);
  const target = useStoreProducts(targetId);

  const analyze = useMutation({
    mutationFn: async () => suggest({ data: { sourceStoreId: sourceId, targetStoreId: targetId } }),
    onSuccess: (r) => { setSuggestions(r.suggestions); setIgnored(new Set()); },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : String(e)),
  });

  const accept = useMutation({
    mutationFn: async (s: { source_product_id: string; target_product_id: string; confidence: number }) => {
      if (!workspaceId) throw new Error("Workspace não encontrado");
      const { error } = await supabase.from("product_mappings").upsert({
        workspace_id: workspaceId,
        source_product_id: s.source_product_id, source_store_id: sourceId,
        target_product_id: s.target_product_id, target_store_id: targetId,
        mapping_method: "ai", confidence_score: s.confidence,
      }, { onConflict: "source_product_id,target_store_id" });
      if (error) throw error;
    },
    onSuccess: (_d, s) => {
      toast.success("Mapeamento aceito");
      setIgnored((prev) => new Set(prev).add(`${s.source_product_id}-${s.target_product_id}`));
      qc.invalidateQueries({ queryKey: ["mappings", sourceId, targetId] });
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : String(e)),
  });

  return (
    <Card className="border-border/60 bg-card p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold">Sugestões por IA</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            A IA compara títulos e descrições e propõe pares com pontuação de confiança.
          </p>
        </div>
        <Button onClick={() => analyze.mutate()} disabled={analyze.isPending}>
          {analyze.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
          Analisar e sugerir
        </Button>
      </div>

      <div className="mt-6 space-y-3">
        {suggestions.length === 0 && !analyze.isPending && (
          <p className="py-6 text-center text-sm text-muted-foreground">Nenhuma sugestão ainda. Clique em Analisar.</p>
        )}
        {suggestions.map((s) => {
          const key = `${s.source_product_id}-${s.target_product_id}`;
          if (ignored.has(key)) return null;
          const sp = source.data?.find((p) => p.id === s.source_product_id);
          const tp = target.data?.find((p) => p.id === s.target_product_id);
          return (
            <div key={key} className="rounded-lg border border-border/60 p-4">
              <div className="grid items-center gap-3 sm:grid-cols-[1fr_auto_1fr_auto]">
                <div className="flex items-center gap-3"><ProductThumb p={sp!} /><div className="min-w-0"><p className="truncate text-sm font-medium">{sp?.title}</p></div></div>
                <ArrowRight className="hidden h-4 w-4 text-muted-foreground sm:block" />
                <div className="flex items-center gap-3"><ProductThumb p={tp!} /><div className="min-w-0"><p className="truncate text-sm font-medium">{tp?.title}</p></div></div>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={() => setIgnored((prev) => new Set(prev).add(key))}><X className="mr-1 h-3.5 w-3.5" />Ignorar</Button>
                  <Button size="sm" onClick={() => accept.mutate(s)}><Check className="mr-1 h-3.5 w-3.5" />Aceitar</Button>
                </div>
              </div>
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{s.reason}</span><span className="font-mono">{s.confidence}%</span>
                </div>
                <Progress value={s.confidence} className="mt-1 h-1.5" />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

/* ----------------- AUTO TAB ----------------- */
function AutoTab({ sourceId, workspaceId, checkouts }: { sourceId: string; workspaceId: string | null; checkouts: Store[] }) {
  const qc = useQueryClient();

  const settings = useQuery({
    queryKey: ["auto-sync", sourceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("auto_sync_settings")
        .select("id, target_store_id, is_enabled")
        .eq("source_store_id", sourceId);
      if (error) throw error;
      return data ?? [];
    },
  });

  const enabledFor = useMemo(() => {
    const m = new Map<string, { id: string; enabled: boolean }>();
    settings.data?.forEach((s) => m.set(s.target_store_id, { id: s.id, enabled: s.is_enabled }));
    return m;
  }, [settings.data]);

  const toggle = useMutation({
    mutationFn: async ({ targetStoreId, enabled }: { targetStoreId: string; enabled: boolean }) => {
      if (!workspaceId) throw new Error("Workspace não encontrado");
      const existing = enabledFor.get(targetStoreId);
      if (existing) {
        const { error } = await supabase.from("auto_sync_settings").update({ is_enabled: enabled }).eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("auto_sync_settings").insert({
          workspace_id: workspaceId, source_store_id: sourceId, target_store_id: targetStoreId, is_enabled: enabled,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["auto-sync", sourceId] }),
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : String(e)),
  });

  return (
    <Card className="border-border/60 bg-card p-6">
      <h3 className="text-base font-semibold">Sincronização automática</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Quando ativo, produtos novos adicionados na Loja Vitrine serão criados nas Lojas de Checkout selecionadas via Shopify API.
      </p>
      <div className="mt-6 space-y-3">
        {checkouts.map((s) => {
          const cur = enabledFor.get(s.id);
          const enabled = !!cur?.enabled;
          return (
            <div key={s.id} className="flex items-center justify-between rounded border border-border/60 p-3">
              <div>
                <p className="text-sm font-medium">{s.display_name ?? s.shopify_domain}</p>
                <p className="text-xs text-muted-foreground">{s.shopify_domain}</p>
              </div>
              <Switch checked={enabled} onCheckedChange={(v) => toggle.mutate({ targetStoreId: s.id, enabled: v })} />
            </div>
          );
        })}
        {!checkouts.length && <p className="text-xs text-muted-foreground">Nenhuma loja de checkout conectada.</p>}
      </div>
    </Card>
  );
}