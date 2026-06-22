import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const SHOPIFY_API_VERSION = "2024-10";

export const STABLE_APP_URL =
  "https://project--ed2c3dc4-5eef-43f7-ac85-ff7437e6fd71.lovable.app";

const CartSettingsSchema = z.object({
  position: z.enum(["bottom-right", "bottom-left"]).default("bottom-right"),
  primary_color: z.string().default("#6366f1"),
  button_text: z.string().default("Finalizar compra"),
  show_target_store: z.boolean().default(false),
  distribution: z.object({
    mode: z.enum(["round_robin", "weighted", "manual", "ai"]).default("round_robin"),
    weights: z.record(z.string(), z.number()).default({}),
    manual_target: z.string().nullable().default(null),
  }),
});
export type CartSettings = z.infer<typeof CartSettingsSchema>;

export const saveCartSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ workspaceId: z.string().uuid(), settings: CartSettingsSchema }))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("workspaces")
      .update({ settings: { cart: data.settings } })
      .eq("id", data.workspaceId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getScriptStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ storeId: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    const { data: store, error } = await context.supabase
      .from("stores")
      .select("id, shopify_domain, access_token, client_id, client_secret, cached_token, token_expires_at")
      .eq("id", data.storeId)
      .single();
    if (error || !store) throw new Error("Loja não encontrada");
    if (!store.access_token && !store.client_id) return { installed: false, scripts: [] };
    const { getShopifyAccessToken } = await import("@/lib/api/shopify-token.server");
    const token = await getShopifyAccessToken(store);

    const res = await fetch(
      `https://${store.shopify_domain}/admin/api/${SHOPIFY_API_VERSION}/script_tags.json`,
      { headers: { "X-Shopify-Access-Token": token } },
    );
    if (!res.ok) return { installed: false, scripts: [] };
    const json = (await res.json()) as { script_tags: Array<{ id: number; src: string }> };
    const expected = `${STABLE_APP_URL}/api/public/s2s-cart.js`;
    const installed = json.script_tags?.some((s) => s.src === expected) ?? false;
    return { installed, scripts: json.script_tags ?? [] };
  });

export const installScriptTag = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ storeId: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    const { data: store, error } = await context.supabase
      .from("stores")
      .select("id, shopify_domain, access_token, client_id, client_secret, cached_token, token_expires_at")
      .eq("id", data.storeId)
      .single();
    if (error || !store) throw new Error("Loja não encontrada");
    const { getShopifyAccessToken } = await import("@/lib/api/shopify-token.server");
    const token = await getShopifyAccessToken(store);

    const src = `${STABLE_APP_URL}/api/public/s2s-cart.js`;
    const res = await fetch(
      `https://${store.shopify_domain}/admin/api/${SHOPIFY_API_VERSION}/script_tags.json`,
      {
        method: "POST",
        headers: {
          "X-Shopify-Access-Token": token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          script_tag: { event: "onload", src, display_scope: "online_store" },
        }),
      },
    );
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`Shopify Script Tag API ${res.status}: ${t.slice(0, 200)}`);
    }
    return { ok: true };
  });

export const uninstallScriptTag = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ storeId: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    const { data: store, error } = await context.supabase
      .from("stores")
      .select("id, shopify_domain, access_token, client_id, client_secret, cached_token, token_expires_at")
      .eq("id", data.storeId)
      .single();
    if (error || !store) throw new Error("Loja não encontrada");
    const { getShopifyAccessToken } = await import("@/lib/api/shopify-token.server");
    const token = await getShopifyAccessToken(store);

    const listRes = await fetch(
      `https://${store.shopify_domain}/admin/api/${SHOPIFY_API_VERSION}/script_tags.json`,
      { headers: { "X-Shopify-Access-Token": token } },
    );
    if (!listRes.ok) return { ok: true, removed: 0 };
    const json = (await listRes.json()) as { script_tags: Array<{ id: number; src: string }> };
    const expected = `${STABLE_APP_URL}/api/public/s2s-cart.js`;
    const matches = (json.script_tags ?? []).filter((s) => s.src === expected);
    let removed = 0;
    for (const tag of matches) {
      const delRes = await fetch(
        `https://${store.shopify_domain}/admin/api/${SHOPIFY_API_VERSION}/script_tags/${tag.id}.json`,
        { method: "DELETE", headers: { "X-Shopify-Access-Token": token } },
      );
      if (delRes.ok) removed++;
    }
    return { ok: true, removed };
  });