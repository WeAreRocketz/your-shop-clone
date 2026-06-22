import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const SHOPIFY_API_VERSION = "2024-10";

type Variant = {
  title?: string | null;
  price?: string | number | null;
  sku?: string | null;
  inventory_quantity?: number | null;
};

type ProductRow = {
  id: string;
  shopify_product_id: string;
  title: string;
  description: string | null;
  handle: string | null;
  images: string[] | null;
  variants: Variant[] | null;
  tags: string[] | null;
  vendor: string | null;
  product_type: string | null;
  status: string | null;
};

/**
 * Clones all products from a source (vitrine) store into a target (checkout)
 * store via the Shopify Admin API. Optionally unifies variant SKUs to match the
 * source so future re-uploads stay aligned.
 */
export const cloneVitrineToCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      sourceStoreId: z.string().uuid(),
      targetStoreId: z.string().uuid(),
      unifySku: z.boolean().default(true),
    }),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { getShopifyAccessToken } = await import("@/lib/api/shopify-token.server");

    // Ownership check: both stores must belong to a workspace the user owns
    const { data: stores, error: storesErr } = await supabase
      .from("stores")
      .select("id, workspace_id, shopify_domain, store_type")
      .in("id", [data.sourceStoreId, data.targetStoreId]);
    if (storesErr) throw new Error(storesErr.message);
    if (!stores || stores.length !== 2) throw new Error("Lojas não encontradas");
    if (stores[0].workspace_id !== stores[1].workspace_id) {
      throw new Error("Lojas pertencem a workspaces diferentes");
    }

    const { data: target, error: targetErr } = await supabaseAdmin
      .from("stores")
      .select("id, shopify_domain, access_token, client_id, client_secret, cached_token, token_expires_at")
      .eq("id", data.targetStoreId)
      .single();
    if (targetErr || !target) throw new Error("Loja de checkout não encontrada");
    const token = await getShopifyAccessToken(target);

    const { data: products, error: prodErr } = await supabase
      .from("products")
      .select("id, shopify_product_id, title, description, handle, images, variants, tags, vendor, product_type, status")
      .eq("store_id", data.sourceStoreId);
    if (prodErr) throw new Error(prodErr.message);
    const rows = (products ?? []) as ProductRow[];
    if (rows.length === 0) throw new Error("Vitrine não tem produtos para clonar");

    let created = 0;
    const errors: Array<{ title: string; message: string }> = [];

    for (const p of rows) {
      const variants = (p.variants ?? []).map((v) => ({
        title: v.title ?? "Default Title",
        price: v.price ?? "0.00",
        sku: data.unifySku
          ? v.sku ?? `${p.shopify_product_id}`
          : v.sku ?? undefined,
        inventory_management: null,
      }));

      const body = {
        product: {
          title: p.title,
          body_html: p.description ?? "",
          handle: p.handle ?? undefined,
          vendor: p.vendor ?? undefined,
          product_type: p.product_type ?? undefined,
          tags: (p.tags ?? []).join(", "),
          status: "draft",
          images: (p.images ?? []).map((src) => ({ src })),
          variants: variants.length > 0 ? variants : undefined,
        },
      };

      const res = await fetch(
        `https://${target.shopify_domain}/admin/api/${SHOPIFY_API_VERSION}/products.json`,
        {
          method: "POST",
          headers: {
            "X-Shopify-Access-Token": token,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        },
      );

      if (!res.ok) {
        const text = await res.text();
        errors.push({ title: p.title, message: `${res.status}: ${text.slice(0, 160)}` });
        continue;
      }
      created++;
    }

    return { created, total: rows.length, errors, userId };
  });