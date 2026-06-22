import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const BodySchema = z.object({
  workspace_id: z.string().uuid(),
  vitrine_store_id: z.string().uuid(),
  event_name: z.enum(["PageView", "ViewContent", "AddToCart", "InitiateCheckout"]),
  event_id: z.string().min(1).max(128),
  event_source_url: z.string().max(2048).optional(),
  attribution: z.object({
    fbp: z.string().max(255).optional(),
    fbc: z.string().max(255).optional(),
    fbclid: z.string().max(255).optional(),
    gclid: z.string().max(255).optional(),
    ttclid: z.string().max(255).optional(),
    ttp: z.string().max(255).optional(),
  }).optional(),
  custom: z.object({
    currency: z.string().max(8).optional(),
    value: z.number().optional(),
    content_ids: z.array(z.string()).max(100).optional(),
    contents: z.array(z.object({
      id: z.string(), quantity: z.number(), item_price: z.number(),
    })).max(100).optional(),
    num_items: z.number().optional(),
  }).optional(),
});

export const Route = createFileRoute("/api/public/s2s-track")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      POST: async ({ request }) => {
        const respond = (status: number, body: Record<string, unknown>) =>
          new Response(JSON.stringify(body), {
            status, headers: { ...CORS, "Content-Type": "application/json" },
          });
        let parsed;
        try {
          parsed = BodySchema.parse(await request.json());
        } catch (e) {
          return respond(400, { error: "Invalid payload", detail: e instanceof Error ? e.message : "" });
        }
        const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? undefined;
        const ua = request.headers.get("user-agent") ?? undefined;

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { dispatchToStore } = await import("@/lib/tracking/dispatchers.server");

        const { data: pixels } = await supabaseAdmin
          .from("store_pixels").select("*")
          .eq("store_id", parsed.vitrine_store_id)
          .eq("enabled", true);
        if (!pixels?.length) return respond(200, { ok: true, dispatched: 0 });

        const results = await dispatchToStore(pixels as never, {
          event_name: parsed.event_name,
          event_id: parsed.event_id,
          event_time: Math.floor(Date.now() / 1000),
          event_source_url: parsed.event_source_url,
          user: {
            ip, user_agent: ua,
            fbp: parsed.attribution?.fbp,
            fbc: parsed.attribution?.fbc,
            fbclid: parsed.attribution?.fbclid,
            gclid: parsed.attribution?.gclid,
            ttclid: parsed.attribution?.ttclid,
            ttp: parsed.attribution?.ttp,
          },
          custom: parsed.custom ?? {},
        });

        // Log results (best-effort)
        await supabaseAdmin.from("tracking_events").insert(
          results.map((r) => ({
            workspace_id: parsed.workspace_id,
            store_id: parsed.vitrine_store_id,
            platform: r.platform,
            event_name: parsed.event_name,
            event_id: parsed.event_id,
            status: r.status === "success" ? "success" : "error",
            http_status: r.http_status ?? null,
            latency_ms: r.latency_ms,
            error_message: r.error_message ?? null,
          })),
        );

        return respond(200, { ok: true, dispatched: results.length });
      },
    },
  },
});