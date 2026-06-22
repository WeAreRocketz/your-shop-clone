import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/s2s-settings")({
  server: {
    handlers: {
      OPTIONS: async () =>
        new Response(null, {
          status: 204,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
          },
        }),
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const workspaceId = url.searchParams.get("workspace_id");
        const headers = {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "public, max-age=60",
        };
        if (!workspaceId) return new Response(JSON.stringify({}), { headers });
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data } = await supabaseAdmin
          .from("workspaces")
          .select("settings")
          .eq("id", workspaceId)
          .maybeSingle();
        return new Response(JSON.stringify(data?.settings ?? {}), { headers });
      },
    },
  },
});