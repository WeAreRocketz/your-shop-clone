import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data, error } = await ctx.supabase.rpc("has_role", {
    _user_id: ctx.userId,
    _role: "admin",
  });
  if (error || !data) throw new Error("Forbidden");
}

export const setApprovalStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        userId: z.string().uuid(),
        status: z.enum(["approved", "rejected", "pending"]),
        reason: z.string().max(500).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const update: Record<string, unknown> = {
      approval_status: data.status,
      rejection_reason: data.status === "rejected" ? (data.reason ?? null) : null,
    };
    if (data.status === "approved") {
      update.approved_at = new Date().toISOString();
      update.approved_by = context.userId;
    }
    const { error } = await (context.supabase as any)
      .from("profiles")
      .update(update)
      .eq("id", data.userId);
    if (error) throw error;
    return { ok: true };
  });

export const setWorkspacePlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        workspaceId: z.string().uuid(),
        planId: z.string().uuid(),
        notes: z.string().max(1000).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("workspaces")
      .update({ plan_id: data.planId })
      .eq("id", data.workspaceId);
    if (error) throw error;
    return { ok: true };
  });

export const setUserPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        userId: z.string().uuid(),
        planId: z.string().uuid(),
        notes: z.string().max(1000).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const sb = context.supabase as any;

    // Find or create the user's workspace
    const { data: ws, error: wsErr } = await sb
      .from("workspaces")
      .select("id")
      .eq("user_id", data.userId)
      .maybeSingle();
    if (wsErr) throw wsErr;

    let workspaceId = ws?.id as string | undefined;
    if (!workspaceId) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: prof } = await supabaseAdmin
        .from("profiles")
        .select("name, email")
        .eq("id", data.userId)
        .maybeSingle();
      const wsName = (prof?.name as string | null) || (prof?.email as string | null) || "Workspace";
      const { data: created, error: createErr } = await supabaseAdmin
        .from("workspaces")
        .insert({ user_id: data.userId, name: wsName, plan_id: data.planId })
        .select("id")
        .single();
      if (createErr) throw createErr;
      workspaceId = created.id as string;
    }

    const { error } = await sb.rpc("admin_set_workspace_plan", {
      _workspace_id: workspaceId,
      _plan_id: data.planId,
      _notes: data.notes ?? null,
    });
    if (error) throw error;
    return { ok: true, workspaceId };
  });

export const extendTrial = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ workspaceId: z.string().uuid(), days: z.number().int().min(1).max(365) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await (context.supabase as any).rpc("admin_extend_trial", {
      _workspace_id: data.workspaceId,
      _days: data.days,
    });
    if (error) throw error;
    return { ok: true };
  });
