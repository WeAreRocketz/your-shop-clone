import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const SHOPIFY_API_VERSION = "2024-10";

export const checkStoreHealth = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ store_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: store, error } = await supabase
      .from("stores")
      .select("id, shopify_domain, access_token, client_id, client_secret, cached_token, token_expires_at, status")
      .eq("id", data.store_id)
      .single();
    if (error || !store) throw new Error("Loja não encontrada");

    let newStatus: "active" | "down" | "disabled" = "active";
    let reason: string | null = null;

    if (!store.access_token && !(store.client_id && store.client_secret)) {
      newStatus = "down";
      reason = "Sem credenciais de acesso";
    } else {
      try {
        const { getShopifyAccessToken } = await import("@/lib/api/shopify-token.server");
        const token = await getShopifyAccessToken(store);
        const res = await fetch(
          `https://${store.shopify_domain}/admin/api/${SHOPIFY_API_VERSION}/shop.json`,
          { headers: { "X-Shopify-Access-Token": token } },
        );
        if (res.status === 401 || res.status === 402 || res.status === 403 || res.status === 423) {
          newStatus = "down";
          reason = `Shopify respondeu ${res.status} (loja desativada ou suspensa)`;
        } else if (res.status === 404) {
          newStatus = "down";
          reason = "Domínio Shopify não encontrado";
        } else if (!res.ok) {
          newStatus = "down";
          reason = `Shopify respondeu ${res.status}`;
        }
      } catch (e) {
        newStatus = "down";
        reason = `Falha ao contatar a loja: ${(e as Error).message}`;
      }
    }

    const patch: {
      status: "active" | "down" | "disabled";
      last_health_check_at: string;
      deactivated_at?: string | null;
      deactivation_reason?: string | null;
      notified_down_at?: string | null;
    } = {
      status: newStatus,
      last_health_check_at: new Date().toISOString(),
    };
    if (newStatus === "down" && store.status !== "down") {
      patch.deactivated_at = new Date().toISOString();
      patch.deactivation_reason = reason;
    }
    if (newStatus === "active" && store.status === "down") {
      patch.deactivated_at = null;
      patch.deactivation_reason = null;
      patch.notified_down_at = null;
    }

    await supabase.from("stores").update(patch).eq("id", store.id);
    return { status: newStatus, reason };
  });

export const setStoreStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      store_id: z.string().uuid(),
      status: z.enum(["active", "down", "disabled"]),
      reason: z.string().max(500).optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const patch: {
      status: "active" | "down" | "disabled";
      deactivated_at?: string | null;
      deactivation_reason?: string | null;
    } = { status: data.status };
    if (data.status === "down") {
      patch.deactivated_at = new Date().toISOString();
      patch.deactivation_reason = data.reason ?? "Marcada manualmente";
    } else {
      patch.deactivated_at = null;
      patch.deactivation_reason = null;
    }
    const { error } = await context.supabase.from("stores").update(patch).eq("id", data.store_id);
    if (error) throw error;
    return { ok: true };
  });