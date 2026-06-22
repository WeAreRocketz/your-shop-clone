import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Wand2, ShoppingCart, AlertTriangle, Sparkles } from "@/components/icon";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard/camuflador")({
  head: () => ({ meta: [{ title: "Camuflador — Shop2Shops" }] }),
  component: CamufladorPage,
});

type Store = { id: string; display_name: string | null; shopify_domain: string; store_type: string };
type Product = { id: string; title: string; images: unknown };

type Settings = {
  store_id: string;
  enabled: boolean;
  zoom: number;
  blur: number;
  brightness: number;
  saturation: number;
  hue_shift: number;
  flip_horizontal: boolean;
  watermark_text: string | null;
  apply_to_titles: boolean;
  title_suffix: string | null;
};

const DEFAULTS: Omit<Settings, "store_id"> = {
  enabled: false,
  zoom: 1,
  blur: 0,
  brightness: 1,
  saturation: 1,
  hue_shift: 0,
  flip_horizontal: false,
  watermark_text: "",
  apply_to_titles: false,
  title_suffix: "",
};

function CamufladorPage() {
  const { data: stores } = useQuery({
    queryKey: ["cam-checkout-stores"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stores")
        .select("id, display_name, shopify_domain, store_type")
        .eq("store_type", "checkout");
      if (error) throw error;
      return (data ?? []) as Store[];
    },
  });

  const [selectedId, setSelectedId] = useState<string | null>(null);
  useEffect(() => {
    if (!selectedId && stores && stores[0]) setSelectedId(stores[0].id);
  }, [stores, selectedId]);

  if (!stores) {
    return <Shell><p className="text-sm text-muted-foreground">Carregando…</p></Shell>;
  }

  if (stores.length === 0) {
    return (
      <Shell>
        <Card className="p-10 text-center space-y-3">
          <ShoppingCart className="h-8 w-8 mx-auto text-muted-foreground" />
          <p className="text-sm">Conecte ao menos uma loja Checkout para configurar o camuflador.</p>
        </Card>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Select value={selectedId ?? undefined} onValueChange={setSelectedId}>
            <SelectTrigger className="w-72">
              <SelectValue placeholder="Selecione a loja checkout" />
            </SelectTrigger>
            <SelectContent>
              {stores.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.display_name ?? s.shopify_domain}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Badge variant="outline" className="text-[10px]">Checkout</Badge>
        </div>

        <div className="flex items-start gap-2 rounded-md border border-yellow-500/30 bg-yellow-500/5 px-3 py-2 max-w-md">
          <AlertTriangle className="h-3.5 w-3.5 text-yellow-500 mt-0.5 shrink-0" />
          <p className="text-[11px] text-yellow-200/90">
            As modificações são aplicadas <strong>no navegador do visitante</strong> (client-side), via script injetado na loja Shopify. Sua loja original permanece intacta.
          </p>
        </div>
      </div>

      {selectedId && <CamufladorEditor storeId={selectedId} />}
    </Shell>
  );
}

function CamufladorEditor({ storeId }: { storeId: string }) {
  const qc = useQueryClient();

  const { data: loaded } = useQuery({
    queryKey: ["cam-settings", storeId],
    queryFn: async () => {
      const { data } = await supabase
        .from("store_camouflage_settings")
        .select("*")
        .eq("store_id", storeId)
        .maybeSingle();
      return data as Settings | null;
    },
  });

  const [s, setS] = useState<Settings>({ store_id: storeId, ...DEFAULTS });
  useEffect(() => {
    setS(loaded ? { ...DEFAULTS, ...loaded, store_id: storeId } : { store_id: storeId, ...DEFAULTS });
  }, [loaded, storeId]);

  const { data: sampleProduct } = useQuery({
    queryKey: ["cam-sample", storeId],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("id, title, images")
        .eq("store_id", storeId)
        .limit(1)
        .maybeSingle();
      return data as Product | null;
    },
  });

  const sampleImage = useMemo(() => {
    if (Array.isArray(sampleProduct?.images) && typeof sampleProduct?.images[0] === "string") {
      return sampleProduct.images[0] as string;
    }
    return null;
  }, [sampleProduct]);

  async function save() {
    const payload = {
      store_id: storeId,
      enabled: s.enabled,
      zoom: s.zoom,
      blur: s.blur,
      brightness: s.brightness,
      saturation: s.saturation,
      hue_shift: s.hue_shift,
      flip_horizontal: s.flip_horizontal,
      watermark_text: s.watermark_text || null,
      apply_to_titles: s.apply_to_titles,
      title_suffix: s.title_suffix || null,
    };
    const { error } = await supabase
      .from("store_camouflage_settings")
      .upsert(payload, { onConflict: "store_id" });
    if (error) return toast.error(error.message);
    toast.success("Camuflador salvo");
    qc.invalidateQueries({ queryKey: ["cam-settings", storeId] });
  }

  const filter = `blur(${s.blur}px) brightness(${s.brightness}) saturate(${s.saturation}) hue-rotate(${s.hue_shift}deg)`;
  const transform = `scale(${s.zoom}) ${s.flip_horizontal ? "scaleX(-1)" : ""}`;

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_420px]">
      {/* Controls */}
      <Card className="p-5 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wand2 className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">Modificações visuais</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{s.enabled ? "Ativo" : "Inativo"}</span>
            <Switch checked={s.enabled} onCheckedChange={(v) => setS((p) => ({ ...p, enabled: v }))} />
          </div>
        </div>

        <SliderRow label="Zoom" value={s.zoom} min={1} max={1.5} step={0.01} unit="x"
          onChange={(v) => setS((p) => ({ ...p, zoom: v }))} />
        <SliderRow label="Desfoque" value={s.blur} min={0} max={8} step={0.1} unit="px"
          onChange={(v) => setS((p) => ({ ...p, blur: v }))} />
        <SliderRow label="Brilho" value={s.brightness} min={0.6} max={1.4} step={0.01}
          onChange={(v) => setS((p) => ({ ...p, brightness: v }))} />
        <SliderRow label="Saturação" value={s.saturation} min={0} max={2} step={0.01}
          onChange={(v) => setS((p) => ({ ...p, saturation: v }))} />
        <SliderRow label="Variação de matiz" value={s.hue_shift} min={0} max={360} step={1} unit="°"
          onChange={(v) => setS((p) => ({ ...p, hue_shift: Math.round(v) }))} />

        <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2">
          <div>
            <Label className="text-xs font-medium">Espelhar horizontalmente</Label>
            <p className="text-[11px] text-muted-foreground">Inverte a imagem para diferenciar do produto original.</p>
          </div>
          <Switch checked={s.flip_horizontal} onCheckedChange={(v) => setS((p) => ({ ...p, flip_horizontal: v }))} />
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-medium">Marca d'água sobre a imagem</Label>
          <Input
            placeholder="Ex.: Oferta exclusiva"
            value={s.watermark_text ?? ""}
            onChange={(e) => setS((p) => ({ ...p, watermark_text: e.target.value }))}
          />
        </div>

        <div className="rounded-lg border bg-muted/20 p-3 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-xs font-medium">Camuflar também os títulos</Label>
              <p className="text-[11px] text-muted-foreground">Adiciona um sufixo discreto a cada título.</p>
            </div>
            <Switch checked={s.apply_to_titles} onCheckedChange={(v) => setS((p) => ({ ...p, apply_to_titles: v }))} />
          </div>
          {s.apply_to_titles && (
            <Input
              placeholder="Ex.: — Edição especial"
              value={s.title_suffix ?? ""}
              onChange={(e) => setS((p) => ({ ...p, title_suffix: e.target.value }))}
            />
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => setS({ store_id: storeId, ...DEFAULTS })}>
            Resetar
          </Button>
          <Button onClick={save}>
            <Sparkles className="h-3.5 w-3.5 mr-1.5" /> Salvar camuflador
          </Button>
        </div>
      </Card>

      {/* Preview */}
      <Card className="p-5 space-y-3 self-start sticky top-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Pré-visualização ao vivo</h2>
          <Badge variant="secondary" className="text-[10px]">Client-side</Badge>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <PreviewCard label="Original" imgSrc={sampleImage} title={sampleProduct?.title ?? "Produto"} />
          <div className="space-y-2">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Camuflado</div>
            <div className="relative aspect-square w-full overflow-hidden rounded-lg border bg-muted">
              {sampleImage ? (
                <img
                  src={sampleImage}
                  alt=""
                  className="h-full w-full object-cover transition-all duration-200"
                  style={{ filter, transform }}
                />
              ) : (
                <div className="h-full w-full grid place-items-center text-xs text-muted-foreground">Sem imagem</div>
              )}
              {s.watermark_text && (
                <div className="absolute inset-0 grid place-items-center pointer-events-none">
                  <span className="text-white/70 text-sm font-semibold tracking-wide drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)] rotate-[-12deg]">
                    {s.watermark_text}
                  </span>
                </div>
              )}
            </div>
            <p className="text-xs font-medium truncate">
              {(sampleProduct?.title ?? "Produto")}{s.apply_to_titles && s.title_suffix ? ` ${s.title_suffix}` : ""}
            </p>
          </div>
        </div>

        <p className="text-[11px] text-muted-foreground pt-1">
          Esta pré-visualização usa exatamente os mesmos filtros CSS aplicados no navegador do visitante.
        </p>
      </Card>
    </div>
  );
}

