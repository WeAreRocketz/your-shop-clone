import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const SHOPIFY_API_VERSION = "2024-10";

type ShopifyImage = { src: string };
type ShopifyVariant = {
  id: number;
  title: string;
  price: string;
  sku: string | null;
  inventory_quantity: number | null;
};
type ShopifyProduct = {
  id: number;
  title: string;
  body_html: string | null;
  handle: string;
  vendor: string | null;
  product_type: string | null;
  status: string | null;
  tags: string;
  images: ShopifyImage[];
  variants: ShopifyVariant[];
};

function parseNextPageInfo(linkHeader: string | null): string | null {
  if (!linkHeader) return null;
  const parts = linkHeader.split(",");
  for (const part of parts) {
    const m = part.match(/<([^>]+)>;\s*rel="next"/);
    if (m) {
      const url = new URL(m[1]);
      return url.searchParams.get("page_info");
    }
  }
  return null;
}

/**
 * Creates a sync job in 'pending' state and returns its id.
 * Client should then call runSyncJob and start polling in parallel.
 */
export const createSyncJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ storeId: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    const { supabase } = context;

    const { data: store, error: storeErr } = await supabase
      .from("stores")
      .select("id, workspace_id, store_type")
      .eq("id", data.storeId)
      .single();
    if (storeErr || !store) throw new Error("Loja não encontrada");

    const { data: job, error: jobErr } = await supabase
      .from("sync_jobs")
      .insert({
        workspace_id: store.workspace_id,
        store_id: store.id,
        status: "pending",
      })
      .select("id")
      .single();
    if (jobErr || !job) throw new Error(jobErr?.message ?? "Falha ao criar job");

    return { jobId: job.id as string };
  });

/**
 * Executes a sync job: paginates Shopify Admin API and upserts products.
 * Updates the sync_job progress after each page so the client can poll.
 */
export const runSyncJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ jobId: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    const { supabase } = context;

    const { data: job, error: jobErr } = await supabase
      .from("sync_jobs")
      .select("id, store_id")
      .eq("id", data.jobId)
      .single();
    if (jobErr || !job) throw new Error("Job não encontrado");

    const { data: store, error: storeErr } = await supabase
      .from("stores")
      .select("id, shopify_domain, access_token, client_id, client_secret, cached_token, token_expires_at")
      .eq("id", job.store_id)
      .single();
    if (storeErr || !store) throw new Error("Loja não encontrada");
    const { getShopifyAccessToken } = await import("@/lib/api/shopify-token.server");
    const token = await getShopifyAccessToken(store);

    await supabase
      .from("sync_jobs")
      .update({ status: "running", started_at: new Date().toISOString() })
      .eq("id", job.id);

    let totalSynced = 0;
    const errors: Array<{ message: string }> = [];
    let pageInfo: string | null = null;
    let safety = 0;

    try {
      do {
        safety++;
        if (safety > 100) throw new Error("Limite de páginas excedido");

        const url = new URL(
          `https://${store.shopify_domain}/admin/api/${SHOPIFY_API_VERSION}/products.json`,
        );
        url.searchParams.set("limit", "250");
        if (pageInfo) url.searchParams.set("page_info", pageInfo);

        const res = await fetch(url.toString(), {
          headers: {
            "X-Shopify-Access-Token": token,
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Shopify API ${res.status}: ${text.slice(0, 200)}`);
        }

        const payload = (await res.json()) as { products: ShopifyProduct[] };
        const products = payload.products ?? [];

        if (products.length > 0) {
          const rows = products.map((p) => ({
            store_id: store.id,
            shopify_product_id: String(p.id),
            title: p.title,
            description: p.body_html,
            handle: p.handle,
            images: p.images?.map((i) => i.src) ?? [],
            variants:
              p.variants?.map((v) => ({
                id: v.id,
                title: v.title,
                price: v.price,
                sku: v.sku,
                inventory_quantity: v.inventory_quantity,
              })) ?? [],
            tags: p.tags ? p.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
            vendor: p.vendor,
            product_type: p.product_type,
            status: p.status,
            synced_at: new Date().toISOString(),
          }));

          const { error: upsertErr } = await supabase
            .from("products")
            .upsert(rows, { onConflict: "store_id,shopify_product_id" });

          if (upsertErr) {
            errors.push({ message: upsertErr.message });
          } else {
            totalSynced += products.length;
          }
        }

        pageInfo = parseNextPageInfo(res.headers.get("link"));

        await supabase
          .from("sync_jobs")
          .update({
            products_synced: totalSynced,
            errors_log: errors,
          })
          .eq("id", job.id);
      } while (pageInfo);

      await supabase
        .from("sync_jobs")
        .update({
          status: errors.length > 0 ? "error" : "done",
          products_synced: totalSynced,
          errors_log: errors,
          finished_at: new Date().toISOString(),
        })
        .eq("id", job.id);

      return { ok: true, synced: totalSynced };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await supabase
        .from("sync_jobs")
        .update({
          status: "error",
          products_synced: totalSynced,
          errors_log: [...errors, { message }],
          finished_at: new Date().toISOString(),
        })
        .eq("id", job.id);
      throw err;
    }
  });