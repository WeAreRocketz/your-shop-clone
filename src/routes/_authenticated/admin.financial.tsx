import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Receipt, TrendingUp, Users, Crown } from "@/components/icon";

export const Route = createFileRoute("/_authenticated/admin/financial")({
  component: AdminFinancialPage,
});

type PlanRow = {
  plan_id: string;
  plan_name: string;
  price_monthly: number;
  is_trial: boolean;
  workspace_count: number;
  mrr: number;
};

function fmt(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function AdminFinancialPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-financial"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("admin_financial_overview")
        .select("*");
      if (error) throw error;
      return (data ?? []) as PlanRow[];
    },
  });

  const rows = data ?? [];
  const totalMRR = rows.filter((r) => !r.is_trial).reduce((acc, r) => acc + Number(r.mrr ?? 0), 0);
  const totalWorkspaces = rows.reduce((acc, r) => acc + Number(r.workspace_count ?? 0), 0);
  const trialCount = rows.filter((r) => r.is_trial).reduce((acc, r) => acc + Number(r.workspace_count ?? 0), 0);
  const paidCount = totalWorkspaces - trialCount;

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Stat label="MRR" value={fmt(totalMRR)} icon={<Receipt className="h-5 w-5 text-primary" />} />
        <Stat label="Workspaces" value={String(totalWorkspaces)} icon={<Users className="h-5 w-5 text-primary" />} />
        <Stat label="Assinantes pagos" value={String(paidCount)} icon={<TrendingUp className="h-5 w-5 text-primary" />} />
        <Stat label="Em trial" value={String(trialCount)} icon={<Crown className="h-5 w-5 text-primary" />} />
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="font-semibold">Receita por plano</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left">
            <tr>
              <th className="px-4 py-2 font-medium">Plano</th>
              <th className="px-4 py-2 font-medium">Preço</th>
              <th className="px-4 py-2 font-medium">Workspaces</th>
              <th className="px-4 py-2 font-medium text-right">MRR</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">Carregando…</td></tr>}
            {rows.map((r) => (
              <tr key={r.plan_id} className="border-t">
                <td className="px-4 py-2">
                  {r.plan_name}
                  {r.is_trial && <span className="ml-2 text-xs text-muted-foreground">(trial)</span>}
                </td>
                <td className="px-4 py-2">{fmt(Number(r.price_monthly))}</td>
                <td className="px-4 py-2">{r.workspace_count}</td>
                <td className="px-4 py-2 text-right font-medium">{fmt(Number(r.mrr))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function Stat({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <Card className="p-4 flex items-center gap-3">
      <div className="h-10 w-10 rounded-md bg-primary/10 grid place-items-center">{icon}</div>
      <div>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-xl font-bold">{value}</div>
      </div>
    </Card>
  );
}
