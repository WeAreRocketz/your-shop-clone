import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const CheckoutStoreSchema = z.object({
  store_id: z.string().uuid(),
  position: z.number().int().min(0).default(0),
  limit_metric: z.enum(["orders", "revenue"]).nullable().optional(),
  limit_window: z.enum(["day", "week", "month"]).nullable().optional(),
  limit_value: z.number().nonnegative().nullable().optional(),
});

const UpsertSchema = z.object({
  id: z.string().uuid().optional(),
  workspace_id: z.string().uuid(),
  name: z.string().min(1).max(120),
  mode: z.enum(["direct", "warmup", "smart_advance"]).default("direct"),
  vitrine_store_id: z.string().uuid().nullable().optional(),
  cart_template_id: z.string().nullable().optional(),
  current_step: z.number().int().min(1).max(6).default(1),
  warmup_simultaneous: z.boolean().default(false),
  checkout_stores: z.array(CheckoutStoreSchema).max(20).default([]),
});

export const listOperations = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ workspace_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("operations")
      .select("*, operation_checkout_stores(*)")
      .eq("workspace_id", data.workspace_id)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const getOperation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("operations")
      .select("*, operation_checkout_stores(*)")
      .eq("id", data.id)
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const upsertOperation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => UpsertSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { checkout_stores, id, ...op } = data;
    let opId = id;
    if (opId) {
      const { error } = await context.supabase.from("operations").update(op).eq("id", opId);
      if (error) throw new Error(error.message);
    } else {
      const { data: row, error } = await context.supabase
        .from("operations")
        .insert(op)
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      opId = row.id;
    }
    await context.supabase.from("operation_checkout_stores").delete().eq("operation_id", opId);
    if (checkout_stores.length) {
      const { error: insErr } = await context.supabase
        .from("operation_checkout_stores")
        .insert(checkout_stores.map((c) => ({ ...c, operation_id: opId })));
      if (insErr) throw new Error(insErr.message);
    }
    return { id: opId };
  });

export const setOperationStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["draft", "active", "paused", "archived"]),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const patch: { status: typeof data.status; activated_at?: string } = { status: data.status };
    if (data.status === "active") patch.activated_at = new Date().toISOString();
    const { error } = await context.supabase.from("operations").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteOperation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("operations").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });