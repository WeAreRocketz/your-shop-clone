import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const RuleSchema = z.object({
  workspace_id: z.string().uuid(),
  store_id: z.string().uuid(),
  metric: z.enum(["orders", "revenue", "items"]),
  time_window: z.enum(["day", "week", "month"]),
  limit_value: z.number().positive().max(1_000_000_000),
  action: z.enum(["rotate", "disable_cart", "rotate_then_disable", "notify_only"]),
  fallback_store_ids: z.array(z.string().uuid()).max(20).default([]),
  enabled: z.boolean().default(true),
});

export const listRotationRules = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ workspace_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: rules, error } = await context.supabase
      .from("store_rotation_rules")
      .select("*")
      .eq("workspace_id", data.workspace_id)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return rules ?? [];
  });

export const upsertRotationRule = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ id: z.string().uuid().optional(), rule: RuleSchema }).parse(d),
  )
  .handler(async ({ data, context }) => {
    if (data.id) {
      const { error } = await context.supabase
        .from("store_rotation_rules")
        .update(data.rule)
        .eq("id", data.id);
      if (error) throw new Error(error.message);
      return { ok: true, id: data.id };
    }
    const { data: row, error } = await context.supabase
      .from("store_rotation_rules")
      .insert(data.rule)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { ok: true, id: row.id };
  });

export const deleteRotationRule = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("store_rotation_rules")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getStoreLimitsStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ store_id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin.rpc("evaluate_store_limits", {
      _store_id: data.store_id,
    });
    if (error) throw new Error(error.message);
    return (rows ?? []) as Array<{
      rule_id: string;
      metric: "orders" | "revenue" | "items";
      time_window: "day" | "week" | "month";
      limit_value: number;
      consumed: number;
      exceeded: boolean;
      action: string;
      fallback_store_ids: string[];
    }>;
  });

export const listRotationEvents = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ workspace_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("store_rotation_events")
      .select("*")
      .eq("workspace_id", data.workspace_id)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const reactivateCart = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ store_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("stores")
      .update({ cart_disabled: false, cart_disabled_reason: null, cart_disabled_at: null })
      .eq("id", data.store_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteRotationEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("store_rotation_events")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const clearRotationEvents = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ workspace_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("store_rotation_events")
      .delete()
      .eq("workspace_id", data.workspace_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });