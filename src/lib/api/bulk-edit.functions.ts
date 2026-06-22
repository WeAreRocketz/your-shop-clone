import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const API = "2024-10";

type StoreCreds = { id: string; shopify_domain: string };

export const bulkUpdateText = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      store_id: z.string().uuid(),
      product_ids: z.array(z.string().uuid()).min(1).max(200),
      title_prefix: z.string().max(200).optional(),
      title_suffix: z.string().max(200).optional(),
      title_find: z.string().max(200).optional(),
      title_replace: z.string().max(200).optional(),
      desc_prefix: z.string().max(2000).optional(),
      desc_suffix: z.string().max(2000).optional(),
      desc_find: z.string().max(2000).optional(),
      desc_replace: z.string().max(2000).optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: storeRow, error: storeErr } = await supabase
      .from("stores")
      .select("id, shopify_domain, access_token, client_id, client_secret, cached_token, token_expires_at")
      .eq("id", data.store_id)
      .single();
    if (storeErr || !storeRow) throw new Error("Loja sem token Shopify");
    const store = storeRow as StoreCreds;
    const { getShopifyAccessToken } = await import("@/lib/api/shopify-token.server");
    const token = await getShopifyAccessToken(storeRow);
    const { data: rows, error } = await supabase
      .from("products")
      .select("id, shopify_product_id, title, description")
      .eq("store_id", data.store_id)
      .in("id", data.product_ids);
    if (error) throw error;

    let ok = 0; const failures: { id: string; error: string }[] = [];
    for (const p of rows ?? []) {
      let title = p.title ?? "";
      let desc = p.description ?? "";
      if (data.title_find) title = title.split(data.title_find).join(data.title_replace ?? "");
      if (data.title_prefix) title = `${data.title_prefix}${title}`;
      if (data.title_suffix) title = `${title}${data.title_suffix}`;
      if (data.desc_find) desc = desc.split(data.desc_find).join(data.desc_replace ?? "");
      if (data.desc_prefix) desc = `${data.desc_prefix}${desc}`;
      if (data.desc_suffix) desc = `${desc}${data.desc_suffix}`;

      try {
        const res = await fetch(
          `https://${store.shopify_domain}/admin/api/${API}/products/${p.shopify_product_id}.json`,
          {
            method: "PUT",
            headers: {
              "X-Shopify-Access-Token": token,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ product: { id: Number(p.shopify_product_id), title, body_html: desc } }),
          },
        );
        if (!res.ok) throw new Error(`Shopify ${res.status}: ${await res.text()}`);
        await supabase.from("products").update({ title, description: desc }).eq("id", p.id);
        ok++;
      } catch (e) {
        failures.push({ id: p.id, error: (e as Error).message });
      }
    }
    return { ok, failed: failures.length, failures };
  });

export const replaceProductImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      store_id: z.string().uuid(),
      product_id: z.string().uuid(),
      image_base64: z.string().min(100).max(15_000_000), // ~10MB base64
      filename: z.string().max(120).default("edited.jpg"),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: storeRow, error: storeErr } = await supabase
      .from("stores")
      .select("id, shopify_domain, access_token, client_id, client_secret, cached_token, token_expires_at")
      .eq("id", data.store_id)
      .single();
    if (storeErr || !storeRow) throw new Error("Loja sem token Shopify");
    const store = storeRow as StoreCreds;
    const { getShopifyAccessToken } = await import("@/lib/api/shopify-token.server");
    const token = await getShopifyAccessToken(storeRow);
    const { data: prod, error } = await supabase
      .from("products")
      .select("id, shopify_product_id, images")
      .eq("id", data.product_id)
      .single();
    if (error || !prod) throw new Error("Produto não encontrado");

    // 1) Upload new image as position 1
    const upRes = await fetch(
      `https://${store.shopify_domain}/admin/api/${API}/products/${prod.shopify_product_id}/images.json`,
      {
        method: "POST",
        headers: { "X-Shopify-Access-Token": token, "Content-Type": "application/json" },
        body: JSON.stringify({ image: { attachment: data.image_base64, filename: data.filename, position: 1 } }),
      },
    );
    if (!upRes.ok) throw new Error(`Upload Shopify falhou ${upRes.status}: ${await upRes.text()}`);
    const upJson = (await upRes.json()) as { image: { id: number; src: string } };
    const newImage = upJson.image;

    // 2) Delete previous images (best-effort)
    const imgs = (prod.images as Array<{ id?: number; shopify_id?: number }> | null) ?? [];
    for (const img of imgs) {
      const oldId = img.id ?? img.shopify_id;
      if (!oldId || oldId === newImage.id) continue;
      try {
        await fetch(
          `https://${store.shopify_domain}/admin/api/${API}/products/${prod.shopify_product_id}/images/${oldId}.json`,
          { method: "DELETE", headers: { "X-Shopify-Access-Token": token } },
        );
      } catch { /* ignore */ }
    }

    await supabase
      .from("products")
      .update({ images: [{ id: newImage.id, src: newImage.src }] })
      .eq("id", prod.id);
    return { ok: true, src: newImage.src };
  });