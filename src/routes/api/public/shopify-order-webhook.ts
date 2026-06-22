// Shopify webhook handler for orders/paid events from CHECKOUT stores.
// Verifies HMAC, locates the originating vitrine_store_id via cart_session,
// and dispatches Purchase to every pixel of that vitrine store.
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/shopify-order-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const url = new URL(request.url);
        // The checkout store id must be passed in the query string when registering
        // the webhook with Shopify so we know which store_secret to validate against.
        const checkoutStoreId = url.searchParams.get("store_id");
        if (!checkoutStoreId) return new Response("missing store_id", { status: 400 });

        const body = await request.text();
        const signature = request.headers.get("x-shopify-hmac-sha256") ?? "";

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { verifyShopifyHmac } = await import("@/lib/tracking/hash.server");

        const { data: checkoutStore } = await supabaseAdmin
          .from("stores").select("id, workspace_id, webhook_secret")
          .eq("id", checkoutStoreId).single();
        if (!checkoutStore?.webhook_secret) {
          return new Response("unknown store / no secret", { status: 401 });
        }
        const valid = await verifyShopifyHmac(body, signature, checkoutStore.webhook_secret);
        if (!valid) return new Response("invalid signature", { status: 401 });

        type ShopifyOrder = {
          id: number;
          email?: string;
          phone?: string;
          currency: string;
          total_price?: string;
          order_status_url?: string;
          customer?: { email?: string; phone?: string };
          line_items?: Array<{ product_id: number; variant_id: number; quantity: number; price: string }>;
        };
        let order: ShopifyOrder;
        try { order = JSON.parse(body) as ShopifyOrder; }
        catch { return new Response("bad json", { status: 400 }); }

        // Find the originating cart_session via checkout_distributions
        const { data: dist } = await supabaseAdmin
          .from("checkout_distributions")
          .select("cart_session_id, source_store_id, workspace_id")
          .eq("target_store_id", checkoutStoreId)
          .or(`shopify_draft_order_id.eq.${order.id},shopify_draft_order_id.eq.${String(order.id)}`)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        // If no distribution found, mark received but cannot attribute
        if (!dist?.source_store_id) {
          return new Response("ok (no attribution)", { status: 200 });
        }

        const { data: session } = dist.cart_session_id
          ? await supabaseAdmin
              .from("cart_sessions")
              .select("id, fbp, fbc, fbclid, gclid, ttclid, ttp, client_user_agent, ip_address, event_source_url, customer_email, customer_phone")
              .eq("id", dist.cart_session_id).maybeSingle()
          : { data: null };

        const { data: pixels } = await supabaseAdmin
          .from("store_pixels").select("*")
          .eq("store_id", dist.source_store_id).eq("enabled", true);
        if (!pixels?.length) {
          // Mark distribution paid even when no pixels configured
          await supabaseAdmin.from("checkout_distributions").update({ status: "paid" }).eq("cart_session_id", dist.cart_session_id ?? "");
          return new Response("ok (no pixels)", { status: 200 });
        }

        const { dispatchToStore } = await import("@/lib/tracking/dispatchers.server");
        const contents = (order.line_items ?? []).map((li) => ({
          id: String(li.variant_id),
          quantity: li.quantity,
          item_price: Number(li.price),
        }));

        const results = await dispatchToStore(pixels as never, {
          event_name: "Purchase",
          event_id: `order-${order.id}`,
          event_time: Math.floor(Date.now() / 1000),
          event_source_url: session?.event_source_url ?? order.order_status_url ?? undefined,
          user: {
            ip: session?.ip_address ?? undefined,
            user_agent: session?.client_user_agent ?? undefined,
            fbp: session?.fbp ?? undefined,
            fbc: session?.fbc ?? undefined,
            fbclid: session?.fbclid ?? undefined,
            gclid: session?.gclid ?? undefined,
            ttclid: session?.ttclid ?? undefined,
            ttp: session?.ttp ?? undefined,
            email: order.email ?? order.customer?.email ?? session?.customer_email ?? undefined,
            phone: order.phone ?? order.customer?.phone ?? session?.customer_phone ?? undefined,
            external_id: session?.id ?? undefined,
          },
          custom: {
            currency: order.currency,
            value: Number(order.total_price ?? 0),
            contents,
            content_ids: contents.map((c) => c.id),
            num_items: contents.reduce((s, c) => s + c.quantity, 0),
            order_id: String(order.id),
          },
        });

        await supabaseAdmin.from("tracking_events").insert(
          results.map((r) => ({
            workspace_id: dist.workspace_id,
            store_id: dist.source_store_id,
            cart_session_id: dist.cart_session_id ?? null,
            platform: r.platform,
            event_name: "Purchase",
            event_id: `order-${order.id}`,
            status: r.status === "success" ? "success" : "error",
            http_status: r.http_status ?? null,
            latency_ms: r.latency_ms,
            error_message: r.error_message ?? null,
          })),
        );

        if (dist.cart_session_id) {
          await supabaseAdmin.from("checkout_distributions")
            .update({ status: "paid" })
            .eq("cart_session_id", dist.cart_session_id);
        }

        return new Response("ok", { status: 200 });
      },
    },
  },
});