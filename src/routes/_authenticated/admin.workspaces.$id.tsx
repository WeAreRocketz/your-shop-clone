import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { setWorkspacePlan, extendTrial } from "@/lib/api/admin.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft } from "@/components/icon";

export const Route = createFileRoute("/_authenticated/admin/workspaces/$id")({
  component: WorkspaceDetail,
});

function WorkspaceDetail() {
  const { id } = useParams({ from: "/_authenticated/admin/workspaces/$id" });
  const qc = useQueryClient();
  const setPlanFn = useServerFn(setWorkspacePlan);
  const extendFn = useServerFn(extendTrial);

  const { data: ws } = useQuery({
    queryKey: ["admin-workspace", id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("admin_workspace_billing")
        .select("*")
        .eq("workspace_id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: plans } = useQuery({
    queryKey: ["plans"],
    queryFn: async () => {
      const { data } = await supabase.from("plans").select("*").order("price_monthly");
      return data ?? [];
    },
  });

  const [planId, setPlanId] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [days, setDays] = useState<number>(7);

  useEffect(() => {
    if (ws) {
      setPlanId(ws.plan_id ?? "");
      setNotes(ws.plan_notes ?? "");
    }
  }, [ws]);

  const savePlan = useMutation({
    mutationFn: () => setPlanFn({ data: { workspaceId: id, planId, notes } }),
    onSuccess: () => {
      toast.success("Plano atualizado");
      qc.invalidateQueries({ queryKey: ["admin-workspace", id] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Erro"),
  });

  const extend = useMutation({
    mutationFn: () => extendFn({ data: { workspaceId: id, days } }),
    onSuccess: () => {
      toast.success(`Trial estendido em ${days} dias`);
      qc.invalidateQueries({ queryKey: ["admin-workspace", id] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Erro"),
  });

  if (!ws) return <div className="p-6 text-muted-foreground">Carregando…</div>;

  return (
    <div className="p-6 space-y-4 max-w-3xl">
      <Link to="/admin/workspaces" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
      </Link>

      <Card className="p-6 space-y-2">
        <h2 className="text-xl font-bold">{ws.workspace_name}</h2>
        <div className="text-sm text-muted-foreground">
          <div>Owner: {ws.owner_name || ws.owner_email}</div>
          <div>Email: {ws.owner_email}</div>
          <div>Status do cadastro: <strong>{ws.approval_status}</strong></div>
          <div>Plano atual: <strong>{ws.plan_name ?? "—"}</strong></div>
          {ws.trial_ends_at && <div>Trial termina: {new Date(ws.trial_ends_at).toLocaleString("pt-BR")}</div>}
        </div>
      </Card>

      <Card className="p-6 space-y-4">
        <h3 className="font-semibold">Alterar plano</h3>
        <div className="space-y-2">
          <Label>Plano</Label>
          <Select value={planId} onValueChange={setPlanId}>
            <SelectTrigger><SelectValue placeholder="Selecione um plano" /></SelectTrigger>
            <SelectContent>
              {(plans ?? []).map((p: any) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name} — R$ {Number(p.price_monthly).toFixed(2)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Notas administrativas</Label>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Cortesia, contrato custom, etc." />
        </div>
        <Button onClick={() => savePlan.mutate()} disabled={!planId || savePlan.isPending}>
          Salvar plano
        </Button>
      </Card>

      <Card className="p-6 space-y-4">
        <h3 className="font-semibold">Estender trial</h3>
        <div className="flex items-end gap-3">
          <div className="space-y-2">
            <Label>Dias</Label>
            <Input type="number" min={1} max={365} value={days} onChange={(e) => setDays(Number(e.target.value) || 0)} className="w-32" />
          </div>
          <Button variant="outline" onClick={() => extend.mutate()} disabled={!days || extend.isPending}>
            Estender
          </Button>
        </div>
      </Card>
    </div>
  );
}
