import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Store,
  Package,
  Shuffle,
  ShoppingCart,
  BarChart3,
  Tag,
  Wand2,
  Receipt,
  Activity,
  Settings,
  Mail,
  Sparkles,
  Target,
  Zap,
} from "@/components/icon";
import logoAsset from "@/assets/shop2shops-logo.png.asset.json";

import shotOnboarding from "@/assets/tutorial/onboarding.png.asset.json";
import shotStores from "@/assets/tutorial/stores.png.asset.json";
import shotProducts from "@/assets/tutorial/products.png.asset.json";
import shotDistribution from "@/assets/tutorial/distribution.png.asset.json";
import shotCart from "@/assets/tutorial/cart.png.asset.json";
import shotBulk from "@/assets/tutorial/bulk-edit.png.asset.json";
import shotCamuflador from "@/assets/tutorial/camuflador.png.asset.json";
import shotAnalytics from "@/assets/tutorial/analytics.png.asset.json";
import shotTracking from "@/assets/tutorial/tracking.png.asset.json";
import shotFinance from "@/assets/tutorial/finance.png.asset.json";
import shotSettings from "@/assets/tutorial/settings.png.asset.json";
import shotSupport from "@/assets/tutorial/support.png.asset.json";

export const Route = createFileRoute("/tutorial")({
  head: () => ({
    meta: [
      { title: "Tutorial Shop2Shops — Aprende rápido, escala mais rápido" },
      {
        name: "description",
        content:
          "Tour rápido por todas as features do Shop2Shops. Direto, visual e sem enrolação.",
      },
      { property: "og:title", content: "Tutorial Shop2Shops" },
      {
        property: "og:description",
        content: "Aprenda todas as features em minutos. Curto, visual, direto.",
      },
    ],
  }),
  component: TutorialPage,
});

type Section = {
  id: string;
  label: string;
  icon: typeof Zap;
  tag: string;
  title: string;
  tldr: string;
  steps: string[];
  shot: string;
};

