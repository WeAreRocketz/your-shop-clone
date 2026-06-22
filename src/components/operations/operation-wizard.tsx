import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  ArrowLeft, ArrowRight, Check, CheckCircle2, ChevronUp, ChevronDown,
  Sparkles, Store, ShoppingCart, Package, Wand2, Zap, Power, Activity,
  AlertTriangle, Copy, GripVertical,
} from "@/components/icon";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { upsertOperation, getOperation, setOperationStatus } from "@/lib/api/operations.functions";
import { aiSuggestMappings } from "@/lib/api/ai-map-products.functions";
import { listStorePixels } from "@/lib/api/store-pixels.functions";
import { createSyncJob, runSyncJob } from "@/lib/api/sync-products.functions";
import { cloneVitrineToCheckout } from "@/lib/api/clone-products.functions";
import { unifyMappedSkus } from "@/lib/api/unify-skus.functions";
import { defaultCartDrawerConfig } from "@/lib/cart-drawer/defaults";
import CartDrawerPreview from "@/components/cart-builder/CartDrawerPreview";
import type { CartDrawerConfig } from "@/lib/cart-drawer/types";
import { ExternalLink } from "@/components/icon";
import { Eye } from "lucide-react";

type Mode = "direct" | "warmup" | "smart_advance";
type CheckoutStore = {
  store_id: string;
  position: number;
  limit_metric?: "orders" | "revenue" | null;
  limit_window?: "day" | "week" | "month" | null;
  limit_value?: number | null;
};
type Draft = {
  id?: string;
  workspace_id: string;
  name: string;
  mode: Mode;
  vitrine_store_id: string | null;
  cart_template_id: string | null;
  current_step: number;
  warmup_simultaneous: boolean;
  checkout_stores: CheckoutStore[];
};

const STEPS = [
  { n: 1, label: "Vitrine", Icon: Store },
  { n: 2, label: "Modo", Icon: Sparkles },
  { n: 3, label: "Checkout", Icon: ShoppingCart },
  { n: 4, label: "Produtos", Icon: Package },
  { n: 5, label: "Camuflagem", Icon: Wand2 },
  { n: 6, label: "Carrinho", Icon: ShoppingCart },
  { n: 7, label: "Tracking", Icon: Activity },
  { n: 8, label: "Ativar", Icon: Zap },
];
const LAST_STEP = 8;

type CartLayout = "drawer" | "page";
type CartTemplate = {
  id: string;
  name: string;
  desc: string;
  accent: string;
  layout: CartLayout;
  // Overrides applied on top of defaultCartDrawerConfig for the preview
  preview?: Record<string, unknown>;
};
const CART_TEMPLATES: CartTemplate[] = [
  { id: "minimal",  name: "Minimal",      desc: "Limpo, foco em conversão",      accent: "from-sky-500/30 to-cyan-500/10",         layout: "drawer" },
  { id: "premium",  name: "Premium",      desc: "Detalhes ricos, prova social",  accent: "from-fuchsia-500/30 to-violet-500/10",   layout: "drawer" },
  { id: "express",  name: "Express",      desc: "Checkout em 1 clique",          accent: "from-amber-500/30 to-orange-500/10",     layout: "drawer" },
  { id: "story",    name: "Storytelling", desc: "Vídeo + bullets",               accent: "from-emerald-500/30 to-teal-500/10",     layout: "drawer" },
  { id: "page_classic", name: "Página Clássica",  desc: "Carrinho em página dedicada",  accent: "from-slate-500/30 to-zinc-500/10",    layout: "page" },
  { id: "page_focus",   name: "Página Focada",    desc: "Sem distrações, alto CRO",     accent: "from-rose-500/30 to-pink-500/10",     layout: "page" },
];

