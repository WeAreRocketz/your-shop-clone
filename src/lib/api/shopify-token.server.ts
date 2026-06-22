import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type StoreTokenRow = {
  id: string;
  shopify_domain: string;
  access_token: string | null;
  client_id: string | null;
  client_secret: string | null;
  cached_token: string | null;
  token_expires_at: string | null;
};

export const STORE_TOKEN_COLUMNS =
  "id, shopify_domain, access_token, client_id, client_secret, cached_token, token_expires_at";

/**
 * Returns a valid Admin API access token for the store.
 * - Legacy stores: returns the permanent shpat_ token.
 * - Dev Dashboard stores (Jan/2026+): exchanges Client ID + Secret via the
 *   client credentials grant and caches the short-lived token (~24h).
 */
export async function getShopifyAccessToken(store: StoreTokenRow): Promise<string> {
  if (store.access_token) return store.access_token;
  if (!store.client_id || !store.client_secret) {
    throw new Error("Loja sem credenciais Shopify configuradas");
  }

  const expiresAt = store.token_expires_at ? new Date(store.token_expires_at).getTime() : 0;
  if (store.cached_token && expiresAt - Date.now() > 5 * 60 * 1000) {
    return store.cached_token;
  }

  const res = await fetch(`https://${store.shopify_domain}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "client_credentials",
      client_id: store.client_id,
      client_secret: store.client_secret,
    }),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Falha ao obter token Shopify (${res.status}): ${txt.slice(0, 200)}`);
  }
  const json = (await res.json()) as { access_token: string; expires_in?: number };
  const expiresIn = json.expires_in ?? 86400;
  const newExpiry = new Date(Date.now() + expiresIn * 1000).toISOString();

  await supabaseAdmin
    .from("stores")
    .update({ cached_token: json.access_token, token_expires_at: newExpiry })
    .eq("id", store.id);

  return json.access_token;
}