const sections: Section[] = [
  {
    id: "comecar",
    label: "Começar",
    icon: Zap,
    tag: "30 segundos",
    title: "Cria a conta e bora",
    tldr: "Cadastro grátis por 14 dias. Sem cartão. Você loga e cai direto no onboarding.",
    steps: [
      "Clica em Criar conta no topo.",
      "Confirma o email (chega na hora).",
      "Onboarding te guia pelo essencial em 2 min.",
    ],
    shot: shotOnboarding.url,
  },
  {
    id: "lojas",
    label: "Lojas",
    icon: Store,
    tag: "Shopify ready",
    title: "Conecta suas Shopifys",
    tldr: "Plug uma loja Cavala e quantas lojas vitrines quiser. OAuth direto, zero código.",
    steps: [
      "Vai em Dashboard → Lojas.",
      "Cola o domínio .myshopify.com.",
      "Autoriza o app — pronto, tá sincronizada.",
    ],
    shot: shotStores.url,
  },
  {
    id: "produtos",
    label: "Produtos",
    icon: Package,
    tag: "Clone 1-click",
    title: "Clona produtos entre lojas",
    tldr: "Seleciona, clica, replicou. Imagens, variantes, SKU — vai tudo junto.",
    steps: [
      "Dashboard → Produtos.",
      "Marca os produtos da Cavala.",
      "Clica Clonar para → escolhe as vitrines.",
    ],
    shot: shotProducts.url,
  },
  {
    id: "distribuicao",
    label: "Distribuição",
    icon: Shuffle,
    tag: "Auto-rotation",
    title: "Rotaciona vendas entre lojas",
    tldr: "Define a fatia de cada vitrine. O sistema distribui o checkout sozinho.",
    steps: [
      "Dashboard → Distribuição.",
      "Arrasta os sliders por loja.",
      "Salva. Roda no piloto automático.",
    ],
    shot: shotDistribution.url,
  },
  {
    id: "carrinho",
    label: "Cart Builder",
    icon: ShoppingCart,
    tag: "Drag & drop",
    title: "Monta o carrinho que converte",
    tldr: "Editor visual com upsell, cupom, frete grátis, timer. Tudo sem código.",
    steps: [
      "Dashboard → Carrinho.",
      "Arrasta os blocos (upsell, badge, timer).",
      "Preview em tempo real → Publicar.",
    ],
    shot: shotCart.url,
  },
  {
    id: "bulk",
    label: "Bulk edit",
    icon: Tag,
    tag: "Em massa",
    title: "Edita 1000 produtos de uma vez",
    tldr: "Mexe preço, tag, coleção, descrição. Filtra, aplica regra, manda ver.",
    steps: [
      "Dashboard → Edição em massa.",
      "Filtra (coleção, tag, preço).",
      "Escolhe a regra → Aplicar.",
    ],
    shot: shotBulk.url,
  },
  {
    id: "camuflador",
    label: "Camuflador",
    icon: Wand2,
    tag: "Anti-banimento",
    title: "Camufla o que precisa",
    tldr: "Reescreve títulos e descrições pra fugir de filtro do Meta. Bot trabalhando por você.",
    steps: [
      "Dashboard → Camuflador.",
      "Seleciona produtos sensíveis.",
      "Clica Camuflar → revisa → salva.",
    ],
    shot: shotCamuflador.url,
  },
  {
    id: "analytics",
    label: "Analytics",
    icon: BarChart3,
    tag: "Real-time",
    title: "Vê o que tá vendendo",
    tldr: "Faturamento, ticket médio, conversão por loja. Sem precisar de planilha.",
    steps: [
      "Dashboard → Analytics.",
      "Filtra período e loja.",
      "Compara, exporta, escala o que tá quente.",
    ],
    shot: shotAnalytics.url,
  },
  {
    id: "tracking",
    label: "Tracking",
    icon: Activity,
    tag: "Pixel server-side",
    title: "Conecta seus pixels",
    tldr: "Meta, Google, TikTok via API de Conversão. Eventos batem 100%.",
    steps: [
      "Dashboard → Tracking.",
      "Cola o token de cada plataforma.",
      "Testa o evento de compra → tudo verde.",
    ],
    shot: shotTracking.url,
  },
  {
    id: "financeiro",
    label: "Financeiro",
    icon: Receipt,
    tag: "Sem surpresa",
    title: "Acompanha plano e cobranças",
    tldr: "Vê seu plano, próxima cobrança e troca quando quiser.",
    steps: [
      "Dashboard → Financeiro.",
      "Vê plano atual + invoices.",
      "Upgrade/downgrade em 1 clique.",
    ],
    shot: shotFinance.url,
  },
  {
    id: "config",
    label: "Settings",
    icon: Settings,
    tag: "5 min",
    title: "Ajusta sua workspace",
    tldr: "Convida time, troca senha, configura notificações.",
    steps: [
      "Dashboard → Configurações.",
      "Convida por email.",
      "Define permissões e pronto.",
    ],
    shot: shotSettings.url,
  },
  {
    id: "suporte",
    label: "Suporte",
    icon: Mail,
    tag: "Resposta rápida",
    title: "Travou? Chama a gente",
    tldr: "Chat de ticket dentro do dashboard. Resposta sempre que possível em horário comercial.",
    steps: [
      "Dashboard → Suporte.",
      "Abre ticket com print + descrição.",
      "Acompanha as respostas no painel.",
    ],
    shot: shotSupport.url,
  },
];

