import { Link, useLocation } from "@tanstack/react-router";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useWorkspacePlan } from "@/hooks/use-workspace-plan";

export function TrialGate({ children }: { children: React.ReactNode }) {
  const { data } = useWorkspacePlan();
  const location = useLocation();
  const onSettings = location.pathname.startsWith("/dashboard/settings");
  const blocked = !!data?.trialExpired && !onSettings;

  return (
    <>
      <div aria-hidden={blocked} className={blocked ? "pointer-events-none select-none blur-sm" : undefined}>
        {children}
      </div>
      <Dialog open={blocked}>
        <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Seu período grátis acabou</DialogTitle>
            <DialogDescription>
              Os 3 dias de teste do Shop2Shops chegaram ao fim. Escolha um plano para continuar usando a plataforma sem travar conta.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 flex flex-col gap-2">
            <Button asChild className="w-full">
              <Link to="/dashboard/settings">Escolher plano agora</Link>
            </Button>
            <Button asChild variant="ghost" className="w-full">
              <Link to="/">Ver planos no site</Link>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}