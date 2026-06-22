import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const SHOPIFY_API_VERSION = "2024-10";

type Variant = { id?: number | string; sku?: string | null };

/**
 * Propagates SKUs from the Vitrine (source of truth) to the Checkout store's
 * matched products via Shopify Admin API. Vitrine is always the origin —
 * its first non-empty variant SKU is written into every variant of the
 * matched checkout product so that all stores stay aligned.
 */
export const unifyMappedSkus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      sourceStoreId: z.string().uuid(),
      targetStoreId: z.string().uuid(),
      pairs: z
        .array(z.object({ source: z.string().uuid(), target: z.string().uuid() }))
        .min(1)
        .max(500),
    }),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { getShopifyAccessToken } = await import("@/lib/api/shopify-token.server");

    // Ownership: both stores must belong to the same workspace owned by user
    const { data: stores, error: storesErr } = await supabase
      .from("stores")
      .select("id, workspace_id, store_type")
      .in("id", [data.sourceStoreId, data.targetStoreId]);
    if (storesErr) throw new Error(storesErr.message);
    if (!stores || stores.length !== 2) throw new Error("Lojas não encontradas");
    if (stores[0].workspace_id !== stores[1].workspace_id) {
      throw new Error("Lojas pertencem a workspaces diferentes");
    }

    // Target store credentials (service-role so we can read tokens)
    const { data: target, error: targetErr } = await supabaseAdmin
      .from("stores")
      .select("id, shopify_domain, access_token, client_id, client_secret, cached_token, token_expires_at")
      .eq("id", data.targetStoreId)
      .single();
    if (targetErr || !target) throw new Error("Loja de checkout não encontrada");
    const token = await getShopifyAccessToken(target);

    // Load products (sources + targets) in single queries
    const sourceIds = data.pairs.map((p) => p.source);
    const targetIds = data.pairs.map((p) => p.target);
    const [{ data: srcRows }, { data: tgtRows }] = await Promise.all([
      supabase.from("products").select("id, variants").in("id", sourceIds),
      supabase.from("products").select("id, variants").in("id", targetIds),
    ]);
    const srcMap = new Map((srcRows ?? []).map((r) => [r.id, r]));
    const tgtMap = new Map((tgtRows ?? []).map((r) => [r.id, r]));

    const firstSku = (variants: unknown): string | null => {
      const arr = Array.isArray(variants) ? (variants as Variant[]) : [];
      for (const v of arr) {
        const s = typeof v?.sku === "string" ? v.sku.trim() : "";
        if (s) return s;
      }
      return null;
    };

    let updated = 0;
    let skipped = 0;
    const errors: Array<{ targetProductId: string; message: string }> = [];

    for (const pair of data.pairs) {
      const src = srcMap.get(pair.source);
      const tgt = tgtMap.get(pair.target);
      if (!src || !tgt) { skipped++; continue; }

      const sku = firstSku(src.variants);
      if (!sku) { skipped++; continue; }

      const tgtVariants = Array.isArray(tgt.variants) ? (tgt.variants as Variant[]) : [];
      if (!tgtVariants.length) { skipped++; continue; }

      for (const v of tgtVariants) {
        if (!v?.id) continue;
        // Skip if SKU already matches
        if (typeof v.sku === "string" && v.sku.trim() === sku) continue;
        const res = await fetch(
          `https://${target.shopify_domain}/admin/api/${SHOPIFY_API_VERSION}/variants/${v.id}.json`,
          {
            method: "PUT",
            headers: {
              "X-Shopify-Access-Token": token,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ variant: { id: v.id, sku } }),
          },
        );
        if (!res.ok) {
          const text = await res.text();
          errors.push({ targetProductId: pair.target, message: `${res.status}: ${text.slice(0, 160)}` });
          continue;
        }
        updated++;
      }
    }

    return { updated, skipped, errors, total: data.pairs.length };
  });