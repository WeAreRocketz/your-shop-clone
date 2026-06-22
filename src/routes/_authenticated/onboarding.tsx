import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Store, Sparkles, ArrowRight, Check } from "@/components/icon";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({ meta: [{ title: "Bem-vindo — Shop2Shops" }] }),
  component: Onboarding,
});

function Onboarding() {
  const navigate = useNavigate();
  const { user } = Route.useRouteContext();
  const [step, setStep] = useState(1);
  const [workspaceName, setWorkspaceName] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleCreateWorkspace() {
    if (!workspaceName.trim()) {
      toast.error("Dê um nome ao seu workspace");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("workspaces").insert({ user_id: user.id, name: workspaceName });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setStep(2);
  }

  return (
    <div className="gradient-hero flex min-h-screen items-center justify-center px-6 py-12">
      <div className="w-full max-w-2xl">
        <div className="mb-8 flex items-center justify-center gap-2">
          {[1, 2, 3].map((n) => (
            <div key={n} className="flex items-center">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${step >= n ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                {step > n ? <Check className="h-4 w-4" /> : n}
              </div>
              {n < 3 && <div className={`h-px w-12 ${step > n ? "bg-primary" : "bg-border"}`} />}
            </div>
          ))}
        </div>

        <Card className="border-border/60 bg-card p-10">
          {step === 1 && (
            <>
              <h1 className="text-2xl font-semibold">Crie seu workspace</h1>
              <p className="mt-1 text-sm text-muted-foreground">Um workspace agrupa todas as suas lojas e configurações.</p>
              <div className="mt-6 space-y-2">
                <Label htmlFor="ws">Nome do workspace</Label>
                <Input id="ws" value={workspaceName} onChange={(e) => setWorkspaceName(e.target.value)} placeholder="Ex: Minha Operação" />
              </div>
              <Button className="mt-6 w-full" onClick={handleCreateWorkspace} disabled={saving}>
                {saving ? "Criando..." : <>Continuar <ArrowRight className="ml-2 h-4 w-4" /></>}
              </Button>
            </>
          )}

          {step === 2 && (
            <>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Store className="h-6 w-6" />
              </div>
              <h1 className="mt-4 text-2xl font-semibold">Conecte sua Loja Vitrine</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                A <strong className="text-foreground">Loja Vitrine</strong> é onde seus clientes navegam, descobrem produtos e adicionam ao carrinho. Ela recebe todo o tráfego, mas não fecha pedidos — eles são redirecionados para as Lojas de Checkout.
              </p>
              <div className="mt-6 flex gap-3">
                <Button variant="outline" onClick={() => setStep(1)}>Voltar</Button>
                <Button className="flex-1" onClick={() => toast.info("A conexão com Shopify será habilitada no próximo passo do desenvolvimento.")}>
                  Conectar Loja Vitrine
                </Button>
                <Button variant="ghost" onClick={() => setStep(3)}>Pular</Button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10 text-accent">
                <Sparkles className="h-6 w-6" />
              </div>
              <h1 className="mt-4 text-2xl font-semibold">Tudo pronto!</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Seu workspace está configurado. Agora você pode acessar o dashboard para conectar mais lojas, mapear produtos e ativar a distribuição.
              </p>
              <Button className="mt-6 w-full" onClick={() => navigate({ to: "/dashboard" })}>
                Ir para o Dashboard <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
