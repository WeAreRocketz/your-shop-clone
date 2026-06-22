import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Json } from "@/integrations/supabase/types";

const PlatformSchema = z.enum(["meta", "tiktok", "google_ads", "ga4"]);

const UpsertSchema = z.object({
  store_id: z.string().uuid(),
  platform: PlatformSchema,
  pixel_id: z.string().min(1).max(255),
  access_token: z.string().max(4096).nullable().optional(),
  test_event_code: z.string().max(255).nullable().optional(),
  extra: z.record(z.string(), z.unknown()).optional(),
  enabled: z.boolean().optional(),
});

export const listStorePixels = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ store_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("store_pixels")
      .select("*")
      .eq("store_id", data.store_id);
    if (error) throw new Error(error.message);
    return { pixels: rows ?? [] };
  });

export const upsertStorePixel = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => UpsertSchema.parse(d))
  .handler(async ({ data, context }) => {
    const payload = {
      store_id: data.store_id,
      platform: data.platform,
      pixel_id: data.pixel_id,
      access_token: data.access_token ?? null,
      test_event_code: data.test_event_code ?? null,
      extra: (data.extra ?? {}) as Json,
      enabled: data.enabled ?? true,
    };
    const { error } = await context.supabase
      .from("store_pixels")
      .upsert(payload, { onConflict: "store_id,platform" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteStorePixel = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("store_pixels").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listTrackingEvents = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ store_id: z.string().uuid(), limit: z.number().min(1).max(100).optional() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("tracking_events")
      .select("id, platform, event_name, status, http_status, latency_ms, error_message, created_at")
      .eq("store_id", data.store_id)
      .order("created_at", { ascending: false })
      .limit(data.limit ?? 25);
    if (error) throw new Error(error.message);
    return { events: rows ?? [] };
  });

// Sends a test event through the dispatcher and writes a tracking_events row.
export const sendTestEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ store_id: z.string().uuid(), platform: PlatformSchema }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: store } = await context.supabase
      .from("stores").select("id, workspace_id").eq("id", data.store_id).single();
    if (!store) throw new Error("Loja não encontrada");
    const { data: pixel } = await context.supabase
      .from("store_pixels").select("*").eq("store_id", data.store_id).eq("platform", data.platform).single();
    if (!pixel) throw new Error("Pixel não configurado");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { dispatchToStore } = await import("@/lib/tracking/dispatchers.server");

    const results = await dispatchToStore([pixel as never], {
      event_name: "PageView",
      event_id: `test-${Date.now()}`,
      event_time: Math.floor(Date.now() / 1000),
      event_source_url: "https://shop2shops.test/test",
      user: { user_agent: "Shop2Shops Test", ip: "127.0.0.1" },
      custom: {},
    });
    const r = results[0];
    await supabaseAdmin.from("tracking_events").insert({
      workspace_id: store.workspace_id,
      store_id: store.id,
      platform: r.platform,
      event_name: "PageView",
      event_id: `test-${Date.now()}`,
      status: r.status === "success" ? "success" : "error",
      http_status: r.http_status ?? null,
      latency_ms: r.latency_ms,
      request_payload: (r.request_payload ?? null) as Json,
      response_body: (r.response_body ?? null) as Json,
      error_message: r.error_message ?? null,
    });
    if (r.status === "success") {
      await supabaseAdmin.from("store_pixels").update({ last_event_at: new Date().toISOString(), last_error: null }).eq("id", pixel.id);
    } else {
      await supabaseAdmin.from("store_pixels").update({ last_error: r.error_message ?? "unknown" }).eq("id", pixel.id);
    }
    return {
      result: {
        platform: r.platform,
        status: r.status,
        http_status: r.http_status ?? null,
        latency_ms: r.latency_ms,
        error_message: r.error_message ?? null,
      },
    };
  });

// Generate (or rotate) the webhook secret used to verify Shopify orders/paid signatures
export const rotateWebhookSecret = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ store_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { randomSecret } = await import("@/lib/tracking/hash.server");
    const secret = randomSecret(32);
    const { error } = await context.supabase
      .from("stores").update({ webhook_secret: secret }).eq("id", data.store_id);
    if (error) throw new Error(error.message);
    return { secret };
  });

export const getStoreWebhookInfo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ store_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: store } = await context.supabase
      .from("stores").select("id, webhook_secret, shopify_domain").eq("id", data.store_id).single();
    if (!store) throw new Error("Loja não encontrada");
    return {
      has_secret: !!store.webhook_secret,
      shopify_domain: store.shopify_domain,
    };
  });