import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "@/components/icon";
import logoAsset from "@/assets/shop2shops-logo.png.asset.json";

export function LegalPage({
  title,
  updatedAt,
  intro,
  children,
}: {
  title: string;
  updatedAt: string;
  intro?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/40">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2">
            <img src={logoAsset.url} alt="Shop2Shops" className="h-8 w-auto object-contain" />
          </Link>
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary">
            <ArrowLeft className="h-4 w-4" /> Voltar ao site
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-14">
        <div className="mb-3 text-xs uppercase tracking-[0.2em] text-primary">Documento legal</div>
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{title}</h1>
        <p className="mt-2 text-xs text-muted-foreground">Última atualização: {updatedAt}</p>
        {intro && <p className="mt-6 text-base leading-relaxed text-muted-foreground">{intro}</p>}

        <article className="legal-prose mt-10 space-y-6 text-sm leading-relaxed text-foreground/85">
          {children}
        </article>

        <div className="mt-14 rounded-2xl border border-border/60 bg-card/40 p-6 text-sm">
          <div className="font-semibold text-foreground">Dúvidas ou solicitações?</div>
          <p className="mt-1 text-muted-foreground">
            Fale com o nosso Encarregado de Dados (DPO) pelo e-mail{" "}
            <a href="mailto:privacidade@shop2shops.com.br" className="text-primary hover:underline">
              privacidade@shop2shops.com.br
            </a>
            . Respondemos em até 15 dias (LGPD) / 30 dias (GDPR).
          </p>
        </div>
      </main>
    </div>
  );
}

export function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold tracking-tight text-foreground">{title}</h2>
      <div className="space-y-2 text-muted-foreground">{children}</div>
    </section>
  );
}