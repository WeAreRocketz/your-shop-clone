import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { setApprovalStatus } from "@/lib/api/admin.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Check, X, UserCheck } from "@/components/icon";

export const Route = createFileRoute("/_authenticated/admin/approvals")({
  component: AdminApprovalsPage,
});

type Status = "pending" | "approved" | "rejected";
type Row = {
  id: string;
  email: string;
  name: string | null;
  created_at: string;
  approval_status: Status;
  rejection_reason: string | null;
};

function AdminApprovalsPage() {
  const [status, setStatus] = useState<Status>("pending");
  const [search, setSearch] = useState("");
  const qc = useQueryClient();
  const approveFn = useServerFn(setApprovalStatus);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-approvals", status],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("profiles")
        .select("id, email, name, created_at, approval_status, rejection_reason")
        .eq("approval_status", status)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Row[];
    },
  });

  const mut = useMutation({
    mutationFn: (args: { userId: string; status: Status; reason?: string }) =>
      approveFn({ data: args }),
    onSuccess: (_, vars) => {
      toast.success(vars.status === "approved" ? "Cadastro aprovado" : vars.status === "rejected" ? "Cadastro rejeitado" : "Status atualizado");
      qc.invalidateQueries({ queryKey: ["admin-approvals"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Erro"),
  });

  const filtered = (data ?? []).filter(
    (r) =>
      !search ||
      r.email.toLowerCase().includes(search.toLowerCase()) ||
      (r.name ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <Tabs value={status} onValueChange={(v) => setStatus(v as Status)}>
          <TabsList>
            <TabsTrigger value="pending">Pendentes</TabsTrigger>
            <TabsTrigger value="approved">Aprovados</TabsTrigger>
            <TabsTrigger value="rejected">Rejeitados</TabsTrigger>
          </TabsList>
        </Tabs>
        <Input
          placeholder="Buscar por email ou nome…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs ml-auto"
        />
      </div>

      <div className="rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left">
            <tr>
              <th className="px-4 py-2 font-medium">Usuário</th>
              <th className="px-4 py-2 font-medium">Email</th>
              <th className="px-4 py-2 font-medium">Cadastro</th>
              <th className="px-4 py-2 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">Carregando…</td></tr>
            )}
            {!isLoading && filtered.length === 0 && (
              <tr><td colSpan={4} className="p-10 text-center text-muted-foreground">
                <UserCheck className="mx-auto h-8 w-8 mb-2 opacity-50" />
                Nenhum cadastro {status === "pending" ? "pendente" : status === "approved" ? "aprovado" : "rejeitado"}.
              </td></tr>
            )}
            {filtered.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="px-4 py-2">{r.name || <span className="text-muted-foreground">—</span>}</td>
                <td className="px-4 py-2">{r.email}</td>
                <td className="px-4 py-2 text-muted-foreground">{new Date(r.created_at).toLocaleString("pt-BR")}</td>
                <td className="px-4 py-2">
                  <div className="flex justify-end gap-2">
                    {status !== "approved" && (
                      <Button
                        size="sm"
                        onClick={() => mut.mutate({ userId: r.id, status: "approved" })}
                        disabled={mut.isPending}
                      >
                        <Check className="h-4 w-4 mr-1" /> Aprovar
                      </Button>
                    )}
                    {status !== "rejected" && (
                      <RejectButton onConfirm={(reason) => mut.mutate({ userId: r.id, status: "rejected", reason })} />
                    )}
                  </div>
                  {r.rejection_reason && status === "rejected" && (
                    <div className="text-xs text-muted-foreground mt-1 text-right">Motivo: {r.rejection_reason}</div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RejectButton({ onConfirm }: { onConfirm: (reason: string) => void }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="destructive"><X className="h-4 w-4 mr-1" /> Rejeitar</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Rejeitar cadastro</DialogTitle></DialogHeader>
        <Textarea
          placeholder="Motivo da rejeição (opcional, visível para o usuário)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button variant="destructive" onClick={() => { onConfirm(reason); setOpen(false); setReason(""); }}>
            Confirmar rejeição
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
