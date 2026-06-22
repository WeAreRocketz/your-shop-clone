import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import {
  listStorePixels, upsertStorePixel, sendTestEvent,
  rotateWebhookSecret, getStoreWebhookInfo,
} from "@/lib/api/store-pixels.functions";
import { CheckCircle2, AlertTriangle, Zap, Copy } from "@/components/icon";

export const Route = createFileRoute("/_authenticated/dashboard/tracking")({
  head: () => ({ meta: [{ title: "Tracking & Pixels — Shop2Shops" }] }),
  component: TrackingPage,
});

type Platform = "meta" | "tiktok" | "google_ads" | "ga4";
type Pixel = {
  id: string; store_id: string; platform: Platform;
  pixel_id: string; access_token: string | null;
  test_event_code: string | null;
  extra: Record<string, unknown>; enabled: boolean;
  last_event_at: string | null; last_error: string | null;
};

const PLATFORM_META: Record<Platform, { label: string; idLabel: string; tokenLabel: string; extraFields?: Array<{ key: string; label: string }> }> = {
  meta: { label: "Meta (Facebook/Instagram)", idLabel: "Pixel ID", tokenLabel: "Conversions API Access Token" },
  tiktok: { label: "TikTok", idLabel: "Pixel Code", tokenLabel: "Events API Access Token" },
  ga4: { label: "Google Analytics 4", idLabel: "Measurement ID (G-XXXX)", tokenLabel: "API Secret" },
  google_ads: {
    label: "Google Ads (Enhanced Conversions)",
    idLabel: "Conversion ID",
    tokenLabel: "Conversion Label",
    extraFields: [
      { key: "ga4_measurement_id", label: "GA4 Measurement ID (bridge)" },
      { key: "ga4_api_secret", label: "GA4 API Secret (bridge)" },
    ],
  },
};

function TrackingPage() {
  const vitrinesQ = useQuery({
    queryKey: ["vitrine-stores-tracking"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stores").select("id, display_name, shopify_domain, store_type")
        .eq("store_type", "vitrine").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const [selected, setSelected] = useState<string | null>(null);
  const current = selected ?? vitrinesQ.data?.[0]?.id ?? null;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex-1 p-6">
          <div className="flex items-center gap-3 mb-6">
            <SidebarTrigger />
            <div>
              <h1 className="text-2xl font-bold">Tracking & Pixels</h1>
              <p className="text-sm text-muted-foreground">
                Configure Meta CAPI, TikTok Events API, Google Ads e GA4 server-side por loja vitrine.
              </p>
            </div>
          </div>

          {(vitrinesQ.data?.length ?? 0) === 0 ? (
            <Card className="p-6 text-center text-sm text-muted-foreground">
              Nenhuma loja vitrine conectada. Conecte uma loja em "Conectar Lojas".
            </Card>
          ) : (
            <div className="grid grid-cols-[260px_1fr] gap-6">
              <div className="space-y-2">
                {vitrinesQ.data?.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSelected(s.id)}
                    className={`w-full text-left p-3 rounded border transition ${current === s.id ? "border-primary bg-primary/10" : "border-border hover:bg-muted"}`}
                  >
                    <div className="font-medium text-sm">{s.display_name ?? s.shopify_domain}</div>
                    <div className="text-xs text-muted-foreground">{s.shopify_domain}</div>
                  </button>
                ))}
              </div>
              {current && <StoreTrackingPanel storeId={current} />}
            </div>
          )}
        </main>
      </div>
    </SidebarProvider>
  );
}

