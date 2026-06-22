import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Wand2, ImageIcon, Loader2 } from "@/components/icon";

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { bulkUpdateText, replaceProductImage } from "@/lib/api/bulk-edit.functions";

export const Route = createFileRoute("/_authenticated/dashboard/bulk-edit")({
  head: () => ({ meta: [{ title: "Edição em massa — Shop2Shops" }] }),
  component: BulkEditPage,
});

type Product = {
  id: string;
  shopify_product_id: string;
  title: string;
  description: string | null;
  images: Array<{ id?: number; src?: string }> | null;
};

function BulkEditPage() {
  const [storeId, setStoreId] = useState<string>("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const storesQ = useQuery({
    queryKey: ["be-stores"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stores")
        .select("id, display_name, store_type")
        .eq("store_type", "checkout");
      if (error) throw error;
      return data ?? [];
    },
  });

  const productsQ = useQuery({
    queryKey: ["be-products", storeId],
    enabled: !!storeId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, shopify_product_id, title, description, images")
        .eq("store_id", storeId)
        .limit(500);
      if (error) throw error;
      return (data ?? []) as Product[];
    },
  });

  const allIds = useMemo(() => (productsQ.data ?? []).map((p) => p.id), [productsQ.data]);
  const allChecked = allIds.length > 0 && allIds.every((i) => selected.has(i));

  function toggleAll() {
    setSelected(allChecked ? new Set() : new Set(allIds));
  }
  function toggle(id: string) {
    setSelected((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }

  const selectedProducts = useMemo(
    () => (productsQ.data ?? []).filter((p) => selected.has(p.id)),
    [productsQ.data, selected],
  );

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex-1 p-6 space-y-6">
          <div className="flex items-center gap-3">
            <SidebarTrigger />
            <h1 className="text-2xl font-semibold">Edição em massa</h1>
            <Badge variant="secondary" className="ml-2">Loja de checkout</Badge>
          </div>

          <Card className="p-4 space-y-4">
            <div className="flex items-end gap-4 flex-wrap">
              <div className="min-w-64">
                <Label>Loja alvo</Label>
                <Select value={storeId} onValueChange={(v) => { setStoreId(v); setSelected(new Set()); }}>
                  <SelectTrigger><SelectValue placeholder="Selecione uma loja" /></SelectTrigger>
                  <SelectContent>
                    {(storesQ.data ?? []).map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.display_name ?? s.id}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {storeId && (
                <div className="text-sm text-muted-foreground">
                  {selected.size} de {productsQ.data?.length ?? 0} selecionados
                </div>
              )}
            </div>

            {storeId && (
              <div className="border rounded max-h-72 overflow-auto">
                <div className="flex items-center gap-2 px-3 py-2 border-b bg-muted/30 sticky top-0">
                  <Checkbox checked={allChecked} onCheckedChange={toggleAll} />
                  <span className="text-sm font-medium">Selecionar todos</span>
                </div>
                {(productsQ.data ?? []).map((p) => (
                  <label key={p.id} className="flex items-center gap-3 px-3 py-2 hover:bg-muted/30 cursor-pointer">
                    <Checkbox checked={selected.has(p.id)} onCheckedChange={() => toggle(p.id)} />
                    <img
                      src={p.images?.[0]?.src ?? ""}
                      alt=""
                      className="h-10 w-10 object-cover rounded bg-muted"
                    />
                    <span className="text-sm flex-1 truncate">{p.title}</span>
                  </label>
                ))}
                {storeId && (productsQ.data ?? []).length === 0 && (
                  <div className="p-8 text-center text-sm text-muted-foreground">Nenhum produto sincronizado.</div>
                )}
              </div>
            )}
          </Card>

          {selected.size > 0 && (
            <Tabs defaultValue="text">
              <TabsList>
                <TabsTrigger value="text"><Wand2 className="h-4 w-4 mr-2" /> Título e descrição</TabsTrigger>
                <TabsTrigger value="image"><ImageIcon className="h-4 w-4 mr-2" /> Descaracterizar fotos</TabsTrigger>
              </TabsList>
              <TabsContent value="text">
                <TextEditor storeId={storeId} productIds={[...selected]} />
              </TabsContent>
              <TabsContent value="image">
                <ImageEditor storeId={storeId} products={selectedProducts} />
              </TabsContent>
            </Tabs>
          )}
        </main>
      </div>
    </SidebarProvider>
  );
}

