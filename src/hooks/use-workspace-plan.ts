import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type PlanRow = {
  id: string;
  slug: string | null;
  name: string;
  price_monthly: number;
  max_stores: number | null;
  max_products: number | null;
  max_orders_monthly: number | null;
  is_trial: boolean;
  trial_days: number | null;
};

export type WorkspacePlanData = {
  workspaceId: string;
  plan: PlanRow | null;
  trialEndsAt: string | null;
  trialExpired: boolean;
  usage: { stores: number; products: number; orders: number };
  overLimit: { stores: boolean; products: boolean; orders: boolean };
};

export function useWorkspacePlan() {
  return useQuery<WorkspacePlanData | null>({
    queryKey: ["workspace-plan"],
    queryFn: async () => {
      const { data: ws, error } = await supabase
        .from("workspaces")
        .select("id, plan_id, trial_ends_at, plans(*)")
        .limit(1)
        .maybeSingle();
      if (error || !ws) return null;
      const plan = (ws.plans as unknown as PlanRow | null) ?? null;

      const storeIdsRes = await supabase.from("stores").select("id").eq("workspace_id", ws.id);
      const storeIds = (storeIdsRes.data ?? []).map((s) => s.id);

      const [storesQ, productsQ, ordersQ] = await Promise.all([
        supabase.from("stores").select("id", { count: "exact", head: true }).eq("workspace_id", ws.id),
        storeIds.length
          ? supabase.from("products").select("id", { count: "exact", head: true }).in("store_id", storeIds)
          : Promise.resolve({ count: 0 }),
        supabase.from("checkout_distributions").select("id", { count: "exact", head: true })
          .eq("workspace_id", ws.id)
          .gte("created_at", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
      ]);
      const storesC = storesQ.count;
      const productsC = productsQ.count;
      const ordersC = ordersQ.count;

      const stores = storesC ?? 0;
      const products = productsC ?? 0;
      const orders = ordersC ?? 0;

      const over = (used: number, max: number | null | undefined) =>
        typeof max === "number" && used >= max;

      const trialExpired = !!(plan?.is_trial && ws.trial_ends_at && new Date(ws.trial_ends_at) < new Date());

      return {
        workspaceId: ws.id,
        plan,
        trialEndsAt: ws.trial_ends_at,
        trialExpired,
        usage: { stores, products, orders },
        overLimit: {
          stores: over(stores, plan?.max_stores),
          products: over(products, plan?.max_products),
          orders: over(orders, plan?.max_orders_monthly),
        },
      };
    },
  });
}