function StoreTrackingPanel({ storeId }: { storeId: string }) {
  const pixelsQ = useQuery({
    queryKey: ["store-pixels", storeId],
    queryFn: () => listStorePixels({ data: { store_id: storeId } }),
  });
  const pixels = (pixelsQ.data?.pixels ?? []) as Pixel[];
  const byPlatform = new Map(pixels.map((p) => [p.platform, p]));

  return (
    <div className="space-y-4">
      <Tabs defaultValue="pixels">
        <TabsList>
          <TabsTrigger value="pixels">Pixels</TabsTrigger>
          <TabsTrigger value="webhook">Webhook Shopify</TabsTrigger>
        </TabsList>
        <TabsContent value="pixels" className="space-y-4 mt-4">
          {(["meta", "tiktok", "google_ads", "ga4"] as Platform[]).map((p) => (
            <PixelCard
              key={p}
              storeId={storeId}
              platform={p}
              pixel={byPlatform.get(p) ?? null}
            />
          ))}
        </TabsContent>
        <TabsContent value="webhook" className="mt-4">
          <WebhookCard storeId={storeId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PixelCard({ storeId, platform, pixel }: { storeId: string; platform: Platform; pixel: Pixel | null }) {
  const qc = useQueryClient();
  const meta = PLATFORM_META[platform];
  const [pixelId, setPixelId] = useState(pixel?.pixel_id ?? "");
  const [accessToken, setAccessToken] = useState(pixel?.access_token ?? "");
  const [testCode, setTestCode] = useState(pixel?.test_event_code ?? "");
  const [enabled, setEnabled] = useState(pixel?.enabled ?? true);
  const [extra, setExtra] = useState<Record<string, string>>(
    Object.fromEntries(meta.extraFields?.map((f) => [f.key, String(pixel?.extra?.[f.key] ?? "")]) ?? []),
  );

  const upsertFn = useServerFn(upsertStorePixel);
  const testFn = useServerFn(sendTestEvent);

  const saveMut = useMutation({
    mutationFn: () => upsertFn({
      data: {
        store_id: storeId, platform,
        pixel_id: pixelId,
        access_token: accessToken || null,
        test_event_code: testCode || null,
        extra,
        enabled,
      },
    }),
    onSuccess: () => {
      toast.success(`${meta.label} salvo`);
      qc.invalidateQueries({ queryKey: ["store-pixels", storeId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const testMut = useMutation({
    mutationFn: () => testFn({ data: { store_id: storeId, platform } }),
    onSuccess: (r) => {
      if (r.result.status === "success") toast.success(`Evento de teste enviado (${r.result.latency_ms}ms)`);
      else if (r.result.status === "skipped") toast.warning(`Pulado: ${r.result.error_message}`);
      else toast.error(`Erro: ${r.result.error_message}`);
      qc.invalidateQueries({ queryKey: ["store-pixels", storeId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="font-semibold flex items-center gap-2">
            {meta.label}
            {pixel?.last_event_at && !pixel.last_error && (
              <Badge variant="secondary" className="gap-1"><CheckCircle2 className="h-3 w-3" /> Ativo</Badge>
            )}
            {pixel?.last_error && (
              <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" /> Erro</Badge>
            )}
          </h3>
          {pixel?.last_error && <p className="text-xs text-destructive mt-1">{pixel.last_error}</p>}
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-xs">Ativo</Label>
          <Switch checked={enabled} onCheckedChange={setEnabled} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">{meta.idLabel}</Label>
          <Input value={pixelId} onChange={(e) => setPixelId(e.target.value)} placeholder={meta.idLabel} />
        </div>
        <div>
          <Label className="text-xs">{meta.tokenLabel}</Label>
          <Input type="password" value={accessToken ?? ""} onChange={(e) => setAccessToken(e.target.value)} />
        </div>
        {meta.extraFields?.map((f) => (
          <div key={f.key}>
            <Label className="text-xs">{f.label}</Label>
            <Input value={extra[f.key] ?? ""} onChange={(e) => setExtra({ ...extra, [f.key]: e.target.value })} />
          </div>
        ))}
        <div>
          <Label className="text-xs">Test Event Code (opcional)</Label>
          <Input value={testCode ?? ""} onChange={(e) => setTestCode(e.target.value)} placeholder="TEST12345" />
        </div>
      </div>
      <div className="flex gap-2 mt-4">
        <Button onClick={() => saveMut.mutate()} disabled={saveMut.isPending || !pixelId}>
          {saveMut.isPending ? "Salvando..." : "Salvar"}
        </Button>
        {pixel && (
          <Button variant="outline" onClick={() => testMut.mutate()} disabled={testMut.isPending} className="gap-2">
            <Zap className="h-3.5 w-3.5" />
            {testMut.isPending ? "Enviando..." : "Enviar evento de teste"}
          </Button>
        )}
      </div>
    </Card>
  );
}

function WebhookCard({ storeId }: { storeId: string }) {
  const qc = useQueryClient();
  const infoQ = useQuery({
    queryKey: ["store-webhook", storeId],
    queryFn: () => getStoreWebhookInfo({ data: { store_id: storeId } }),
  });
  const rotateFn = useServerFn(rotateWebhookSecret);
  const [newSecret, setNewSecret] = useState<string | null>(null);

  const rotateMut = useMutation({
    mutationFn: () => rotateFn({ data: { store_id: storeId } }),
    onSuccess: (r) => {
      setNewSecret(r.secret);
      qc.invalidateQueries({ queryKey: ["store-webhook", storeId] });
      toast.success("Segredo gerado");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const base = typeof window !== "undefined" ? window.location.origin : "";
  const url = `${base}/api/public/shopify-order-webhook?store_id=${storeId}`;

  return (
    <Card className="p-4 space-y-4">
      <div>
        <h3 className="font-semibold mb-1">Webhook orders/paid (Shopify)</h3>
        <p className="text-sm text-muted-foreground">
          Configure este webhook nesta <strong>loja de checkout</strong> para que o evento Purchase
          seja disparado server-side em todos os pixels da loja vitrine de origem.
        </p>
      </div>
      <div>
        <Label className="text-xs">URL do Webhook</Label>
        <div className="flex gap-2">
          <Input readOnly value={url} />
          <Button variant="outline" size="icon" onClick={() => { navigator.clipboard.writeText(url); toast.success("URL copiada"); }}>
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div>
        <Label className="text-xs">Segredo HMAC</Label>
        <div className="flex items-center gap-2">
          <Badge variant={infoQ.data?.has_secret ? "secondary" : "outline"}>
            {infoQ.data?.has_secret ? "Configurado" : "Não configurado"}
          </Badge>
          <Button size="sm" variant="outline" onClick={() => rotateMut.mutate()} disabled={rotateMut.isPending}>
            {infoQ.data?.has_secret ? "Rotacionar segredo" : "Gerar segredo"}
          </Button>
        </div>
        {newSecret && (
          <div className="mt-3 p-3 bg-muted rounded">
            <p className="text-xs text-destructive font-semibold mb-1">Copie agora — não será mostrado novamente:</p>
            <div className="flex gap-2">
              <Input readOnly value={newSecret} className="font-mono text-xs" />
              <Button variant="outline" size="icon" onClick={() => { navigator.clipboard.writeText(newSecret); toast.success("Segredo copiado"); }}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
      <div className="text-xs text-muted-foreground space-y-1">
        <p><strong>Como configurar na Shopify:</strong></p>
        <ol className="list-decimal ml-5 space-y-1">
          <li>Settings → Notifications → Webhooks → Create webhook</li>
          <li>Event: <code className="bg-muted px-1 rounded">Order payment</code></li>
          <li>Format: <code className="bg-muted px-1 rounded">JSON</code></li>
          <li>URL: cole a URL acima</li>
          <li>Webhook signing secret: cole o segredo gerado acima</li>
        </ol>
      </div>
    </Card>
  );
}