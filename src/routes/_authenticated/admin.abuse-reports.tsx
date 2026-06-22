import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield } from "@/components/icon";

export const Route = createFileRoute("/_authenticated/admin/abuse-reports")({
  component: AdminAbuseReportsPage,
});

type AbuseReport = {
  id: string;
  reporter_name: string;
  reporter_email: string;
  target_url: string | null;
  category: string;
  description: string;
  status: string;
  admin_notes: string | null;
  created_at: string;
};

const STATUSES = ["open", "investigating", "resolved", "dismissed"] as const;

function AdminAbuseReportsPage() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data, isLoading, error } = useQuery({
    queryKey: ["abuse-reports", statusFilter],
    queryFn: async () => {
      let q = supabase.from("abuse_reports").select("*").order("created_at", { ascending: false });
      if (statusFilter !== "all") q = q.eq("status", statusFilter);
      const { data, error } = await q;
      if (error) throw error;
      return data as AbuseReport[];
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("abuse_reports").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Status atualizado");
      qc.invalidateQueries({ queryKey: ["abuse-reports"] });
    },
    onError: () => toast.error("Não foi possível atualizar"),
  });

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-14">
        <h1 className="text-2xl font-bold">Acesso restrito</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Você precisa ser admin para visualizar as denúncias. Se você é o responsável pelo Shop2Shops, peça a um operador da plataforma para conceder a role <code>admin</code> à sua conta.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-accent/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-accent ring-1 ring-accent/30">
            <Shield className="h-3 w-3" /> Admin
          </div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Denúncias de abuso</h1>
          <p className="mt-1 text-sm text-muted-foreground">{data?.length ?? 0} denúncias.</p>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Carregando...</p>}

      <div className="space-y-4">
        {(data ?? []).map((r) => (
          <div key={r.id} className="rounded-2xl border border-border/60 bg-card/40 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">{r.reporter_name}</span>
                  <span className="text-xs text-muted-foreground">&lt;{r.reporter_email}&gt;</span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="secondary">{r.category}</Badge>
                  <span>{new Date(r.created_at).toLocaleString("pt-BR")}</span>
                  {r.target_url && (
                    <a href={r.target_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      {r.target_url}
                    </a>
                  )}
                </div>
              </div>
              <Select value={r.status} onValueChange={(v) => updateStatus.mutate({ id: r.id, status: v })}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <p className="mt-3 whitespace-pre-wrap text-sm text-foreground/85">{r.description}</p>
          </div>
        ))}
        {!isLoading && (data ?? []).length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhuma denúncia neste filtro.</p>
        )}
      </div>
    </div>
  );
}