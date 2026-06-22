import { createFileRoute } from "@tanstack/react-router";

const SHOPIFY_API_VERSION = "2024-10";
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

type CartItem = { variant_id: string | number; quantity: number };
type DistributionSettings = {
  mode: "round_robin" | "weighted" | "manual" | "ai";
  weights: Record<string, number>;
  manual_target: string | null;
};

function pickTarget(
  targets: Array<{ id: string }>,
  dist: DistributionSettings,
  recentTargetIds: string[],
): { storeId: string; rule: string } | null {
  if (targets.length === 0) return null;
  if (dist.mode === "manual" && dist.manual_target) {
    const t = targets.find((s) => s.id === dist.manual_target);
    if (t) return { storeId: t.id, rule: "manual" };
  }
  if (dist.mode === "weighted") {
    const total = targets.reduce((s, t) => s + (dist.weights[t.id] ?? 0), 0);
    if (total > 0) {
      let r = Math.random() * total;
      for (const t of targets) {
        r -= dist.weights[t.id] ?? 0;
        if (r <= 0) return { storeId: t.id, rule: "weighted" };
      }
    }
  }
  // round_robin / ai / fallback: pick the target least used recently
  const counts = new Map<string, number>();
  targets.forEach((t) => counts.set(t.id, 0));
  recentTargetIds.forEach((id) => counts.set(id, (counts.get(id) ?? 0) + 1));
  let best = targets[0].id;
  let min = Infinity;
  for (const t of targets) {
    const c = counts.get(t.id) ?? 0;
    if (c < min) { min = c; best = t.id; }
  }
  return { storeId: best, rule: dist.mode };
}