function TextEditor({ storeId, productIds }: { storeId: string; productIds: string[] }) {
  const run = useServerFn(bulkUpdateText);
  const [tp, setTp] = useState(""); const [ts, setTs] = useState("");
  const [tf, setTf] = useState(""); const [tr, setTr] = useState("");
  const [dp, setDp] = useState(""); const [ds, setDs] = useState("");
  const [df, setDf] = useState(""); const [dr, setDr] = useState("");
  const [busy, setBusy] = useState(false);

  async function apply() {
    setBusy(true);
    try {
      const r = await run({ data: {
        store_id: storeId, product_ids: productIds,
        title_prefix: tp || undefined, title_suffix: ts || undefined,
        title_find: tf || undefined, title_replace: tr || undefined,
        desc_prefix: dp || undefined, desc_suffix: ds || undefined,
        desc_find: df || undefined, desc_replace: dr || undefined,
      }});
      toast.success(`${r.ok} atualizados, ${r.failed} falharam`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally { setBusy(false); }
  }

  return (
    <Card className="p-5 space-y-5">
      <div className="grid md:grid-cols-2 gap-5">
        <div className="space-y-3">
          <h3 className="font-medium">Título</h3>
          <div><Label>Prefixo</Label><Input value={tp} onChange={(e) => setTp(e.target.value)} placeholder="Ex: [PROMO] " /></div>
          <div><Label>Sufixo</Label><Input value={ts} onChange={(e) => setTs(e.target.value)} placeholder=" - Frete Grátis" /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Localizar</Label><Input value={tf} onChange={(e) => setTf(e.target.value)} /></div>
            <div><Label>Substituir por</Label><Input value={tr} onChange={(e) => setTr(e.target.value)} /></div>
          </div>
        </div>
        <div className="space-y-3">
          <h3 className="font-medium">Descrição</h3>
          <div><Label>Prefixo</Label><Textarea value={dp} onChange={(e) => setDp(e.target.value)} rows={2} /></div>
          <div><Label>Sufixo</Label><Textarea value={ds} onChange={(e) => setDs(e.target.value)} rows={2} /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Localizar</Label><Input value={df} onChange={(e) => setDf(e.target.value)} /></div>
            <div><Label>Substituir por</Label><Input value={dr} onChange={(e) => setDr(e.target.value)} /></div>
          </div>
        </div>
      </div>
      <div className="flex justify-end">
        <Button onClick={apply} disabled={busy}>
          {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Aplicar em {productIds.length} produto(s)
        </Button>
      </div>
    </Card>
  );
}

/** Image editor: pick crop region on a sample image, apply to all selected. */
function ImageEditor({ storeId, products }: { storeId: string; products: Product[] }) {
  const run = useServerFn(replaceProductImage);
  const sample = products.find((p) => p.images?.[0]?.src) ?? products[0];
  const sampleSrc = sample?.images?.[0]?.src ?? "";

  // Normalized crop rect (0..1)
  const [rect, setRect] = useState({ x: 0.15, y: 0.15, w: 0.7, h: 0.7 });
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [log, setLog] = useState<{ id: string; ok: boolean; error?: string }[]>([]);

  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ x: number; y: number } | null>(null);

  function onMouseDown(e: React.MouseEvent) {
    const el = containerRef.current; if (!el) return;
    const r = el.getBoundingClientRect();
    dragRef.current = { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height };
    setRect({ x: dragRef.current.x, y: dragRef.current.y, w: 0, h: 0 });
  }
  function onMouseMove(e: React.MouseEvent) {
    if (!dragRef.current) return;
    const el = containerRef.current; if (!el) return;
    const r = el.getBoundingClientRect();
    const cx = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    const cy = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
    const x = Math.min(dragRef.current.x, cx);
    const y = Math.min(dragRef.current.y, cy);
    const w = Math.abs(cx - dragRef.current.x);
    const h = Math.abs(cy - dragRef.current.y);
    setRect({ x, y, w, h });
  }
  function onMouseUp() { dragRef.current = null; }

  async function cropOne(src: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const sx = rect.x * img.width;
        const sy = rect.y * img.height;
        const sw = Math.max(1, rect.w * img.width);
        const sh = Math.max(1, rect.h * img.height);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(sw);
        canvas.height = Math.round(sh);
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas indisponível"));
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
        resolve(dataUrl.split(",")[1] ?? "");
      };
      img.onerror = () => reject(new Error("Não foi possível carregar a imagem (CORS?)"));
      img.src = src;
    });
  }

  async function apply() {
    if (rect.w < 0.05 || rect.h < 0.05) {
      return toast.error("Selecione uma área maior da imagem");
    }
    setBusy(true); setProgress(0); setLog([]);
    const targets = products.filter((p) => p.images?.[0]?.src);
    for (let i = 0; i < targets.length; i++) {
      const p = targets[i];
      try {
        const src = p.images?.[0]?.src ?? "";
        const b64 = await cropOne(src);
        await run({ data: { store_id: storeId, product_id: p.id, image_base64: b64, filename: `s2s-${p.id}.jpg` } });
        setLog((l) => [...l, { id: p.id, ok: true }]);
      } catch (e) {
        setLog((l) => [...l, { id: p.id, ok: false, error: (e as Error).message }]);
      }
      setProgress(Math.round(((i + 1) / targets.length) * 100));
    }
    setBusy(false);
    toast.success("Processamento concluído");
  }

  useEffect(() => () => { dragRef.current = null; }, []);

  return (
    <Card className="p-5 space-y-4">
      <div>
        <h3 className="font-medium">Selecionar área (super zoom)</h3>
        <p className="text-sm text-muted-foreground">
          Arraste sobre a imagem para escolher a região. O recorte (sem marca/logo)
          será aplicado em todas as {products.length} fotos e substituído direto na Shopify.
          O processamento acontece no seu navegador.
        </p>
      </div>

      {sampleSrc ? (
        <div className="grid md:grid-cols-2 gap-4">
          <div
            ref={containerRef}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            className="relative select-none border rounded overflow-hidden bg-muted aspect-square cursor-crosshair"
          >
            <img src={sampleSrc} alt="" crossOrigin="anonymous" className="absolute inset-0 w-full h-full object-contain pointer-events-none" />
            <div
              className="absolute border-2 border-primary bg-primary/10 pointer-events-none"
              style={{
                left: `${rect.x * 100}%`, top: `${rect.y * 100}%`,
                width: `${rect.w * 100}%`, height: `${rect.h * 100}%`,
              }}
            />
          </div>
          <div>
            <Label>Pré-visualização do recorte</Label>
            <div className="border rounded overflow-hidden bg-muted aspect-square mt-1">
              <div
                className="w-full h-full bg-no-repeat"
                style={{
                  backgroundImage: `url("${sampleSrc}")`,
                  backgroundSize: `${100 / Math.max(rect.w, 0.01)}% ${100 / Math.max(rect.h, 0.01)}%`,
                  backgroundPosition: `${(rect.x / Math.max(1 - rect.w, 0.01)) * 100}% ${(rect.y / Math.max(1 - rect.h, 0.01)) * 100}%`,
                }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Região: x {(rect.x * 100).toFixed(0)}% y {(rect.y * 100).toFixed(0)}% — {(rect.w * 100).toFixed(0)}×{(rect.h * 100).toFixed(0)}%
            </p>
          </div>
        </div>
      ) : (
        <div className="text-sm text-muted-foreground">Nenhum produto selecionado tem imagem.</div>
      )}

      {busy && <Progress value={progress} />}
      {log.length > 0 && (
        <div className="text-xs text-muted-foreground">
          {log.filter((l) => l.ok).length} OK · {log.filter((l) => !l.ok).length} falhas
        </div>
      )}

      <div className="flex justify-end">
        <Button onClick={apply} disabled={busy || !sampleSrc}>
          {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Aplicar recorte em {products.length} foto(s)
        </Button>
      </div>
    </Card>
  );
}