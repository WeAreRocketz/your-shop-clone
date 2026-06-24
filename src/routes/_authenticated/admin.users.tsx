import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { setApprovalStatus, setUserPlan } from "@/lib/api/admin.functions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, Search, Check, X } from "@/components/icon";

export const Route = createFileRoute("/_authenticated/admin/users")({
  component: AdminUsersPage,
});

type Profile = {
  id: string;
  email: string | null;
  name: string | null;
  created_at: string;
  approval_status: "pending" | "approved" | "rejected";
};
type RoleRow = { user_id: string; role: "admin" | "user" };

function AdminUsersPage() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const approveFn = useServerFn(setApprovalStatus);
  const setPlanFn = useServerFn(setUserPlan);

  const { data: profiles, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("profiles")
        .select("id, email, name, created_at, approval_status")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Profile[];
    },
  });

  const { data: roles } = useQuery({
    queryKey: ["admin-roles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("user_id, role");
      if (error) throw error;
      return data as RoleRow[];
    },
  });

  const { data: plans } = useQuery({
    queryKey: ["admin-plans"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("plans")
        .select("id, name, slug")
        .order("price_monthly", { ascending: true });
      if (error) throw error;
      return data as { id: string; name: string; slug: string }[];
    },
  });

  const { data: workspaces } = useQuery({
    queryKey: ["admin-workspaces-by-user"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("workspaces")
        .select("id, user_id, plan_id");
      if (error) throw error;
      return data as { id: string; user_id: string; plan_id: string | null }[];
    },
  });

  const adminSet = useMemo(
    () => new Set((roles ?? []).filter((r) => r.role === "admin").map((r) => r.user_id)),
    [roles],
  );

  const workspaceByUser = useMemo(() => {
    const m = new Map<string, { id: string; plan_id: string | null }>();
    for (const w of workspaces ?? []) m.set(w.user_id, { id: w.id, plan_id: w.plan_id });
    return m;
  }, [workspaces]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return profiles ?? [];
    return (profiles ?? []).filter(
      (p) => (p.email ?? "").toLowerCase().includes(term) || (p.name ?? "").toLowerCase().includes(term),
    );
  }, [q, profiles]);

  const toggleAdmin = useMutation({
    mutationFn: async ({ userId, makeAdmin }: { userId: string; makeAdmin: boolean }) => {
      if (makeAdmin) {
        const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: "admin" });
        if (error) throw error;
      } else {
        const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", "admin");
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Role atualizada");
      qc.invalidateQueries({ queryKey: ["admin-roles"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const approve = useMutation({
    mutationFn: (args: { userId: string; status: "approved" | "rejected" }) =>
      approveFn({ data: args }),
    onSuccess: () => {
      toast.success("Status atualizado");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Erro"),
  });

  const changePlan = useMutation({
    mutationFn: (args: { workspaceId: string; planId: string }) =>
      setPlanFn({ data: args }),
    onSuccess: () => {
      toast.success("Plano atualizado");
      qc.invalidateQueries({ queryKey: ["admin-workspaces-by-user"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Erro ao trocar plano"),
  });

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Usuários</h1>
      <p className="mt-1 text-sm text-muted-foreground">{filtered.length} usuários cadastrados.</p>

      <div className="mt-6 relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome ou email"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-border/60 bg-card/40">
        <table className="w-full text-sm">
          <thead className="bg-white/[0.03] text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Usuário</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Criado</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Plano</th>
              <th className="px-4 py-3 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Carregando…</td></tr>
            )}
            {filtered.map((u) => {
              const isAdmin = adminSet.has(u.id);
              const status = u.approval_status ?? "approved";
              const ws = workspaceByUser.get(u.id);
              return (
                <tr key={u.id} className="border-t border-border/40">
                  <td className="px-4 py-3 font-medium">{u.name || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                  <td className="px-4 py-3 text-muted-foreground">{new Date(u.created_at).toLocaleDateString("pt-BR")}</td>
                  <td className="px-4 py-3">
                    {status === "approved" && <Badge className="bg-emerald-500/15 text-emerald-500 ring-1 ring-emerald-500/30">aprovado</Badge>}
                    {status === "pending" && <Badge className="bg-amber-500/15 text-amber-500 ring-1 ring-amber-500/30">pendente</Badge>}
                    {status === "rejected" && <Badge variant="destructive">rejeitado</Badge>}
                  </td>
                  <td className="px-4 py-3">
                    {isAdmin ? (
                      <Badge className="bg-primary/15 text-primary ring-1 ring-primary/30"><Shield className="mr-1 h-3 w-3" />admin</Badge>
                    ) : (
                      <Badge variant="secondary">user</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {ws ? (
                      <Select
                        value={ws.plan_id ?? ""}
                        onValueChange={(planId) => {
                          if (!planId || planId === ws.plan_id) return;
                          changePlan.mutate({ workspaceId: ws.id, planId });
                        }}
                        disabled={changePlan.isPending || !plans?.length}
                      >
                        <SelectTrigger className="h-8 w-[160px]">
                          <SelectValue placeholder="Selecionar plano" />
                        </SelectTrigger>
                        <SelectContent>
                          {(plans ?? []).map((p) => (
                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className="text-xs text-muted-foreground">sem workspace</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap justify-end gap-2">
                      {status !== "approved" && (
                        <Button size="sm" variant="outline" onClick={() => approve.mutate({ userId: u.id, status: "approved" })} disabled={approve.isPending}>
                          <Check className="h-3 w-3 mr-1" /> Aprovar
                        </Button>
                      )}
                      {status !== "rejected" && (
                        <Button size="sm" variant="outline" onClick={() => approve.mutate({ userId: u.id, status: "rejected" })} disabled={approve.isPending}>
                          <X className="h-3 w-3 mr-1" /> Rejeitar
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant={isAdmin ? "outline" : "default"}
                        onClick={() => toggleAdmin.mutate({ userId: u.id, makeAdmin: !isAdmin })}
                        disabled={toggleAdmin.isPending}
                      >
                        {isAdmin ? "Remover admin" : "Tornar admin"}
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {!isLoading && filtered.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Nenhum usuário encontrado.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