export const Route = createFileRoute("/api/public/s2s-checkout")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      POST: async ({ request }) => {
        const json = (await request.json()) as {
          workspace_id?: string;
          vitrine_store_id?: string;
          items?: CartItem[];
          attribution?: {
            fbp?: string; fbc?: string; fbclid?: string;
            gclid?: string; ttclid?: string; ttp?: string;
          };
          event_source_url?: string;
        };
        const respond = (status: number, body: Record<string, unknown>) =>
          new Response(JSON.stringify(body), {
            status,
            headers: { ...CORS, "Content-Type": "application/json" },
          });

        if (!json.workspace_id || !json.vitrine_store_id || !json.items?.length) {
          return respond(400, { error: "Parâmetros inválidos" });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const { data: workspace } = await supabaseAdmin
          .from("workspaces").select("id, settings").eq("id", json.workspace_id).maybeSingle();
        if (!workspace) return respond(404, { error: "Workspace não encontrado" });

        const cartSettings = ((workspace.settings as { cart?: { distribution?: DistributionSettings } })?.cart);
        const dist: DistributionSettings = cartSettings?.distribution ?? { mode: "round_robin", weights: {}, manual_target: null };

        // Load target stores (checkout type, active) in the workspace
        const { data: targets } = await supabaseAdmin
          .from("stores")
          .select("id, shopify_domain, access_token, client_id, client_secret, cached_token, token_expires_at, display_name, cart_disabled")
          .eq("workspace_id", json.workspace_id)
          .eq("store_type", "checkout")
          .eq("is_active", true);
        if (!targets?.length) return respond(409, { error: "Nenhuma loja de checkout disponível" });

        // Filter out stores whose cart is disabled (auto-rotation)
        const availableTargets = targets.filter((t) => !t.cart_disabled);
        if (!availableTargets.length) {
          return respond(423, { error: "Todas as lojas de checkout atingiram o limite configurado." });
        }

        // Recent distributions for round-robin fairness
        const { data: recent } = await supabaseAdmin
          .from("checkout_distributions")
          .select("target_store_id")
          .eq("workspace_id", json.workspace_id)
          .order("created_at", { ascending: false })
          .limit(availableTargets.length * 5);

        const picked = pickTarget(availableTargets, dist, (recent ?? []).map((r) => r.target_store_id as string));
        if (!picked) return respond(409, { error: "Falha ao selecionar loja de destino" });

        // === Auto-rotation: evaluate limits for picked store ===
        let finalStoreId = picked.storeId;
        let finalRule = picked.rule;
        const triedStores = new Set<string>();
        for (let attempt = 0; attempt < availableTargets.length; attempt++) {
          if (triedStores.has(finalStoreId)) break;
          triedStores.add(finalStoreId);

          const { data: limits } = await supabaseAdmin.rpc("evaluate_store_limits", {
            _store_id: finalStoreId,
          });
          const exceeded = (limits ?? []).find((l: { exceeded: boolean }) => l.exceeded) as
            | { rule_id: string; metric: string; time_window: string; consumed: number; limit_value: number; action: string; fallback_store_ids: string[] }
            | undefined;
          if (!exceeded) break;

          // Log event
          await supabaseAdmin.from("store_rotation_events").insert({
            workspace_id: json.workspace_id,
            store_id: finalStoreId,
            rule_id: exceeded.rule_id,
            action_taken: exceeded.action,
            metric: exceeded.metric,
            time_window: exceeded.time_window,
            consumed: exceeded.consumed,
            limit_value: exceeded.limit_value,
          });

          if (exceeded.action === "notify_only") break;

          if (exceeded.action === "disable_cart" || exceeded.action === "rotate_then_disable") {
            await supabaseAdmin
              .from("stores")
              .update({
                cart_disabled: true,
                cart_disabled_reason: `Limite atingido: ${exceeded.metric} ${exceeded.consumed}/${exceeded.limit_value} (${exceeded.time_window})`,
                cart_disabled_at: new Date().toISOString(),
              })
              .eq("id", finalStoreId);
          }

          if (exceeded.action === "rotate" || exceeded.action === "rotate_then_disable") {
            const next = exceeded.fallback_store_ids.find(
              (id) => !triedStores.has(id) && availableTargets.some((t) => t.id === id && !t.cart_disabled),
            );
            if (next) {
              finalStoreId = next;
              finalRule = "rotation_fallback";
              await supabaseAdmin.from("store_rotation_events").insert({
                workspace_id: json.workspace_id,
                store_id: finalStoreId,
                action_taken: "redirected_in",
                redirected_to_store_id: finalStoreId,
              });
              continue;
            }
          }

          if (exceeded.action === "disable_cart") {
            return respond(423, { error: "Esta loja atingiu o limite configurado." });
          }
          // rotate without fallback available
          return respond(423, { error: "Limite atingido e sem loja de fallback disponível." });
        }

        const target = availableTargets.find((t) => t.id === finalStoreId) ?? targets.find((t) => t.id === finalStoreId)!;
        if (!target.access_token && !(target.client_id && target.client_secret)) {
          return respond(409, { error: "Loja destino sem credenciais" });
        }
        const { getShopifyAccessToken } = await import("@/lib/api/shopify-token.server");
        const targetToken = await getShopifyAccessToken(target);

        // Resolve source variant_id -> target variant_id via product_mappings
        const sourceVariantIds = json.items.map((i) => String(i.variant_id));

        // Find vitrine products that contain these variant IDs
        const { data: vitrineProducts } = await supabaseAdmin
          .from("products")
          .select("id, variants, shopify_product_id")
          .eq("store_id", json.vitrine_store_id);

        type ProductRow = { id: string; variants: Array<{ id: number | string }> | null; shopify_product_id: string };
        const sourceVariantToProduct = new Map<string, string>();
        (vitrineProducts as ProductRow[] | null)?.forEach((p) => {
          (p.variants ?? []).forEach((v) => sourceVariantToProduct.set(String(v.id), p.id));
        });

        const sourceProductIds = Array.from(new Set(sourceVariantIds.map((vid) => sourceVariantToProduct.get(vid)).filter(Boolean) as string[]));

        const { data: mappings } = await supabaseAdmin
          .from("product_mappings")
          .select("source_product_id, target_product_id, target_variant_id, source_variant_id")
          .eq("target_store_id", finalStoreId)
          .in("source_product_id", sourceProductIds.length ? sourceProductIds : ["00000000-0000-0000-0000-000000000000"]);

        const mapBySrc = new Map<string, { target_product_id: string; target_variant_id: string | null }>();
        mappings?.forEach((m) =>
          mapBySrc.set(m.source_product_id as string, {
            target_product_id: m.target_product_id as string,
            target_variant_id: (m.target_variant_id as string | null) ?? null,
          }),
        );

        // Load target products to pick a default variant when mapping has none
        const targetProductIds = Array.from(new Set(Array.from(mapBySrc.values()).map((m) => m.target_product_id)));
        const { data: targetProducts } = targetProductIds.length
          ? await supabaseAdmin
              .from("products")
              .select("id, variants")
              .in("id", targetProductIds)
          : { data: [] as ProductRow[] };

        const variantsByProduct = new Map<string, Array<{ id: number | string }>>();
        (targetProducts as ProductRow[] | null)?.forEach((p) => variantsByProduct.set(p.id, p.variants ?? []));

        const lineItems: Array<{ variant_id: number; quantity: number }> = [];
        const unresolved: string[] = [];
        for (const item of json.items) {
          const srcProductId = sourceVariantToProduct.get(String(item.variant_id));
          const mapping = srcProductId ? mapBySrc.get(srcProductId) : undefined;
          if (!mapping) { unresolved.push(String(item.variant_id)); continue; }
          const targetVariantId = mapping.target_variant_id
            ?? variantsByProduct.get(mapping.target_product_id)?.[0]?.id;
          if (!targetVariantId) { unresolved.push(String(item.variant_id)); continue; }
          lineItems.push({ variant_id: Number(targetVariantId), quantity: item.quantity || 1 });
        }

        if (lineItems.length === 0) {
          return respond(409, { error: "Nenhum produto mapeado para esta loja de checkout", unresolved });
        }

        // Create cart session
        const sessionToken = crypto.randomUUID();
        const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
        const ua = request.headers.get("user-agent") ?? null;
        const { data: session } = await supabaseAdmin
          .from("cart_sessions").insert({
            workspace_id: json.workspace_id,
            vitrine_store_id: json.vitrine_store_id,
            session_token: sessionToken,
            items: json.items,
            assigned_checkout_store_id: finalStoreId,
            status: "checkout_started",
            ip_address: ip,
            user_agent: ua,
            client_user_agent: ua,
            event_source_url: json.event_source_url ?? null,
            fbp: json.attribution?.fbp ?? null,
            fbc: json.attribution?.fbc ?? null,
            fbclid: json.attribution?.fbclid ?? null,
            gclid: json.attribution?.gclid ?? null,
            ttclid: json.attribution?.ttclid ?? null,
            ttp: json.attribution?.ttp ?? null,
          }).select("id").single();

        // Create draft order
        const draftRes = await fetch(
          `https://${target.shopify_domain}/admin/api/${SHOPIFY_API_VERSION}/draft_orders.json`,
          {
            method: "POST",
            headers: {
              "X-Shopify-Access-Token": targetToken,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ draft_order: { line_items: lineItems, use_customer_default_address: false } }),
          },
        );
        if (!draftRes.ok) {
          const t = await draftRes.text();
          return respond(502, { error: `Falha ao criar pedido na loja destino`, detail: t.slice(0, 200) });
        }
        const draft = (await draftRes.json()) as { draft_order: { id: number; invoice_url: string } };

        await supabaseAdmin.from("checkout_distributions").insert({
          workspace_id: json.workspace_id,
          cart_session_id: session?.id ?? null,
          source_store_id: json.vitrine_store_id,
          target_store_id: finalStoreId,
          distribution_rule: finalRule,
          shopify_draft_order_id: String(draft.draft_order.id),
          checkout_url: draft.draft_order.invoice_url,
          status: "created",
        });

        // Fire InitiateCheckout server-side (best-effort, isolated)
        try {
          const { data: pixels } = await supabaseAdmin
            .from("store_pixels").select("*")
            .eq("store_id", json.vitrine_store_id).eq("enabled", true);
          if (pixels?.length) {
            const { dispatchToStore } = await import("@/lib/tracking/dispatchers.server");
            const contents = json.items.map((i) => ({
              id: String(i.variant_id), quantity: i.quantity || 1, item_price: 0,
            }));
            const results = await dispatchToStore(pixels as never, {
              event_name: "InitiateCheckout",
              event_id: `ic-${session?.id ?? sessionToken}`,
              event_time: Math.floor(Date.now() / 1000),
              event_source_url: json.event_source_url,
              user: {
                ip: ip ?? undefined, user_agent: ua ?? undefined,
                fbp: json.attribution?.fbp, fbc: json.attribution?.fbc,
                fbclid: json.attribution?.fbclid, gclid: json.attribution?.gclid,
                ttclid: json.attribution?.ttclid, ttp: json.attribution?.ttp,
                external_id: session?.id ?? undefined,
              },
              custom: {
                content_ids: contents.map((c) => c.id),
                contents,
                num_items: contents.reduce((s, c) => s + c.quantity, 0),
              },
            });
            await supabaseAdmin.from("tracking_events").insert(
              results.map((r) => ({
                workspace_id: json.workspace_id!,
                store_id: json.vitrine_store_id!,
                cart_session_id: session?.id ?? null,
                platform: r.platform,
                event_name: "InitiateCheckout",
                event_id: `ic-${session?.id ?? sessionToken}`,
                status: r.status === "success" ? "success" : "error",
                http_status: r.http_status ?? null,
                latency_ms: r.latency_ms,
                error_message: r.error_message ?? null,
              })),
            );
          }
        } catch (err) {
          console.error("[s2s-checkout] InitiateCheckout dispatch failed", err);
        }

        return respond(200, {
          checkout_url: draft.draft_order.invoice_url,
          target_store: target.display_name ?? target.shopify_domain,
        });
      },
    },
  },
});