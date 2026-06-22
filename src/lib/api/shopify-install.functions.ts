import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Finaliza o fluxo de instalação OAuth do app Shopify:
 * troca o `code` por um access_token permanente e grava na linha da loja.
 */
export const exchangeShopifyInstallCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      storeId: z.string().uuid(),
      code: z.string().min(1).max(512),
      shop: z.string().min(3).max(255).regex(/^[a-z0-9.-]+\.myshopify\.com$/i),
    }),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // RLS já filtra por workspace do usuário; .single() falha se não encontrar.
    const { data: store, error } = await supabase
      .from("stores")
      .select("id, shopify_domain, client_id, client_secret, workspace_id")
      .eq("id", data.storeId)
      .single();
    if (error || !store) throw new Error("Loja não encontrada");

    if (!store.client_id || !store.client_secret) {
      throw new Error("Loja sem Client ID / Secret configurados");
    }
    if (store.shopify_domain.toLowerCase() !== data.shop.toLowerCase()) {
      throw new Error("Domínio retornado pela Shopify não confere com a loja");
    }

    const res = await fetch(`https://${store.shopify_domain}/admin/oauth/access_token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: store.client_id,
        client_secret: store.client_secret,
        code: data.code,
      }),
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new Error(`Shopify recusou a instalação (${res.status}): ${txt.slice(0, 200)}`);
    }
    const json = (await res.json()) as { access_token?: string };
    if (!json.access_token) throw new Error("Resposta sem access_token");

    const { error: upErr } = await supabase
      .from("stores")
      .update({ access_token: json.access_token, status: "active", is_active: true })
      .eq("id", store.id);
    if (upErr) throw new Error(upErr.message);

    return { success: true, userId };
  });