import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Settings } from "@/components/icon";

export const Route = createFileRoute("/_authenticated/admin/workspaces")({
  component: AdminWorkspacesPage,
});

type Workspace = {
  id: string;
  name: string;
  user_id: string;
  plan_id: string | null;
  trial_ends_at: string | null;
  created_at: string;
};
type Plan = { id: string; name: string; slug: string };
type Profile = { id: string; email: string | null; name: string | null };

function AdminWorkspacesPage() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");

  const { data: workspaces, isLoading } = useQuery({
    queryKey: ["admin-workspaces"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workspaces")
        .select("id, name, user_id, plan_id, trial_ends_at, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Workspace[];
    },
  });

  const { data: plans } = useQuery({
    queryKey: ["admin-plans-list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("plans").select("id, name, slug").order("price_monthly");
      if (error) throw error;
      return data as Plan[];
    },
  });

  const { data: profiles } = useQuery({
    queryKey: ["admin-profiles-min"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("id, email, name");
      if (error) throw error;
      return data as Profile[];
    },
  });

  const profileMap = useMemo(() => new Map((profiles ?? []).map((p) => [p.id, p])), [profiles]);
  const planMap = useMemo(() => new Map((plans ?? []).map((p) => [p.id, p])), [plans]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return workspaces ?? [];
    return (workspaces ?? []).filter((w) => {
      const owner = profileMap.get(w.user_id);
      return (
        w.name.toLowerCase().includes(term) ||
        (owner?.email ?? "").toLowerCase().includes(term)
      );
    });
  }, [q, workspaces, profileMap]);

  const updatePlan = useMutation({
    mutationFn: async ({ id, planId }: { id: string; planId: string }) => {
      const { error } = await supabase.from("workspaces").update({ plan_id: planId }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Plano atualizado");
      qc.invalidateQueries({ queryKey: ["admin-workspaces"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Workspaces</h1>
      <p className="mt-1 text-sm text-muted-foreground">{filtered.length} workspaces.</p>

      <div className="mt-6 relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Buscar por nome ou email" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-border/60 bg-card/40">
        <table className="w-full text-sm">
          <thead className="bg-white/[0.03] text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Workspace</th>
              <th className="px-4 py-3 font-medium">Dono</th>
              <th className="px-4 py-3 font-medium">Trial expira</th>
              <th className="px-4 py-3 font-medium">Plano</th>
              <th className="px-4 py-3 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Carregando…</td></tr>
            )}
            {filtered.map((w) => {
              const owner = profileMap.get(w.user_id);
              const plan = w.plan_id ? planMap.get(w.plan_id) : null;
              return (
                <tr key={w.id} className="border-t border-border/40">
                  <td className="px-4 py-3 font-medium">{w.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {owner?.name ?? "—"}<br />
                    <span className="text-xs">{owner?.email}</span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {w.trial_ends_at ? new Date(w.trial_ends_at).toLocaleString("pt-BR") : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Select value={plan?.id ?? ""} onValueChange={(v) => updatePlan.mutate({ id: w.id, planId: v })}>
                      <SelectTrigger className="w-48"><SelectValue placeholder="Atribuir plano" /></SelectTrigger>
                      <SelectContent>
                        {(plans ?? []).map((p) => (
                          <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button asChild size="sm" variant="outline">
                      <Link to="/admin/workspaces/$id" params={{ id: w.id }}>
                        <Settings className="h-3 w-3 mr-1" /> Detalhes
                      </Link>
                    </Button>
                  </td>
                </tr>
              );
            })}
            {!isLoading && filtered.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Nenhum workspace.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}