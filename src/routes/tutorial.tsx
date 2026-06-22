import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ReactElement } from "react";
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
  Check,
  Target,
  Zap,
} from "@/components/icon";
import logoAsset from "@/assets/shop2shops-logo.png.asset.json";

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
  preview: () => ReactElement;
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
    preview: () => <PreviewOnboarding />,
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
    preview: () => (
      <PreviewGrid
        items={[
          { label: "Loja Cavala", sub: "principal • sync ON", tone: "primary" },
          { label: "Vitrine 01", sub: "BR • ativa", tone: "ok" },
          { label: "Vitrine 02", sub: "BR • ativa", tone: "ok" },
          { label: "Vitrine 03", sub: "EU • testando", tone: "warn" },
        ]}
      />
    ),
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
    preview: () => <PreviewProducts />,
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
    preview: () => <PreviewDistribution />,
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
    preview: () => <PreviewCart />,
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
    preview: () => <PreviewBulk />,
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
    preview: () => <PreviewCamuflador />,
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
    preview: () => <PreviewAnalytics />,
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
    preview: () => <PreviewTracking />,
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
    preview: () => <PreviewFinance />,
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
    preview: () => <PreviewSettings />,
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
    preview: () => <PreviewSupport />,
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

                  <div className="overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-white/[0.04] to-transparent p-4">
                    <div className="mb-3 flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-red-500/60" />
                      <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/60" />
                      <span className="h-2.5 w-2.5 rounded-full bg-green-500/60" />
                      <span className="ml-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                        preview
                      </span>
                    </div>
                    <div className="min-h-[180px]">{s.preview()}</div>
                  </div>
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

/* ---------- Preview mocks (estilizados, sem screenshot real) ---------- */

function PreviewOnboarding() {
  const steps = ["Conta", "Loja", "Pixel", "Bora!"];
  return (
    <div className="flex flex-col gap-3">
      {steps.map((s, i) => (
        <div
          key={s}
          className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-sm ${
            i < 3
              ? "border-primary/30 bg-primary/5 text-foreground"
              : "border-border/60 bg-white/[0.02] text-muted-foreground"
          }`}
        >
          <span
            className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
              i < 3 ? "bg-primary text-primary-foreground" : "bg-white/10 text-muted-foreground"
            }`}
          >
            {i < 3 ? <Check className="h-3 w-3" /> : i + 1}
          </span>
          {s}
        </div>
      ))}
    </div>
  );
}

function PreviewGrid({
  items,
}: {
  items: { label: string; sub: string; tone: "primary" | "ok" | "warn" }[];
}) {
  const tones = {
    primary: "border-primary/30 bg-primary/10",
    ok: "border-emerald-500/30 bg-emerald-500/5",
    warn: "border-amber-500/30 bg-amber-500/5",
  };
  return (
    <div className="grid grid-cols-2 gap-2">
      {items.map((it) => (
        <div key={it.label} className={`rounded-lg border p-3 text-xs ${tones[it.tone]}`}>
          <div className="flex items-center gap-1.5 font-semibold text-foreground">
            <Store className="h-3.5 w-3.5" />
            {it.label}
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground">{it.sub}</div>
        </div>
      ))}
    </div>
  );
}

function PreviewProducts() {
  return (
    <div className="flex flex-col gap-2">
      {["Camiseta Oversized", "Calça Cargo Drop", "Tênis Chunky 22"].map((p, i) => (
        <div
          key={p}
          className="flex items-center gap-3 rounded-lg border border-border/60 bg-white/[0.02] p-2.5"
        >
          <span className="h-9 w-9 rounded-md bg-gradient-to-br from-primary/30 to-primary/5" />
          <div className="flex-1 text-xs">
            <div className="font-semibold text-foreground">{p}</div>
            <div className="text-muted-foreground">3 variantes • R$ {99 + i * 30},00</div>
          </div>
          <span className="rounded-md bg-primary/15 px-2 py-1 text-[10px] font-bold uppercase text-primary">
            Clonar
          </span>
        </div>
      ))}
    </div>
  );
}