function PreviewCard({ label, imgSrc, title }: { label: string; imgSrc: string | null; title: string }) {
  return (
    <div className="space-y-2">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="aspect-square w-full overflow-hidden rounded-lg border bg-muted">
        {imgSrc ? (
          <img src={imgSrc} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full grid place-items-center text-xs text-muted-foreground">Sem imagem</div>
        )}
      </div>
      <p className="text-xs font-medium truncate">{title}</p>
    </div>
  );
}

function SliderRow({
  label, value, min, max, step, unit, onChange,
}: {
  label: string; value: number; min: number; max: number; step: number; unit?: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <Label>{label}</Label>
        <span className="tabular-nums text-muted-foreground">
          {value.toFixed(step < 1 ? 2 : 0)}{unit ?? ""}
        </span>
      </div>
      <Slider value={[value]} min={min} max={max} step={step} onValueChange={(v) => onChange(v[0])} />
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <main className="flex-1 overflow-auto">
          <header className="flex h-16 items-center gap-4 border-b border-border px-6">
            <SidebarTrigger />
            <div className="flex items-center gap-2">
              <Wand2 className="h-5 w-5 text-primary" />
              <div>
                <h1 className="text-lg font-bold">Camuflador</h1>
                <p className="text-xs text-muted-foreground">
                  Modifica imagens e títulos no navegador do visitante para diferenciá-los da loja original.
                </p>
              </div>
            </div>
          </header>
          <div className="p-6 space-y-5">{children}</div>
        </main>
      </div>
    </SidebarProvider>
  );
}