export function OperationWizard({
  workspaceId,
  operationId,
  onClose,
}: {
  workspaceId: string;
  operationId?: string;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const getOp = useServerFn(getOperation);
  const upsert = useServerFn(upsertOperation);
  const setStatus = useServerFn(setOperationStatus);

  const { data: loaded } = useQuery({
    queryKey: ["operation", operationId],
    queryFn: () => getOp({ data: { id: operationId! } }),
    enabled: !!operationId,
  });

  const [draft, setDraft] = useState<Draft>({
    workspace_id: workspaceId,
    name: "",
    mode: "direct",
    vitrine_store_id: null,
    cart_template_id: null,
    current_step: 1,
    warmup_simultaneous: false,
    checkout_stores: [],
  });

  useEffect(() => {
    if (loaded) {
      const stores = (loaded.operation_checkout_stores ?? []).map((c) => ({
        store_id: c.store_id,
        position: c.position,
        limit_metric: (c.limit_metric ?? null) as CheckoutStore["limit_metric"],
        limit_window: (c.limit_window ?? null) as CheckoutStore["limit_window"],
        limit_value: c.limit_value ? Number(c.limit_value) : null,
      }));
      setDraft({
        id: loaded.id,
        workspace_id: loaded.workspace_id,
        name: loaded.name,
        mode: loaded.mode as Mode,
        vitrine_store_id: loaded.vitrine_store_id,
        cart_template_id: loaded.cart_template_id,
        current_step: loaded.current_step,
        warmup_simultaneous: loaded.warmup_simultaneous,
        checkout_stores: stores,
      });
    }
  }, [loaded]);

  const step = draft.current_step;

  const saveMutation = useMutation({
    mutationFn: async (next: Partial<Draft>) => {
      const merged = { ...draft, ...next };
      const res = await upsert({ data: merged });
      return { ...merged, id: res.id };
    },
    onSuccess: (saved) => {
      setDraft(saved);
      qc.invalidateQueries({ queryKey: ["operations", workspaceId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function goNext() {
    if (!validateStep()) return;
    const nextStep = Math.min(LAST_STEP, step + 1);
    saveMutation.mutate({ current_step: nextStep });
  }
  function goPrev() {
    setDraft((d) => ({ ...d, current_step: Math.max(1, d.current_step - 1) }));
  }
  function validateStep(): boolean {
    if (step === 1) {
      if (!draft.name.trim()) return toastErr("Dê um nome à operação");
      if (!draft.vitrine_store_id) return toastErr("Selecione a loja vitrine");
    }
    if (step === 3) {
      if (!draft.checkout_stores.length) return toastErr("Selecione ao menos uma loja checkout");
    }
    if (step === 6 && !draft.cart_template_id) return toastErr("Escolha um modelo de carrinho");
    return true;
  }

  async function activate() {
    if (!draft.id) {
      const res = await upsert({ data: { ...draft, current_step: LAST_STEP } });
      await setStatus({ data: { id: res.id, status: "active" } });
    } else {
      await setStatus({ data: { id: draft.id, status: "active" } });
    }
    toast.success("Operação ativada! Tráfego sendo distribuído.");
    qc.invalidateQueries({ queryKey: ["operations", workspaceId] });
    onClose();
  }

  return (
    <div className="flex flex-col gap-6">
      <Stepper current={step} />
      <Card className="p-6 min-h-[420px]">
        {step === 1 && <StepVitrine draft={draft} setDraft={setDraft} workspaceId={workspaceId} />}
        {step === 2 && <StepMode draft={draft} setDraft={setDraft} />}
        {step === 3 && <StepCheckout draft={draft} setDraft={setDraft} workspaceId={workspaceId} />}
        {step === 4 && <StepProducts draft={draft} />}
        {step === 5 && <StepCamouflage draft={draft} onSkip={goNext} />}
        {step === 6 && <StepCart draft={draft} setDraft={setDraft} />}
        {step === 7 && <StepTracking draft={draft} onSkip={goNext} />}
        {step === 8 && <StepActivate draft={draft} onActivate={activate} />}
      </Card>
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onClose}>Cancelar</Button>
        <div className="flex gap-2">
          {step > 1 && (
            <Button variant="outline" onClick={goPrev}>
              <ArrowLeft className="mr-1" /> Voltar
            </Button>
          )}
          {step < LAST_STEP && (
            <Button onClick={goNext} disabled={saveMutation.isPending}>
              Próximo <ArrowRight className="ml-1" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function toastErr(m: string) {
  toast.error(m);
  return false;
}

function Stepper({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-1.5 md:gap-2.5 overflow-x-auto pb-2">
      {STEPS.map((s, i) => {
        const done = current > s.n;
        const active = current === s.n;
        return (
          <div key={s.n} className="flex items-center gap-1.5 md:gap-2.5">
            <div
              className={[
                "relative flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium",
                "transition-all duration-300 ease-out whitespace-nowrap",
                done
                  ? "bg-primary/10 text-primary ring-1 ring-inset ring-primary/30"
                  : active
                  ? "bg-primary text-primary-foreground ring-1 ring-inset ring-[color-mix(in_oklab,var(--color-primary)_60%,white_40%)] shadow-[0_1px_0_color-mix(in_oklab,white_40%,transparent)_inset,0_6px_16px_-6px_color-mix(in_oklab,var(--color-primary)_55%,transparent)] scale-[1.03]"
                  : "bg-muted/60 text-muted-foreground ring-1 ring-inset ring-border/60",
              ].join(" ")}
            >
              {done ? <Check className="h-3.5 w-3.5" /> : <s.Icon className="h-3.5 w-3.5" />}
              <span className="hidden md:inline tracking-tight">{s.label}</span>
              <span className="md:hidden">{s.n}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`h-px w-5 md:w-10 transition-colors ${
                  done
                    ? "bg-gradient-to-r from-primary/70 to-primary/30"
                    : "bg-border/70"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ---------------- Step 1: Vitrine ---------------- */
function StepVitrine({
  draft, setDraft, workspaceId,
}: { draft: Draft; setDraft: React.Dispatch<React.SetStateAction<Draft>>; workspaceId: string }) {
  const { data: stores } = useQuery({
    queryKey: ["op-vitrine-stores", workspaceId],
    queryFn: async () => {
      const { data } = await supabase
        .from("stores")
        .select("id, display_name, shopify_domain")
        .eq("workspace_id", workspaceId)
        .eq("store_type", "vitrine");
      return data ?? [];
    },
  });
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold">Nome & Loja Vitrine</h2>
        <p className="text-sm text-muted-foreground">A loja vitrine é onde o cliente entra.</p>
      </div>
      <div className="space-y-2">
        <Label>Nome da operação</Label>
        <Input
          value={draft.name}
          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          placeholder="Black Friday 2026"
        />
      </div>
      <div className="space-y-2">
        <Label>Loja vitrine</Label>
        <div className="grid gap-2 md:grid-cols-2">
          {stores?.map((s) => {
            const sel = draft.vitrine_store_id === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setDraft({ ...draft, vitrine_store_id: s.id })}
                className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-all ${
                  sel ? "border-primary bg-primary/5 shadow-[0_0_20px_color-mix(in_oklab,var(--color-primary)_30%,transparent)]" : "border-border hover:bg-accent"
                }`}
              >
                <Store className={`h-5 w-5 ${sel ? "text-primary" : "text-muted-foreground"}`} />
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{s.display_name ?? s.shopify_domain}</div>
                  <div className="truncate text-xs text-muted-foreground">{s.shopify_domain}</div>
                </div>
                {sel && <Check className="ml-auto h-5 w-5 text-primary" />}
              </button>
            );
          })}
          {!stores?.length && (
            <p className="text-sm text-muted-foreground">Nenhuma loja vitrine conectada. Vá em "Conectar Lojas" primeiro.</p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Step 2: Mode ---------------- */
function StepMode({ draft, setDraft }: { draft: Draft; setDraft: React.Dispatch<React.SetStateAction<Draft>> }) {
  const opts: Array<{ id: Mode; title: string; desc: string; bullets: string[] }> = [
    { id: "direct", title: "Direta", desc: "Uma loja checkout, sem firula.", bullets: ["Setup rápido", "100% do tráfego em 1 loja"] },
    { id: "warmup", title: "Aquecimento", desc: "Rodízio programado entre múltiplas lojas checkout.", bullets: ["Limites por loja", "Rotação automática", "Janela diária/semanal"] },
    { id: "smart_advance", title: "SmartAdvance", desc: "Múltiplas lojas em fila com failover inteligente.", bullets: ["Ordem de prioridade", "Detecta queda e ativa a próxima", "Aquecimento simultâneo opcional"] },
  ];
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold">Modo de operação</h2>
        <p className="text-sm text-muted-foreground">Como o tráfego deve ser distribuído.</p>
      </div>
      <RadioGroup value={draft.mode} onValueChange={(v) => setDraft({ ...draft, mode: v as Mode })} className="grid gap-3 md:grid-cols-3">
        {opts.map((o) => {
          const sel = draft.mode === o.id;
          return (
            <label
              key={o.id}
              className={`relative flex cursor-pointer flex-col gap-2 rounded-xl border p-4 transition-all ${
                sel ? "border-primary bg-primary/5 shadow-[0_0_24px_color-mix(in_oklab,var(--color-primary)_30%,transparent)]" : "border-border hover:bg-accent"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="font-semibold">{o.title}</div>
                <RadioGroupItem value={o.id} />
              </div>
              <p className="text-xs text-muted-foreground">{o.desc}</p>
              <ul className="mt-1 space-y-1">
                {o.bullets.map((b) => (
                  <li key={b} className="flex items-center gap-1.5 text-xs">
                    <CheckCircle2 className="h-3 w-3 text-primary" /> {b}
                  </li>
                ))}
              </ul>
            </label>
          );
        })}
      </RadioGroup>
      {draft.mode === "smart_advance" && (
        <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-3">
          <div>
            <div className="text-sm font-medium">Aquecimento simultâneo</div>
            <p className="text-xs text-muted-foreground">Combine fila + limites por loja.</p>
          </div>
          <Switch
            checked={draft.warmup_simultaneous}
            onCheckedChange={(v) => setDraft({ ...draft, warmup_simultaneous: v })}
          />
        </div>
      )}
    </div>
  );
}

/* ---------------- SKU helper ---------------- */
function firstSku(p: { variants?: unknown }): string | null {
  const arr = Array.isArray(p?.variants) ? (p.variants as Array<Record<string, unknown>>) : [];
  for (const v of arr) {
    const sku = typeof v?.sku === "string" ? v.sku.trim() : "";
    if (sku) return sku;
  }
  return null;
}

/* ---------------- Searchable product picker ---------------- */
type PickerProduct = { id: string; title: string; images?: unknown; variants?: unknown };
function ProductPicker({
  products,
  value,
  onChange,
  selected,
  selectedSku,
}: {
  products: PickerProduct[];
  value: string | null;
  onChange: (id: string) => void;
  selected?: PickerProduct;
  selectedSku?: string | null;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex-1 min-w-0 flex items-center gap-2 px-1 h-9 text-left text-sm hover:bg-accent/40 rounded-sm transition-colors"
        >
          <span className="min-w-0 flex-1">
            {selected ? (
              <>
                <span className="block truncate font-medium">{selected.title}</span>
                {selectedSku && (
                  <span className="block truncate text-[10px] text-muted-foreground font-mono">
                    SKU: {selectedSku}
                  </span>
                )}
              </>
            ) : (
              <span className="text-muted-foreground">— escolher produto —</span>
            )}
          </span>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[340px] p-0">
        <Command
          filter={(itemValue, search) => {
            const q = search.trim().toLowerCase();
            if (!q) return 1;
            return itemValue.toLowerCase().includes(q) ? 1 : 0;
          }}
        >
          <CommandInput placeholder="Buscar por título ou SKU…" />
          <CommandList>
            <CommandEmpty>Nenhum produto encontrado.</CommandEmpty>
            <CommandGroup>
              {products.map((t) => {
                const sku = firstSku(t);
                const img = Array.isArray(t.images) && typeof (t.images as unknown[])[0] === "string"
                  ? ((t.images as string[])[0])
                  : null;
                const itemValue = `${t.title} ${sku ?? ""} ${t.id}`;
                return (
                  <CommandItem
                    key={t.id}
                    value={itemValue}
                    onSelect={() => { onChange(t.id); setOpen(false); }}
                    className="flex items-center gap-2"
                  >
                    {img ? (
                      <img src={img} alt={t.title} className="h-7 w-7 shrink-0 rounded-sm object-cover ring-1 ring-border" loading="lazy" />
                    ) : (
                      <span className="h-7 w-7 shrink-0 rounded-sm bg-muted" />
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm">{t.title}</span>
                      {sku && <span className="block truncate text-[10px] text-muted-foreground font-mono">SKU: {sku}</span>}
                    </span>
                    {value === t.id && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

/* ---------------- Step 3: Checkout stores ---------------- */
function StepCheckout({
  draft, setDraft, workspaceId,
}: { draft: Draft; setDraft: React.Dispatch<React.SetStateAction<Draft>>; workspaceId: string }) {
  const { data: stores } = useQuery({
    queryKey: ["op-checkout-stores", workspaceId],
    queryFn: async () => {
      const { data } = await supabase
        .from("stores")
        .select("id, display_name, shopify_domain")
        .eq("workspace_id", workspaceId)
        .eq("store_type", "checkout");
      return data ?? [];
    },
  });

  const selected = draft.checkout_stores;
  const showLimits = draft.mode === "warmup" || (draft.mode === "smart_advance" && draft.warmup_simultaneous);
  const isQueue = draft.mode === "smart_advance";

  function toggle(storeId: string) {
    const exists = selected.find((s) => s.store_id === storeId);
    if (draft.mode === "direct") {
      setDraft({ ...draft, checkout_stores: [{ store_id: storeId, position: 0 }] });
      return;
    }
    if (exists) {
      setDraft({ ...draft, checkout_stores: selected.filter((s) => s.store_id !== storeId).map((s, i) => ({ ...s, position: i })) });
    } else {
      setDraft({ ...draft, checkout_stores: [...selected, { store_id: storeId, position: selected.length }] });
    }
  }
  function move(storeId: string, dir: -1 | 1) {
    const idx = selected.findIndex((s) => s.store_id === storeId);
    const target = idx + dir;
    if (idx < 0 || target < 0 || target >= selected.length) return;
    const next = [...selected];
    [next[idx], next[target]] = [next[target], next[idx]];
    setDraft({ ...draft, checkout_stores: next.map((s, i) => ({ ...s, position: i })) });
  }
  function patch(storeId: string, p: Partial<CheckoutStore>) {
    setDraft({
      ...draft,
      checkout_stores: selected.map((s) => (s.store_id === storeId ? { ...s, ...p } : s)),
    });
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold">Lojas Checkout</h2>
        <p className="text-sm text-muted-foreground">
          {draft.mode === "direct"
            ? "Escolha 1 loja onde a compra será finalizada."
            : isQueue
            ? "Selecione e ordene a fila. A primeira ativa, as próximas entram via failover."
            : "Selecione as lojas e defina os limites de rodízio."}
        </p>
      </div>
      <div className="grid gap-2 md:grid-cols-2">
        {stores?.map((s) => {
          const item = selected.find((x) => x.store_id === s.id);
          const sel = !!item;
          return (
            <button
              key={s.id}
              onClick={() => toggle(s.id)}
              className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-all ${
                sel ? "border-primary bg-primary/5" : "border-border hover:bg-accent"
              }`}
            >
              <ShoppingCart className={`h-5 w-5 ${sel ? "text-primary" : "text-muted-foreground"}`} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{s.display_name ?? s.shopify_domain}</div>
                <div className="truncate text-xs text-muted-foreground">{s.shopify_domain}</div>
              </div>
              {sel && <Check className="h-5 w-5 text-primary" />}
            </button>
          );
        })}
      </div>

      {selected.length > 0 && (draft.mode !== "direct") && (
        <div className="space-y-2">
          <div className="text-sm font-semibold">{isQueue ? "Ordem da fila" : "Configuração de rodízio"}</div>
          {selected.map((c, i) => {
            const store = stores?.find((s) => s.id === c.store_id);
            return (
              <div key={c.store_id} className="flex flex-col gap-3 rounded-lg border bg-muted/20 p-3 md:flex-row md:items-center">
                <div className="flex items-center gap-2">
                  {isQueue && (
                    <div className="flex flex-col">
                      <button onClick={() => move(c.store_id, -1)} className="rounded p-0.5 hover:bg-accent" disabled={i === 0}>
                        <ChevronUp className="h-4 w-4" />
                      </button>
                      <button onClick={() => move(c.store_id, 1)} className="rounded p-0.5 hover:bg-accent" disabled={i === selected.length - 1}>
                        <ChevronDown className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                  <Badge variant="secondary">#{i + 1}</Badge>
                  <span className="text-sm font-medium">{store?.display_name ?? store?.shopify_domain}</span>
                </div>
                {showLimits && (
                  <div className="ml-auto flex flex-wrap items-center gap-2">
                    <Select
                      value={c.limit_metric ?? ""}
                      onValueChange={(v) => patch(c.store_id, { limit_metric: v as "orders" | "revenue" })}
                    >
                      <SelectTrigger className="h-8 w-28"><SelectValue placeholder="Métrica" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="orders">Pedidos</SelectItem>
                        <SelectItem value="revenue">Faturamento</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select
                      value={c.limit_window ?? ""}
                      onValueChange={(v) => patch(c.store_id, { limit_window: v as "day" | "week" | "month" })}
                    >
                      <SelectTrigger className="h-8 w-24"><SelectValue placeholder="Janela" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="day">Dia</SelectItem>
                        <SelectItem value="week">Semana</SelectItem>
                        <SelectItem value="month">Mês</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      min={0}
                      value={c.limit_value ?? ""}
                      onChange={(e) => patch(c.store_id, { limit_value: e.target.value ? Number(e.target.value) : null })}
                      placeholder="Limite"
                      className="h-8 w-24"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ---------------- Step 4: Products ---------------- */
function StepProducts({ draft }: { draft: Draft }) {
  const sourceId = draft.vitrine_store_id;
  const [targetId, setTargetId] = useState<string | undefined>(draft.checkout_stores[0]?.store_id);
  useEffect(() => {
    if (!targetId && draft.checkout_stores[0]?.store_id) {
      setTargetId(draft.checkout_stores[0].store_id);
    }
  }, [draft.checkout_stores, targetId]);

  const checkoutIds = draft.checkout_stores.map((c) => c.store_id);
  const { data: checkoutStores } = useQuery({
    queryKey: ["op-checkout-store-names", checkoutIds.join(",")],
    enabled: checkoutIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase
        .from("stores")
        .select("id, display_name, shopify_domain")
        .in("id", checkoutIds);
      return data ?? [];
    },
  });

  const [mode, setMode] = useState<"manual" | "ai">("manual");
  const aiSuggest = useServerFn(aiSuggestMappings);
  const createJob = useServerFn(createSyncJob);
  const runJob = useServerFn(runSyncJob);
  const cloneFn = useServerFn(cloneVitrineToCheckout);
  const unifyFn = useServerFn(unifyMappedSkus);
  const qc = useQueryClient();

  const { data: source, refetch: refetchSource } = useQuery({
    queryKey: ["op-prod-src", sourceId],
    enabled: !!sourceId,
    queryFn: async () => {
      const { data } = await supabase.from("products").select("id, title, images, variants").eq("store_id", sourceId!).limit(200);
      return data ?? [];
    },
  });
  const { data: target, refetch: refetchTarget } = useQuery({
    queryKey: ["op-prod-tgt", targetId],
    enabled: !!targetId,
    queryFn: async () => {
      const { data } = await supabase.from("products").select("id, title, images, variants").eq("store_id", targetId!).limit(200);
      return data ?? [];
    },
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      if (!sourceId || !targetId) throw new Error("Selecione lojas antes");
      const ids = Array.from(new Set([sourceId, targetId]));
      for (const id of ids) {
        const { jobId } = await createJob({ data: { storeId: id } });
        await runJob({ data: { jobId } });
      }
    },
    onSuccess: async () => {
      toast.success("Produtos sincronizados");
      setPairs([]);
      await Promise.all([refetchSource(), refetchTarget()]);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const [unifySku, setUnifySku] = useState(true);
  const cloneMutation = useMutation({
    mutationFn: async () => {
      if (!sourceId || !targetId) throw new Error("Selecione lojas antes");
      return cloneFn({ data: { sourceStoreId: sourceId, targetStoreId: targetId, unifySku } });
    },
    onSuccess: async (res) => {
      toast.success(`${res.created}/${res.total} produtos clonados na checkout`);
      if (res.errors.length) toast.error(`${res.errors.length} falhas — verifique nos logs`);
      // Re-sincroniza a checkout para puxar os novos IDs/SKUs
      const { jobId } = await createJob({ data: { storeId: targetId! } });
      await runJob({ data: { jobId } });
      setPairs([]);
      await refetchTarget();
      // Dispara sugestão de match por IA automaticamente
      setMode("ai");
      aiMutation.mutate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const [pairs, setPairs] = useState<Array<{ source: string; target: string | null; confidence?: number }>>([]);
  useEffect(() => {
    if (source && pairs.length === 0) {
      setPairs(source.map((s, i) => ({ source: s.id, target: target?.[i]?.id ?? null })));
    }
  }, [source, target]);

  const aiMutation = useMutation({
    mutationFn: async () => {
      if (!sourceId || !targetId) throw new Error("Selecione lojas antes");
      return aiSuggest({ data: { sourceStoreId: sourceId, targetStoreId: targetId } });
    },
    onSuccess: (res) => {
      const map = new Map(res.suggestions.map((s) => [s.source_product_id, s]));
      setPairs(source!.map((s) => {
        const sug = map.get(s.id);
        return { source: s.id, target: sug?.target_product_id ?? null, confidence: sug?.confidence };
      }));
      toast.success(`${res.suggestions.length} correspondências sugeridas`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const unifyMutation = useMutation({
    mutationFn: async () => {
      if (!sourceId || !targetId) throw new Error("Selecione lojas antes");
      const matchedPairs = pairs
        .filter((p) => p.target)
        .map((p) => ({ source: p.source, target: p.target as string }));
      if (!matchedPairs.length) throw new Error("Nenhum par mapeado para unificar SKUs");
      return unifyFn({ data: { sourceStoreId: sourceId, targetStoreId: targetId, pairs: matchedPairs } });
    },
    onSuccess: async (res) => {
      toast.success(`${res.updated} variantes da checkout receberam o SKU da vitrine`);
      if (res.errors.length) toast.error(`${res.errors.length} falhas na propagação — verifique nos logs`);
      // Re-sync target so the local DB reflects new SKUs and SKU-matching can find them
      const { jobId } = await createJob({ data: { storeId: targetId! } });
      await runJob({ data: { jobId } });
      await refetchTarget();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Picker per row
  function setRowTarget(idx: number, productId: string) {
    const next = [...pairs];
    next[idx] = { ...next[idx], target: productId, confidence: undefined };
    setPairs(next);
  }

  // Auto-match by SKU once both sides are loaded
  useEffect(() => {
    if (!source?.length || !target?.length) return;
    setPairs((prev) => {
      if (!prev.length) return prev;
      const targetBySku = new Map<string, string>();
      for (const t of target) {
        const sku = firstSku(t);
        if (sku) targetBySku.set(sku.toLowerCase(), t.id);
      }
      let touched = false;
      const next = prev.map((p) => {
        if (p.target) return p;
        const src = source.find((s) => s.id === p.source);
        const sku = src ? firstSku(src) : null;
        if (!sku) return p;
        const t = targetBySku.get(sku.toLowerCase());
        if (!t) return p;
        touched = true;
        return { ...p, target: t, confidence: 100 };
      });
      return touched ? next : prev;
    });
  }, [source, target]);

  if (!sourceId || !targetId) {
    return <p className="text-sm text-muted-foreground">Volte aos passos anteriores e selecione lojas com produtos sincronizados.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Sincronizar produtos</h2>
          <p className="text-sm text-muted-foreground">
            Match automático por <strong>SKU</strong> quando disponível. Use o seletor à direita para buscar e ajustar manualmente.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {draft.checkout_stores.length > 1 && (
            <Select
              value={targetId}
              onValueChange={(v) => { setTargetId(v); setPairs([]); }}
            >
              <SelectTrigger className="h-8 w-56">
                <SelectValue placeholder="Selecione a checkout" />
              </SelectTrigger>
              <SelectContent>
                {(checkoutStores ?? []).map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.display_name ?? s.shopify_domain}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => cloneMutation.mutate()}
            disabled={cloneMutation.isPending || !(source?.length)}
            className="h-8"
          >
            <Copy className="h-3.5 w-3.5 mr-1.5" />
            {cloneMutation.isPending ? "Clonando…" : "Clonar Vitrine → Checkout"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => unifyMutation.mutate()}
            disabled={unifyMutation.isPending || !pairs.some((p) => p.target)}
            className="h-8"
            title="Copia o SKU da Vitrine para o produto correspondente na Checkout"
          >
            <Zap className="h-3.5 w-3.5 mr-1.5" />
            {unifyMutation.isPending ? "Propagando…" : "Propagar SKUs Vitrine → Checkout"}
          </Button>
        <div className="flex items-center gap-2 rounded-lg border bg-muted/30 p-1">
          <button
            onClick={() => setMode("manual")}
            className={`rounded-md px-3 py-1 text-xs font-medium transition ${mode === "manual" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
          >Manual</button>
          <button
            onClick={() => { setMode("ai"); aiMutation.mutate(); }}
            className={`flex items-center gap-1 rounded-md px-3 py-1 text-xs font-medium transition ${mode === "ai" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
          >
            <Sparkles className="h-3 w-3" /> Sugestão por Match
          </button>
        </div>
        </div>
      </div>

      {aiMutation.isPending && <p className="text-xs text-muted-foreground">Analisando com IA…</p>}

      {/* Aviso de camuflagem fica visível sempre que houver produtos clonados/mapeados na checkout */}
      {mode === "ai" && (target?.length ?? 0) > 0 && (
        <div className="flex items-start gap-2 rounded-md border border-yellow-500/30 bg-yellow-500/5 px-3 py-2">
          <AlertTriangle className="h-3.5 w-3.5 text-yellow-500 mt-0.5 shrink-0" />
          <p className="text-[11px] text-yellow-200/90">
            Lembre de <strong>camuflar os produtos da checkout</strong> (título, imagens ou descrição ligeiramente diferentes) para evitar duplicidade aos olhos da Shopify.
          </p>
        </div>
      )}

      {/* Vitrine tem produtos, mas a checkout não → oferecer clonagem */}
      {(source?.length ?? 0) > 0 && (target?.length ?? 0) === 0 && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3">
          <div className="flex items-start gap-2">
            <Copy className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <div className="space-y-1">
              <p className="text-sm font-semibold">Sua loja Checkout está vazia</p>
              <p className="text-xs text-muted-foreground">
                Posso clonar os {source?.length} produtos da Vitrine para a Checkout agora. Eles serão criados como rascunho e prontos para mapeamento.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border/60 bg-background/40 px-3 py-2">
            <div>
              <Label className="text-xs font-medium">Criar SKUs iguais aos da vitrine</Label>
              <p className="text-[11px] text-muted-foreground">Facilita futuras atualizações em massa e o upload reverso.</p>
            </div>
            <Switch checked={unifySku} onCheckedChange={setUnifySku} />
          </div>

          <div className="flex items-start gap-2 rounded-md border border-yellow-500/30 bg-yellow-500/5 px-3 py-2">
            <AlertTriangle className="h-3.5 w-3.5 text-yellow-500 mt-0.5 shrink-0" />
            <p className="text-[11px] text-yellow-200/90">
              Após a sincronização, lembre de <strong>camuflar os produtos clonados</strong> na checkout (alterar título, imagens ou descrição ligeiramente) para evitar duplicidade aos olhos da Shopify.
            </p>
          </div>

          <Button onClick={() => cloneMutation.mutate()} disabled={cloneMutation.isPending} className="w-full">
            <Copy className="h-4 w-4 mr-2" />
            {cloneMutation.isPending ? "Clonando produtos…" : "Clonar Vitrine → Checkout"}
          </Button>
        </div>
      )}

      <div className="relative space-y-2">
        {pairs.map((p, i) => {
          const src = source?.find((s) => s.id === p.source);
          const tgt = target?.find((t) => t.id === p.target);
          const matched = !!tgt;
          const srcSku = src ? firstSku(src) : null;
          const tgtSku = tgt ? firstSku(tgt) : null;
          return (
            <div
              key={i}
              className={`grid grid-cols-[1fr_120px_1fr] items-center gap-3 rounded-md p-1.5 transition-all ${
                matched ? "bg-primary/[0.04]" : ""
              }`}
            >
              {/* SOURCE */}
              <div className={`flex items-center gap-2 rounded-md border p-2 text-sm transition-all ${
                matched ? "border-primary/40 shadow-[0_0_0_1px_color-mix(in_oklab,var(--color-primary)_25%,transparent),0_8px_24px_-12px_color-mix(in_oklab,var(--color-primary)_60%,transparent)]" : "border-border bg-background"
              }`}>
                {Array.isArray(src?.images) && typeof src.images[0] === "string" ? (
                  <img src={src.images[0] as string} alt={src.title} className="h-10 w-10 shrink-0 rounded-sm object-cover ring-1 ring-border" loading="lazy" />
                ) : (
                  <div className="h-10 w-10 shrink-0 rounded-sm bg-muted" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{src?.title}</div>
                  {srcSku && <div className="truncate text-[10px] text-muted-foreground font-mono">SKU: {srcSku}</div>}
                </div>
              </div>

              {/* ENERGY CONNECTOR */}
              <EnergyBeam matched={matched} confidence={p.confidence} index={i} />

              {/* TARGET */}
              <div
                className={`group flex items-center gap-2 rounded-md border p-1.5 text-sm transition-all ${
                  matched
                    ? "border-primary/50 bg-primary/[0.06] shadow-[0_0_0_1px_color-mix(in_oklab,var(--color-primary)_25%,transparent),0_8px_24px_-12px_color-mix(in_oklab,var(--color-primary)_60%,transparent)]"
                    : "border-dashed border-muted-foreground/40"
                }`}
              >
                {Array.isArray(tgt?.images) && typeof tgt.images[0] === "string" ? (
                  <img src={tgt.images[0] as string} alt={tgt.title} className="h-10 w-10 shrink-0 rounded-sm object-cover ring-1 ring-primary/40" loading="lazy" />
                ) : (
                  <div className="h-10 w-10 shrink-0 rounded-sm bg-muted/60 border border-dashed border-muted-foreground/30" />
                )}
                <ProductPicker
                  products={target ?? []}
                  value={p.target}
                  onChange={(id) => setRowTarget(i, id)}
                  selected={tgt}
                  selectedSku={tgtSku}
                />
                {p.confidence != null && (
                  <Badge variant="secondary" className="text-[10px] bg-primary/15 text-primary border-0">
                    {Math.round(p.confidence)}%
                  </Badge>
                )}
              </div>
            </div>
          );
        })}
        {!pairs.length && (
          <div className="flex flex-col items-start gap-3 rounded-lg border border-dashed border-border/60 p-6">
            <p className="text-sm text-muted-foreground">Nenhum produto sincronizado nessas lojas ainda.</p>
            <Button onClick={() => syncMutation.mutate()} disabled={syncMutation.isPending}>
              {syncMutation.isPending ? "Sincronizando…" : "Sincronizar produtos agora"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------- Energy beam connector ---------------- */
function EnergyBeam({ matched, confidence, index }: { matched: boolean; confidence?: number; index: number }) {
  const id = `eb-${index}`;
  const strong = matched && (confidence == null || confidence >= 70);
  // Fluid sine-wave path between left/right anchors
  const path = "M 4 24 C 30 4, 80 44, 116 24";
  return (
    <div className="relative h-12 w-full">
      <svg viewBox="0 0 120 48" className="absolute inset-0 h-full w-full overflow-visible" aria-hidden>
        <defs>
          <linearGradient id={`${id}-grad`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0" />
            <stop offset="50%" stopColor="var(--color-primary)" stopOpacity="1" />
            <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
          </linearGradient>
          <filter id={`${id}-glow`} x="-30%" y="-50%" width="160%" height="200%">
            <feGaussianBlur stdDeviation="2.5" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* base wire */}
        <path
          d={path}
          fill="none"
          stroke={matched ? "color-mix(in oklab, var(--color-primary) 35%, transparent)" : "var(--color-border)"}
          strokeWidth={matched ? 1.5 : 1}
          strokeDasharray={matched ? "" : "3 4"}
          strokeLinecap="round"
        />

        {matched && (
          <>
            {/* outer glow halo */}
            <path
              d={path}
              fill="none"
              stroke="var(--color-primary)"
              strokeOpacity="0.35"
              strokeWidth="6"
              strokeLinecap="round"
              filter={`url(#${id}-glow)`}
            >
              <animate attributeName="stroke-opacity" values="0.15;0.45;0.15" dur="2.4s" repeatCount="indefinite" />
            </path>

            {/* travelling energy segment */}
            <path
              d={path}
              fill="none"
              stroke={`url(#${id}-grad)`}
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="22 220"
              filter={`url(#${id}-glow)`}
            >
              <animate attributeName="stroke-dashoffset" from="0" to="-242" dur="1.8s" repeatCount="indefinite" />
            </path>

            {/* secondary spark, offset */}
            <path
              d={path}
              fill="none"
              stroke={`url(#${id}-grad)`}
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeDasharray="10 240"
              opacity="0.7"
            >
              <animate attributeName="stroke-dashoffset" from="-120" to="-362" dur="1.8s" repeatCount="indefinite" />
            </path>
          </>
        )}

        {/* anchor nodes */}
        <circle cx="4" cy="24" r={matched ? 3 : 2.2}
                fill={matched ? "var(--color-primary)" : "var(--color-muted-foreground)"}
                opacity={matched ? 1 : 0.5}
                filter={matched ? `url(#${id}-glow)` : undefined} />
        <circle cx="116" cy="24" r={matched ? 3 : 2.2}
                fill={matched ? "var(--color-primary)" : "var(--color-muted-foreground)"}
                opacity={matched ? 1 : 0.5}
                filter={matched ? `url(#${id}-glow)` : undefined} />
      </svg>

      {matched && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 320, damping: 18 }}
          className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold ring-2 ring-background shadow-[0_0_12px_var(--color-primary)] ${
            strong ? "bg-primary text-primary-foreground" : "bg-amber-500 text-black"
          }`}
        >
          {confidence != null ? (
            <span className="leading-none">{Math.round(confidence)}%</span>
          ) : (
            <Check className="h-2.5 w-2.5" />
          )}
        </motion.div>
      )}
    </div>
  );
}

/* ---------------- Step 5: Camuflagem (skippable) ---------------- */
type CamSettings = {
  enabled: boolean; zoom: number; blur: number; brightness: number; saturation: number;
  hue_shift: number; flip_horizontal: boolean; watermark_text: string | null;
  apply_to_titles: boolean; title_suffix: string | null;
  zoom_origin_x: number; zoom_origin_y: number;
  applied_product_ids: string[];
};
const CAM_DEFAULTS: CamSettings = {
  enabled: false, zoom: 1.4, blur: 0, brightness: 1, saturation: 1,
  hue_shift: 0, flip_horizontal: false, watermark_text: null,
  apply_to_titles: false, title_suffix: null,
  zoom_origin_x: 0.5, zoom_origin_y: 0.5, applied_product_ids: [],
};

type VitrineProduct = { id: string; title: string; images: unknown };

function StepCamouflage({ draft, onSkip }: { draft: Draft; onSkip: () => void }) {
  const storeId = draft.vitrine_store_id;

  const { data: store } = useQuery({
    queryKey: ["cam-vitrine", storeId],
    enabled: !!storeId,
    queryFn: async () => {
      const { data } = await supabase.from("stores").select("id, display_name, shopify_domain").eq("id", storeId!).maybeSingle();
      return data;
    },
  });

  const { data: products } = useQuery({
    queryKey: ["cam-vitrine-products", storeId],
    enabled: !!storeId,
    queryFn: async () => {
      const { data } = await supabase
        .from("products").select("id, title, images")
        .eq("store_id", storeId!).order("title").limit(500);
      return (data ?? []) as VitrineProduct[];
    },
  });

  const { data: existing } = useQuery({
    queryKey: ["cam-existing", storeId],
    enabled: !!storeId,
    queryFn: async () => {
      const { data } = await supabase.from("store_camouflage_settings").select("*").eq("store_id", storeId!).maybeSingle();
      return data;
    },
  });

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sampleId, setSampleId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  // Hydrate selection from existing record once products load
  useEffect(() => {
    if (!existing || !products) return;
    const prev = ((existing as { applied_product_ids?: string[] }).applied_product_ids) ?? [];
    if (prev.length) setSelected(new Set(prev));
  }, [existing, products]);

  const allChecked = !!products?.length && selected.size === products.length;
  function toggleAll() {
    if (allChecked) setSelected(new Set());
    else setSelected(new Set((products ?? []).map((p) => p.id)));
  }
  function toggleOne(id: string) {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  }

  const sample = useMemo(() => {
    const id = sampleId ?? Array.from(selected)[0] ?? products?.[0]?.id ?? null;
    return products?.find((p) => p.id === id) ?? null;
  }, [products, sampleId, selected]);

  if (!storeId) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold flex items-center gap-2"><Wand2 className="h-5 w-5 text-primary" /> Camuflar produtos da Vitrine</h2>
        <p className="text-sm text-muted-foreground">Selecione uma loja vitrine nas etapas anteriores para configurar a camuflagem.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="max-w-2xl">
          <h2 className="text-xl font-bold flex items-center gap-2"><Wand2 className="h-5 w-5 text-primary" /> Camuflar produtos da Vitrine</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Selecione os produtos da <strong>{store?.display_name ?? store?.shopify_domain ?? "vitrine"}</strong> que receberão zoom, desfoque e ajustes visuais. Você escolhe um produto de amostra, configura e aplica a todos os selecionados.
          </p>
        </div>
        <Button variant="outline" onClick={onSkip} className="shrink-0">Pular esta etapa →</Button>
      </div>

      <div className="rounded-xl border">
        <div className="flex items-center justify-between gap-3 border-b p-3">
          <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
            <input type="checkbox" checked={allChecked} onChange={toggleAll} className="h-4 w-4 accent-primary" />
            Selecionar todos ({products?.length ?? 0})
          </label>
          <div className="text-xs text-muted-foreground">{selected.size} selecionados</div>
          <Button size="sm" disabled={!selected.size} onClick={() => setEditing(true)}>
            <Wand2 className="h-3.5 w-3.5 mr-1.5" /> Configurar camuflagem
          </Button>
        </div>
        <div className="max-h-[360px] overflow-y-auto p-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {(products ?? []).map((p) => {
            const checked = selected.has(p.id);
            const img = Array.isArray(p.images) && typeof (p.images as unknown[])[0] === "string"
              ? (p.images as string[])[0] : null;
            const isSample = sample?.id === p.id;
            return (
              <div key={p.id}
                className={`flex items-center gap-2 rounded-lg border p-2 transition-all ${
                  checked ? "border-primary/40 bg-primary/[0.04]" : "border-border"
                }`}>
                <input type="checkbox" checked={checked} onChange={() => toggleOne(p.id)} className="h-4 w-4 accent-primary shrink-0" />
                <div className="h-10 w-10 shrink-0 overflow-hidden rounded bg-muted/40">
                  {img && <img src={img} alt="" className="h-full w-full object-cover" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-medium truncate">{p.title}</div>
                  <button onClick={() => setSampleId(p.id)} className={`text-[10px] ${isSample ? "text-primary font-semibold" : "text-muted-foreground hover:text-foreground"}`}>
                    {isSample ? "● Amostra" : "Usar como amostra"}
                  </button>
                </div>
              </div>
            );
          })}
          {!products?.length && <div className="text-xs text-muted-foreground p-4">Nenhum produto sincronizado nesta vitrine.</div>}
        </div>
      </div>

      <CamouflageDialog
        open={editing}
        storeId={storeId}
        store={store ?? null}
        sample={sample}
        selectedIds={Array.from(selected)}
        initial={(existing as CamSettings | undefined) ?? undefined}
        onClose={() => setEditing(false)}
      />
    </div>
  );
}

function CamouflageDialog({
  open, storeId, store, sample, selectedIds, initial, onClose,
}: {
  open: boolean;
  storeId: string;
  store: { id: string; display_name: string | null; shopify_domain: string } | null;
  sample: VitrineProduct | null;
  selectedIds: string[];
  initial?: CamSettings;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [s, setS] = useState<CamSettings>({ ...CAM_DEFAULTS, ...(initial ?? {}) });
  useEffect(() => { if (open) setS({ ...CAM_DEFAULTS, ...(initial ?? {}) }); }, [initial, open]);

  const sampleImage = Array.isArray(sample?.images) && typeof (sample!.images as unknown[])[0] === "string"
    ? ((sample!.images as string[])[0]) : null;

  const filter = `blur(${s.blur}px) brightness(${s.brightness}) saturate(${s.saturation}) hue-rotate(${s.hue_shift}deg)`;
  const transform = `scale(${s.zoom}) ${s.flip_horizontal ? "scaleX(-1)" : ""}`;
  const originPct = `${(s.zoom_origin_x * 100).toFixed(0)}% ${(s.zoom_origin_y * 100).toFixed(0)}%`;

  async function save() {
    const { error } = await supabase.from("store_camouflage_settings").upsert(
      {
        store_id: storeId,
        ...s,
        watermark_text: s.watermark_text || null,
        title_suffix: s.title_suffix || null,
        applied_product_ids: selectedIds,
      },
      { onConflict: "store_id" },
    );
    if (error) return toast.error(error.message);
    toast.success(`Camuflagem aplicada a ${selectedIds.length} produto(s)`);
    qc.invalidateQueries({ queryKey: ["cam-existing"] });
    onClose();
  }

  // 3x3 focal-point grid (0, 0.5, 1)
  const QUADRANTS: { x: number; y: number }[] = [
    { x: 0, y: 0 }, { x: 0.5, y: 0 }, { x: 1, y: 0 },
    { x: 0, y: 0.5 }, { x: 0.5, y: 0.5 }, { x: 1, y: 0.5 },
    { x: 0, y: 1 }, { x: 0.5, y: 1 }, { x: 1, y: 1 },
  ];

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Camuflar {selectedIds.length} produto(s) — {store?.display_name ?? store?.shopify_domain}</DialogTitle>
          <DialogDescription>Configure no produto de amostra. As mesmas regras serão aplicadas a todos os selecionados.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-5 md:grid-cols-[1fr_320px]">
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-md border p-3">
              <Label className="text-sm">Ativar camuflagem</Label>
              <Switch checked={s.enabled} onCheckedChange={(v) => setS((p) => ({ ...p, enabled: v }))} />
            </div>
            <CamRow label="Zoom" v={s.zoom} min={1} max={3} step={0.05} suffix="x" onChange={(v) => setS((p) => ({ ...p, zoom: v }))} />
            <div className="space-y-2">
              <Label className="text-xs">Posição do zoom (9 quadrantes)</Label>
              <div className="grid grid-cols-3 gap-1 w-32">
                {QUADRANTS.map((q) => {
                  const active = Math.abs(s.zoom_origin_x - q.x) < 0.01 && Math.abs(s.zoom_origin_y - q.y) < 0.01;
                  return (
                    <button key={`${q.x}-${q.y}`}
                      onClick={() => setS((p) => ({ ...p, zoom_origin_x: q.x, zoom_origin_y: q.y }))}
                      className={`aspect-square rounded border transition ${active ? "bg-primary border-primary" : "bg-muted/40 border-border hover:bg-muted"}`}
                      aria-label={`Quadrante ${q.x},${q.y}`} />
                  );
                })}
              </div>
            </div>
            <CamRow label="Desfoque" v={s.blur} min={0} max={8} step={0.1} suffix="px" onChange={(v) => setS((p) => ({ ...p, blur: v }))} />
            <CamRow label="Brilho" v={s.brightness} min={0.5} max={1.5} step={0.01} onChange={(v) => setS((p) => ({ ...p, brightness: v }))} />
            <CamRow label="Saturação" v={s.saturation} min={0} max={2} step={0.01} onChange={(v) => setS((p) => ({ ...p, saturation: v }))} />
            <CamRow label="Matiz" v={s.hue_shift} min={-180} max={180} step={1} suffix="°" onChange={(v) => setS((p) => ({ ...p, hue_shift: v }))} />
            <div className="flex items-center justify-between rounded-md border p-3">
              <Label className="text-sm">Espelhar horizontalmente</Label>
              <Switch checked={s.flip_horizontal} onCheckedChange={(v) => setS((p) => ({ ...p, flip_horizontal: v }))} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Sufixo do título (ex: "— Edição Especial")</Label>
              <Input value={s.title_suffix ?? ""} onChange={(e) => setS((p) => ({ ...p, title_suffix: e.target.value }))} placeholder="opcional" />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Pré-visualização — {sample?.title ?? "amostra"}</Label>
            <div className="aspect-square w-full rounded-lg border bg-muted/30 overflow-hidden grid place-items-center">
              {sampleImage ? (
                <img src={sampleImage} alt="" style={{ filter, transform, transformOrigin: originPct }} className="h-full w-full object-cover transition-all" />
              ) : (
                <div className="text-xs text-muted-foreground">Sem produto de amostra</div>
              )}
            </div>
            {sample?.title && (
              <div className="text-xs text-muted-foreground truncate">{sample.title}{s.title_suffix ? ` ${s.title_suffix}` : ""}</div>
            )}
            <div className="text-[11px] text-muted-foreground">Será aplicada a <strong className="text-foreground">{selectedIds.length}</strong> produto(s) selecionado(s).</div>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={save} disabled={!selectedIds.length}>Aplicar a {selectedIds.length} produto(s)</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CamRow({ label, v, min, max, step, suffix, onChange }: {
  label: string; v: number; min: number; max: number; step: number; suffix?: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <Label>{label}</Label>
        <span className="font-mono text-muted-foreground">{v.toFixed(step < 1 ? 2 : 0)}{suffix ?? ""}</span>
      </div>
      <Slider min={min} max={max} step={step} value={[v]} onValueChange={(a) => onChange(a[0])} />
    </div>
  );
}

/* ---------------- Step 6: Cart ---------------- */
function StepCart({ draft, setDraft }: { draft: Draft; setDraft: React.Dispatch<React.SetStateAction<Draft>> }) {
  const [layout, setLayout] = useState<CartLayout>(
    () => CART_TEMPLATES.find((t) => t.id === draft.cart_template_id)?.layout ?? "drawer",
  );
  const [previewId, setPreviewId] = useState<string | null>(null);

  const filtered = CART_TEMPLATES.filter((t) => t.layout === layout);

  // Saved carts (already customised by the user in Cart Builder)
  const { data: savedCarts } = useQuery({
    queryKey: ["wiz-saved-carts", draft.workspace_id],
    queryFn: async () => {
      const { data } = await supabase
        .from("cart_drawer_configs")
        .select("id, name, layout, store_id, updated_at, published_at, stores(display_name, shopify_domain)")
        .eq("workspace_id", draft.workspace_id)
        .order("updated_at", { ascending: false })
        .limit(20);
      return data ?? [];
    },
  });

  const previewTpl = CART_TEMPLATES.find((t) => t.id === previewId) ?? null;

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-bold">Modelo de carrinho</h2>
          <p className="text-sm text-muted-foreground">Escolha o layout e o modelo. Use <strong>Pré-visualizar</strong> para ver antes de decidir.</p>
        </div>
        <div className="flex items-center gap-1 rounded-lg border bg-muted/30 p-1">
          <button onClick={() => setLayout("drawer")}
            className={`rounded-md px-3 py-1 text-xs font-medium transition ${layout === "drawer" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
            Drawer lateral
          </button>
          <button onClick={() => setLayout("page")}
            className={`rounded-md px-3 py-1 text-xs font-medium transition ${layout === "page" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
            Página
          </button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {filtered.map((t) => {
          const sel = draft.cart_template_id === t.id;
          return (
            <div
              key={t.id}
              className={`relative overflow-hidden rounded-xl border p-4 transition-all ${
                sel ? "border-primary shadow-[0_0_24px_color-mix(in_oklab,var(--color-primary)_30%,transparent)]" : "border-border"
              }`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${t.accent} opacity-60 pointer-events-none`} />
              <div className="relative space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">{t.name}</div>
                    <p className="text-xs text-muted-foreground">{t.desc}</p>
                  </div>
                  {sel && <Check className="h-5 w-5 text-primary" />}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setPreviewId(t.id)} className="flex-1">
                    <Eye className="h-3.5 w-3.5 mr-1.5" /> Pré-visualizar
                  </Button>
                  <Button size="sm" variant={sel ? "secondary" : "default"} onClick={() => setDraft({ ...draft, cart_template_id: t.id })} className="flex-1">
                    {sel ? "Selecionado" : "Escolher"}
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {(savedCarts?.length ?? 0) > 0 && (
        <div className="space-y-2 pt-2">
          <h3 className="text-sm font-semibold">Carrinhos já personalizados</h3>
          <p className="text-xs text-muted-foreground">Configurações criadas no Cart Builder para esta workspace.</p>
          <div className="grid gap-2 md:grid-cols-2">
            {(savedCarts ?? []).filter((c: any) => c.layout === layout || !c.layout).map((c: any) => {
              const id = `saved:${c.id}`;
              const sel = draft.cart_template_id === id;
              return (
                <div key={c.id} className={`rounded-lg border p-3 flex items-center justify-between gap-2 transition-all ${
                  sel ? "border-primary bg-primary/[0.04]" : "border-border"
                }`}>
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">
                      {c.name ?? c.stores?.display_name ?? c.stores?.shopify_domain ?? "Carrinho salvo"}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {c.layout === "page" ? "Página" : "Drawer"} • {c.published_at ? "Publicado" : "Rascunho"} • {new Date(c.updated_at).toLocaleDateString("pt-BR")}
                      {c.stores?.display_name ? ` • ${c.stores.display_name}` : ""}
                    </div>
                  </div>
                  <Button size="sm" variant={sel ? "secondary" : "outline"} onClick={() => setDraft({ ...draft, cart_template_id: id })}>
                    {sel ? <Check className="h-3.5 w-3.5" /> : "Usar"}
                  </Button>
                </div>
              );
            })}
          </div>
          <Link to="/dashboard/cart" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
            Abrir Cart Builder <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      )}

      <Dialog open={!!previewTpl} onOpenChange={(o) => !o && setPreviewId(null)}>
        <DialogContent className="max-w-[480px] p-0 overflow-hidden">
          <DialogHeader className="px-5 pt-5">
            <DialogTitle>{previewTpl?.name}</DialogTitle>
            <DialogDescription>{previewTpl?.desc} — layout {previewTpl?.layout === "drawer" ? "Drawer" : "Página"}</DialogDescription>
          </DialogHeader>
          <div className="px-5 pb-5">
            {previewTpl?.layout === "drawer" ? (
              <div className="h-[560px] w-full">
                <CartDrawerPreview config={{ ...defaultCartDrawerConfig, ...(previewTpl?.preview ?? {}) } as CartDrawerConfig} language="pt-BR" />
              </div>
            ) : (
              <PageCartMock name={previewTpl?.name ?? ""} />
            )}
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setPreviewId(null)}>Fechar</Button>
              <Button onClick={() => { if (previewTpl) { setDraft({ ...draft, cart_template_id: previewTpl.id }); setPreviewId(null); } }}>
                Escolher este modelo
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PageCartMock({ name }: { name: string }) {
  return (
    <div className="rounded-lg border bg-white text-zinc-900 p-5 space-y-3">
      <div className="text-xs uppercase tracking-wide text-zinc-500">Página de carrinho · {name}</div>
      <div className="text-lg font-semibold">Seu carrinho</div>
      {[1, 2].map((i) => (
        <div key={i} className="flex items-center gap-3 border-t pt-3">
          <div className="h-14 w-14 rounded bg-zinc-200" />
          <div className="flex-1">
            <div className="text-sm font-medium">Produto {i}</div>
            <div className="text-xs text-zinc-500">Qtd 1</div>
          </div>
          <div className="text-sm font-semibold">R$ 99,00</div>
        </div>
      ))}
      <div className="border-t pt-3 flex items-center justify-between">
        <div className="text-sm">Subtotal</div>
        <div className="text-base font-bold">R$ 198,00</div>
      </div>
      <button className="w-full rounded-md bg-zinc-900 text-white py-2.5 text-sm font-semibold">Finalizar compra</button>
    </div>
  );
}

/* ---------------- Step 6: Tracking ---------------- */
const TRACKING_PLATFORMS = [
  { id: "meta", label: "Meta CAPI" },
  { id: "tiktok", label: "TikTok" },
  { id: "ga4", label: "GA4" },
  { id: "google_ads", label: "Google Ads" },
] as const;

function StepTracking({ draft, onSkip }: { draft: Draft; onSkip: () => void }) {
  const listPixels = useServerFn(listStorePixels);
  const storeIds = useMemo(() => {
    const ids = new Set<string>();
    if (draft.vitrine_store_id) ids.add(draft.vitrine_store_id);
    draft.checkout_stores.forEach((c) => ids.add(c.store_id));
    return Array.from(ids);
  }, [draft.vitrine_store_id, draft.checkout_stores]);

  const { data: storesData } = useQuery({
    queryKey: ["wizard-tracking-stores", storeIds.join(",")],
    queryFn: async () => {
      if (!storeIds.length) return [];
      const { data } = await supabase.from("stores").select("id, shopify_domain").in("id", storeIds);
      return data ?? [];
    },
    enabled: storeIds.length > 0,
  });

  const { data: pixelsData } = useQuery({
    queryKey: ["wizard-tracking-pixels", storeIds.join(",")],
    queryFn: async () => {
      const results = await Promise.all(storeIds.map((id) => listPixels({ data: { store_id: id } })));
      const map: Record<string, Set<string>> = {};
      storeIds.forEach((id, i) => {
        map[id] = new Set(results[i].pixels.filter((p) => p.enabled).map((p) => p.platform));
      });
      return map;
    },
    enabled: storeIds.length > 0,
  });

  const totalConfigured = pixelsData
    ? Object.values(pixelsData).reduce((acc, set) => acc + set.size, 0)
    : 0;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-lg font-semibold">Tracking & Pixels</h2>
        <p className="text-sm text-muted-foreground">
          Conecte Meta, TikTok, GA4 e Google Ads para receber atribuição server-side desde o primeiro pedido.
          Opcional, mas <span className="text-foreground font-medium">altamente recomendado</span> — sem isso o ML das plataformas perde dados de conversão.
        </p>
      </div>

      <div className="space-y-2">
        {(storesData ?? []).map((s) => {
          const configured = pixelsData?.[s.id] ?? new Set<string>();
          const isVitrine = s.id === draft.vitrine_store_id;
          return (
            <div key={s.id} className="flex flex-col gap-3 rounded-lg border border-white/[0.06] bg-white/[0.02] p-4 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="truncate font-medium">{s.shopify_domain}</span>
                  <Badge variant={isVitrine ? "default" : "secondary"} className="text-[10px]">
                    {isVitrine ? "Vitrine" : "Checkout"}
                  </Badge>
                </div>
                <div className="truncate text-xs text-muted-foreground">{s.id.slice(0, 8)}</div>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {TRACKING_PLATFORMS.map((p) => {
                  const ok = configured.has(p.id);
                  return (
                    <Badge
                      key={p.id}
                      variant="outline"
                      className={ok
                        ? "border-primary/40 bg-primary/10 text-primary"
                        : "border-white/10 bg-transparent text-muted-foreground"}
                    >
                      {ok && <Check className="mr-1 size-3" />}
                      {p.label}
                    </Badge>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col items-start justify-between gap-3 rounded-lg border border-primary/20 bg-primary/[0.04] p-4 md:flex-row md:items-center">
        <div className="text-sm">
          <div className="font-medium">
            {totalConfigured > 0
              ? `${totalConfigured} pixel(s) configurado(s) nas lojas dessa operação.`
              : "Nenhum pixel configurado ainda."}
          </div>
          <div className="text-xs text-muted-foreground">
            Configure em detalhes na aba Tracking — credenciais, eventos de teste e webhook do Shopify.
          </div>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to="/dashboard/tracking">Configurar pixels</Link>
          </Button>
          <Button variant="ghost" size="sm" onClick={onSkip}>
            Pular por enquanto
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Step 7: Activate ---------------- */
function StepActivate({ draft, onActivate }: { draft: Draft; onActivate: () => Promise<void> }) {
  const [activating, setActivating] = useState(false);
  const [done, setDone] = useState(false);
  const modeLabel = { direct: "Direta", warmup: "Aquecimento", smart_advance: "SmartAdvance" }[draft.mode];
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-6 text-center">
      <div>
        <h2 className="text-2xl font-bold">Tudo pronto, {draft.name || "operação"}!</h2>
        <p className="text-sm text-muted-foreground">
          Modo <span className="font-medium text-foreground">{modeLabel}</span> com {draft.checkout_stores.length} loja(s) checkout.
        </p>
      </div>
      {!done ? (
        <Button
          size="lg"
          className="relative h-14 px-8 text-base"
          disabled={activating}
          onClick={async () => {
            setActivating(true);
            try { await onActivate(); setDone(true); }
            finally { setActivating(false); }
          }}
        >
          <Power className="mr-2" />
          {activating ? "Ativando…" : "Ativar operação"}
          <span className="pointer-events-none absolute inset-0 rounded-md ring-2 ring-primary/40 animate-pulse" />
        </Button>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <CheckCircle2 className="h-20 w-20 text-primary animate-scale-in" />
            <span className="absolute inset-0 animate-ping rounded-full bg-primary/30" />
          </div>
          <p className="font-medium">Sistema ativo e operando.</p>
        </div>
      )}
    </div>
  );
}