function TutorialPage() {
  const [active, setActive] = useState(sections[0].id);
  const refs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: "-30% 0px -55% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] }
    );
    Object.values(refs.current).forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    refs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2">
            <img src={logoAsset.url} alt="Shop2Shops" className="h-10 w-auto" />
          </Link>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link to="/login">Entrar</Link>
            </Button>
            <Button asChild size="sm" className="btn-holo group h-9 rounded-lg px-4 font-semibold">
              <Link to="/signup">
                Começar grátis
                <ArrowRight className="ml-1.5 h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="border-b border-border/50 bg-gradient-to-b from-primary/5 to-transparent">
        <div className="mx-auto max-w-6xl px-6 py-16 md:py-20">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-xs text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Tutorial • 5 min de leitura
          </div>
          <h1 className="mt-5 text-4xl font-bold leading-[1.05] tracking-[-0.03em] md:text-6xl">
            Aprende rápido.
            <br />
            <span className="text-gradient-brand">Escala mais rápido.</span>
          </h1>
          <p className="mt-4 max-w-2xl text-base text-muted-foreground md:text-lg">
            Tour visual por tudo que dá pra fazer no Shop2Shops. Curto, direto e sem
            mimimi.
          </p>
        </div>
      </section>

      {/* Body */}
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-12 md:grid-cols-[220px_1fr]">
        {/* Menu */}
        <aside className="md:sticky md:top-24 md:self-start">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Índice
          </p>
          <nav className="flex flex-col gap-1">
            {sections.map((s) => {
              const Icon = s.icon;
              const isActive = active === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => scrollTo(s.id)}
                  className={`group flex items-center gap-2.5 rounded-lg border px-3 py-2 text-left text-sm transition-all ${
                    isActive
                      ? "border-primary/40 bg-primary/10 text-foreground"
                      : "border-transparent text-muted-foreground hover:border-border hover:bg-white/[0.03] hover:text-foreground"
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 transition-colors ${
                      isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                    }`}
                  />
                  <span className="font-medium">{s.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Sections */}
        <main className="flex flex-col gap-16">
          {sections.map((s, i) => {
            const Icon = s.icon;
            return (
              <section
                key={s.id}
                id={s.id}
                ref={(el) => {
                  refs.current[s.id] = el;
                }}
                className="scroll-mt-24"
              >
                <div className="mb-4 flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/20">
                    <Icon className="h-4.5 w-4.5 text-primary" />
                  </span>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">
                      #{String(i + 1).padStart(2, "0")} • {s.tag}
                    </p>
                    <h2 className="text-2xl font-bold leading-tight tracking-[-0.02em] md:text-3xl">
                      {s.title}
                    </h2>
                  </div>
                </div>

                <p className="mb-5 max-w-2xl text-base text-muted-foreground">
                  <span className="font-semibold text-foreground">TL;DR: </span>
                  {s.tldr}
                </p>

                <div className="grid gap-5 md:grid-cols-2">
                  <ol className="flex flex-col gap-2.5 rounded-2xl border border-border/60 bg-white/[0.02] p-5">
                    {s.steps.map((step, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-sm">
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[11px] font-bold text-primary">
                          {idx + 1}
                        </span>
                        <span className="text-foreground/90">{step}</span>
                      </li>
                    ))}
                  </ol>

                  <a
                    href={s.shot}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group/shot block overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-white/[0.04] to-transparent p-2 shadow-2xl transition hover:border-primary/40"
                  >
                    <div className="mb-2 flex items-center gap-1.5 px-2 pt-1">
                      <span className="h-2.5 w-2.5 rounded-full bg-red-500/60" />
                      <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/60" />
                      <span className="h-2.5 w-2.5 rounded-full bg-green-500/60" />
                      <span className="ml-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                        print real • clica pra ampliar
                      </span>
                    </div>
                    <img
                      src={s.shot}
                      alt={`Print da tela: ${s.title}`}
                      loading="lazy"
                      className="aspect-[16/10] w-full rounded-lg object-cover object-top transition group-hover/shot:scale-[1.01]"
                    />
                  </a>
                </div>
              </section>
            );
          })}

          {/* CTA */}
          <section className="mt-4 overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-8 text-center">
            <Target className="mx-auto mb-3 h-8 w-8 text-primary" />
            <h3 className="text-2xl font-bold tracking-[-0.02em] md:text-3xl">
              Chega de tour. Bora escalar.
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              14 dias grátis, sem cartão. Cancela quando quiser.
            </p>
            <Button asChild size="lg" className="btn-holo group mt-5 h-12 rounded-xl px-7 font-semibold">
              <Link to="/signup">
                Criar minha conta
                <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </Button>
          </section>
        </main>
      </div>
    </div>
  );
}
