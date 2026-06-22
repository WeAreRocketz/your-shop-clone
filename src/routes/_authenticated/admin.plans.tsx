import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/_authenticated/admin/plans")({
  component: AdminPlansPage,
});

type Plan = {
  id: string;
  name: string;
  slug: string;
  price_monthly: number | null;
  max_stores: number | null;
  max_products: number | null;
  max_orders_monthly: number | null;
  is_trial: boolean | null;
  trial_days: number | null;
};

function AdminPlansPage() {
  const qc = useQueryClient();
  const { data: plans, isLoading } = useQuery({
    queryKey: ["admin-plans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plans")
        .select("id, name, slug, price_monthly, max_stores, max_products, max_orders_monthly, is_trial, trial_days")
        .order("price_monthly", { ascending: true });
      if (error) throw error;
      return data as Plan[];
    },
  });

  const save = useMutation({
    mutationFn: async (p: Plan) => {
      const { error } = await supabase.from("plans").update({
        name: p.name,
        price_monthly: p.price_monthly as number,
        max_stores: p.max_stores as number,
        max_products: p.max_products as number,
        max_orders_monthly: p.max_orders_monthly as number,
        trial_days: p.trial_days ?? undefined,
      }).eq("id", p.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Plano salvo");
      qc.invalidateQueries({ queryKey: ["admin-plans"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Planos</h1>
      <p className="mt-1 text-sm text-muted-foreground">Edite limites e preços dos planos.</p>

      {isLoading && <p className="mt-6 text-sm text-muted-foreground">Carregando…</p>}

      <div className="mt-6 space-y-4">
        {(plans ?? []).map((p) => (
          <PlanCard key={p.id} plan={p} onSave={(v) => save.mutate(v)} saving={save.isPending} />
        ))}
      </div>
    </div>
  );
}

function PlanCard({ plan, onSave, saving }: { plan: Plan; onSave: (p: Plan) => void; saving: boolean }) {
  const [v, setV] = useState<Plan>(plan);
  return (
    <div className="rounded-2xl border border-border/60 bg-card/40 p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-wide text-muted-foreground">{v.slug}</div>
          <h3 className="text-lg font-semibold">{v.name}</h3>
        </div>
        <Button onClick={() => onSave(v)} disabled={saving}>Salvar</Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Nome" value={v.name} onChange={(s) => setV({ ...v, name: s })} />
        <NumField label="Preço mensal (R$)" value={v.price_monthly} onChange={(n) => setV({ ...v, price_monthly: n })} />
        <LimitField label="Máx. lojas" value={v.max_stores} onChange={(n) => setV({ ...v, max_stores: n })} />
        <LimitField label="Máx. produtos" value={v.max_products} onChange={(n) => setV({ ...v, max_products: n })} />
        <LimitField label="Máx. pedidos/mês" value={v.max_orders_monthly} onChange={(n) => setV({ ...v, max_orders_monthly: n })} />
        {v.is_trial && (
          <NumField label="Dias de trial" value={v.trial_days} onChange={(n) => setV({ ...v, trial_days: n })} />
        )}
      </div>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (s: string) => void }) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function NumField({ label, value, onChange }: { label: string; value: number | null; onChange: (n: number | null) => void }) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <Input
        type="number"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
      />
    </div>
  );
}

function LimitField({ label, value, onChange }: { label: string; value: number | null; onChange: (n: number | null) => void }) {
  const unlimited = value === null;
  return (
    <div>
      <div className="flex items-center justify-between">
        <Label className="text-xs">{label}</Label>
        <label className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <Switch checked={unlimited} onCheckedChange={(c) => onChange(c ? null : 0)} />
          Ilimitado
        </label>
      </div>
      <Input
        type="number"
        disabled={unlimited}
        placeholder={unlimited ? "Ilimitado" : ""}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
      />
    </div>
  );
}