function PreviewDistribution() {
  const rows = [
    { name: "Vitrine 01", pct: 50 },
    { name: "Vitrine 02", pct: 30 },
    { name: "Vitrine 03", pct: 20 },
  ];
  return (
    <div className="flex flex-col gap-3">
      {rows.map((r) => (
        <div key={r.name}>
          <div className="mb-1 flex justify-between text-xs">
            <span className="font-semibold text-foreground">{r.name}</span>
            <span className="text-muted-foreground">{r.pct}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-primary/60"
              style={{ width: `${r.pct}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function PreviewCart() {
  return (
    <div className="flex flex-col gap-2 text-xs">
      {[
        { icon: ShoppingCart, label: "Item no carrinho" },
        { icon: Zap, label: "Upsell — Leve 2 pague 1" },
        { icon: Tag, label: "Cupom DROP15" },
        { icon: Target, label: "Frete grátis acima R$ 199" },
      ].map((row) => (
        <div
          key={row.label}
          className="flex items-center gap-2.5 rounded-lg border border-border/60 bg-white/[0.02] p-2.5"
        >
          <row.icon className="h-3.5 w-3.5 text-primary" />
          <span className="font-medium text-foreground">{row.label}</span>
        </div>
      ))}
    </div>
  );
}

function PreviewBulk() {
  return (
    <div className="flex flex-col gap-2 text-xs">
      <div className="rounded-lg border border-border/60 bg-white/[0.02] p-2.5">
        <div className="text-muted-foreground">Filtro</div>
        <div className="mt-1 font-semibold text-foreground">coleção = Verão & preço &lt; 100</div>
      </div>
      <div className="rounded-lg border border-primary/30 bg-primary/5 p-2.5">
        <div className="text-muted-foreground">Regra</div>
        <div className="mt-1 font-semibold text-foreground">aumentar preço em +15%</div>
      </div>
      <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-2.5 text-center font-semibold text-emerald-300">
        342 produtos afetados
      </div>
    </div>
  );
}

function PreviewCamuflador() {
  return (
    <div className="flex flex-col gap-2 text-xs">
      <div className="rounded-lg border border-border/60 bg-white/[0.02] p-2.5">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Antes</div>
        <div className="mt-0.5 line-through text-muted-foreground">Camiseta Original Premium</div>
      </div>
      <div className="rounded-lg border border-primary/30 bg-primary/5 p-2.5">
        <div className="text-[10px] uppercase tracking-wider text-primary">Depois</div>
        <div className="mt-0.5 font-semibold text-foreground">C4m1s3ta 0riginal Pr3mium ✨</div>
      </div>
    </div>
  );
}

function PreviewAnalytics() {
  const bars = [40, 70, 55, 90, 65, 100, 80];
  return (
    <div>
      <div className="mb-2 flex items-end justify-between text-xs">
        <div>
          <div className="text-muted-foreground">Faturamento 7d</div>
          <div className="text-lg font-bold text-foreground">R$ 142.380</div>
        </div>
        <span className="rounded-md bg-emerald-500/15 px-2 py-1 text-[10px] font-bold text-emerald-300">
          +24%
        </span>
      </div>
      <div className="flex h-20 items-end gap-1.5">
        {bars.map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-t bg-gradient-to-t from-primary/30 to-primary"
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
    </div>
  );
}

function PreviewTracking() {
  return (
    <div className="flex flex-col gap-2 text-xs">
      {[
        { name: "Meta Pixel", status: "OK" },
        { name: "Google Ads", status: "OK" },
        { name: "TikTok Pixel", status: "OK" },
      ].map((r) => (
        <div
          key={r.name}
          className="flex items-center justify-between rounded-lg border border-border/60 bg-white/[0.02] px-3 py-2"
        >
          <span className="font-medium text-foreground">{r.name}</span>
          <span className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-300">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            {r.status}
          </span>
        </div>
      ))}
    </div>
  );
}

function PreviewFinance() {
  return (
    <div className="flex flex-col gap-2 text-xs">
      <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
        <div className="text-[10px] uppercase tracking-wider text-primary">Plano atual</div>
        <div className="mt-0.5 text-lg font-bold text-foreground">Pro</div>
        <div className="text-muted-foreground">Próxima cobrança em 12 dias</div>
      </div>
      <div className="rounded-lg border border-border/60 bg-white/[0.02] p-3 text-muted-foreground">
        Último pagamento: <span className="font-semibold text-foreground">R$ 297,00</span>
      </div>
    </div>
  );
}

function PreviewSettings() {
  return (
    <div className="flex flex-col gap-2 text-xs">
      {["Workspace", "Time & permissões", "Notificações", "Segurança"].map((s) => (
        <div
          key={s}
          className="flex items-center justify-between rounded-lg border border-border/60 bg-white/[0.02] px-3 py-2"
        >
          <span className="font-medium text-foreground">{s}</span>
          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
      ))}
    </div>
  );
}

function PreviewSupport() {
  return (
    <div className="flex flex-col gap-2 text-xs">
      <div className="self-start max-w-[80%] rounded-2xl rounded-bl-sm bg-white/[0.05] px-3 py-2 text-foreground">
        Oi! Meu pixel não tá batendo evento de compra 😬
      </div>
      <div className="self-end max-w-[80%] rounded-2xl rounded-br-sm bg-primary/15 px-3 py-2 text-foreground">
        Suave. Manda print do erro que já vou olhar 👀
      </div>
    </div>
  );
}
