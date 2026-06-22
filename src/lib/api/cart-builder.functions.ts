import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { installScriptTag, uninstallScriptTag } from "@/lib/api/cart.functions";

export const getCartDrawerConfig = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ storeId: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("cart_drawer_configs")
      .select("config, published_at")
      .eq("store_id", data.storeId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return { config: (row?.config as any) ?? null, publishedAt: row?.published_at ?? null };
  });

export const saveCartDrawerConfig = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({
    storeId: z.string().uuid(),
    workspaceId: z.string().uuid(),
    config: z.record(z.string(), z.any()),
  }))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("cart_drawer_configs")
      .upsert({
        store_id: data.storeId,
        workspace_id: data.workspaceId,
        config: data.config,
      }, { onConflict: "store_id" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const publishCartDrawerConfig = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({
    storeId: z.string().uuid(),
    workspaceId: z.string().uuid(),
    config: z.record(z.string(), z.any()),
  }))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("cart_drawer_configs")
      .upsert({
        store_id: data.storeId,
        workspace_id: data.workspaceId,
        config: data.config,
        published_at: new Date().toISOString(),
      }, { onConflict: "store_id" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* -------- Model-based fns (new flow) -------- */

const LayoutSchema = z.enum(["drawer", "page"]);

export const listCartConfigs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ workspaceId: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("cart_drawer_configs")
      .select("id, name, layout, store_id, published_at, updated_at, stores(display_name, shopify_domain)")
      .eq("workspace_id", data.workspaceId)
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { items: rows ?? [] };
  });

export const createCartConfig = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({
    workspaceId: z.string().uuid(),
    name: z.string().min(1).max(120),
    layout: LayoutSchema,
  }))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("cart_drawer_configs")
      .insert({
        workspace_id: data.workspaceId,
        name: data.name,
        layout: data.layout,
        store_id: null,
        config: {},
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id as string };
  });

export const deleteCartConfig = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("cart_drawer_configs").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const duplicateCartConfig = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    const { data: src, error } = await context.supabase
      .from("cart_drawer_configs")
      .select("workspace_id, name, layout, config")
      .eq("id", data.id).single();
    if (error || !src) throw new Error(error?.message ?? "Carrinho não encontrado");
    const { data: row, error: insErr } = await context.supabase
      .from("cart_drawer_configs")
      .insert({
        workspace_id: src.workspace_id,
        name: `${src.name} (cópia)`,
        layout: src.layout,
        config: src.config ?? {},
        store_id: null,
      })
      .select("id").single();
    if (insErr) throw new Error(insErr.message);
    return { id: row.id as string };
  });

export const getCartConfigById = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("cart_drawer_configs")
      .select("id, name, layout, store_id, workspace_id, config, published_at, stores(display_name, shopify_domain)")
      .eq("id", data.id).single();
    if (error || !row) throw new Error(error?.message ?? "Carrinho não encontrado");
    return row;
  });

export const saveCartConfigById = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({
    id: z.string().uuid(),
    name: z.string().min(1).max(120).optional(),
    config: z.record(z.string(), z.any()),
  }))
  .handler(async ({ data, context }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const patch: any = { config: data.config };
    if (data.name) patch.name = data.name;
    const { error } = await context.supabase
      .from("cart_drawer_configs").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const publishCartConfigById = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({
    id: z.string().uuid(),
    config: z.record(z.string(), z.any()),
  }))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("cart_drawer_configs")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update({ config: data.config as any, published_at: new Date().toISOString() })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const assignCartToStore = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ id: z.string().uuid(), storeId: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    // Unassign any other cart currently bound to this store
    const { error: clrErr } = await context.supabase
      .from("cart_drawer_configs")
      .update({ store_id: null })
      .eq("store_id", data.storeId)
      .neq("id", data.id);
    if (clrErr) throw new Error(clrErr.message);
    const { error } = await context.supabase
      .from("cart_drawer_configs")
      .update({ store_id: data.storeId })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    // Install the script on the target store
    await installScriptTag({ data: { storeId: data.storeId } });
    return { ok: true };
  });

export const unassignCartFromStore = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    const { data: row } = await context.supabase
      .from("cart_drawer_configs").select("store_id").eq("id", data.id).maybeSingle();
    const { error } = await context.supabase
      .from("cart_drawer_configs")
      .update({ store_id: null })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    if (row?.store_id) {
      try { await uninstallScriptTag({ data: { storeId: row.store_id } }); } catch { /* best-effort */ }
    }
    return { ok: true };
  });