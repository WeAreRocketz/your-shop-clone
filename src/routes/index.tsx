import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Store, ShoppingCart, Shuffle, RefreshCw, Check, ArrowRight, Sparkles, Crown, Zap, Target, BarChart3, Activity, Wand2, Globe, Tag, Shield, FileText, Mail, Cookie, Users, Scale, Server, UserCheck } from "@/components/icon";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import iconAsset from "@/assets/shop2shops-icon.png.asset.json";
import { motion, useMotionValue, useTransform, useSpring, useScroll } from "framer-motion";
import { useRef, useState } from "react";
import logoAsset from "@/assets/shop2shops-logo.png.asset.json";
import { HeroAnimation } from "@/components/hero-animation";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Shop2Shops — Pare de perder venda. Escale sem medo." },
      { name: "description", content: "Multiplique seu faturamento sem travar conta. Quem escala sério usa Shop2Shops." },
      { property: "og:title", content: "Shop2Shops" },
      { property: "og:description", content: "Multiplique faturamento sem travar conta. A arma de quem escala de verdade." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="h-screen snap-y snap-mandatory overflow-y-scroll scroll-smooth bg-background text-foreground [scroll-padding-top:5rem]">
      <Header />
      <div className="snap-start relative">
        <Hero />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 translate-y-1/2">
          <div className="pointer-events-auto">
            <StatsStrip />
          </div>
        </div>
      </div>
      <div className="snap-start"><InteractiveFeatures /></div>
      <div className="snap-start"><DistributionPlayground /></div>
      <div className="snap-start"><PowerFeatures /></div>
      <div className="snap-start"><Pricing /></div>
      <div className="snap-start"><FAQ /></div>
      <div className="snap-start"><Footer /></div>
    </div>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-lg">
      <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2 text-lg font-bold">
          <img src={logoAsset.url} alt="Shop2Shops" className="h-14 w-auto" />
        </Link>
        <nav className="hidden gap-8 text-sm text-muted-foreground md:flex">
          <a href="#features" className="hover:text-foreground">Por que Shop2Shops</a>
          <a href="#pricing" className="hover:text-foreground">Planos</a>
        </nav>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm" className="text-muted-foreground hover:bg-white/[0.04] hover:text-foreground">
            <Link to="/login">Entrar</Link>
          </Button>
          <Button asChild size="sm" className="btn-holo group h-9 rounded-lg px-4 font-semibold">
            <Link to="/signup">
              Quero escalar agora
              <ArrowRight className="ml-1.5 h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="gradient-hero grain spotlight relative flex min-h-[calc(100vh-5rem)] items-center overflow-hidden">
      <div className="light-orb left-[-10%] top-[10%] h-[480px] w-[480px]" />
      <div className="light-orb right-[-5%] bottom-[-10%] h-[420px] w-[420px] opacity-30" style={{ animationDelay: "-6s" }} />
      <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-10 px-6 py-10 md:grid-cols-2 md:gap-12 md:py-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="text-left"
        >
          <div className="mb-8 inline-flex items-center gap-2.5 rounded-full border border-white/[0.08] bg-white/[0.03] py-1.5 pl-1.5 pr-4 text-xs text-white backdrop-blur-xl">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/15 ring-1 ring-primary/30">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary shadow-[0_0_8px_var(--color-primary)]" />
            </span>
            <span className="tracking-wide">Loja Cavala, Loja Vitrine, Método 2 Shopify — chame do que quiser</span>
          </div>
          <h1 className="text-balance text-4xl font-bold leading-[1.02] tracking-[-0.03em] md:text-6xl">
            Sem enrolação,<br />
            <span className="text-gradient-brand">você já sabe o que a gente faz!</span>
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
            Talvez só não saiba que a gente faz melhor que todos os concorrentes.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-4">
            <Button asChild size="lg" className="btn-holo group h-12 rounded-xl px-7 text-base font-semibold">
              <Link to="/signup">
                Começar grátis por 14 dias
                <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="ghost" className="btn-neon h-12 rounded-xl px-7 text-base font-semibold">
              <a href="#pricing">Ver quanto custa</a>
            </Button>
          </div>
          <div className="mt-7 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex -space-x-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-primary/80" />
              <span className="h-1.5 w-1.5 rounded-full bg-primary/50" />
              <span className="h-1.5 w-1.5 rounded-full bg-primary/25" />
            </span>
            Sem cartão. Sem compromisso. Sem desculpa.
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="glass-card relative overflow-hidden p-2"
        >
          <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-2.5">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
              <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
              <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
            </div>
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">S2S · Live</span>
          </div>
          <div className="rounded-xl bg-black/20 p-2">
            <HeroAnimation />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function InteractiveFeatures() {
  const features = [
    { i: Store, t: "Uma marca. Várias lojas trabalhando.", d: "Seu cliente vê uma loja só. Por trás, várias contas faturando em paralelo — sem ele desconfiar de nada." },
    { i: ShoppingCart, t: "Carrinho que vende mais", d: "Adeus checkout engessado da Shopify. Um carrinho redondo, rápido e desenhado pra converter — instalado em 2 minutos." },
    { i: Shuffle, t: "Pedido sempre cai onde dá dinheiro", d: "Conta nova? Conta madura? Conta na trave? A gente manda o pedido pra loja certa. Você nunca mais perde venda por bloqueio." },
    { i: RefreshCw, t: "Pare de duplicar produto na mão", d: "Cadastra uma vez, vai pra todas. Mapeamento automático, por tag ou IA. Seu time volta a vender — não a copiar e colar." },
  ];
  return (
    <section id="features" className="grain spotlight relative flex min-h-[calc(100vh-5rem)] items-center overflow-hidden border-t border-border/40 bg-card/20 py-12">
      <div className="grid-texture pointer-events-none absolute inset-0 opacity-40" />
      <div className="light-orb left-1/2 top-0 h-[500px] w-[500px] -translate-x-1/2 opacity-25" />
      <div className="relative z-10 mx-auto max-w-6xl px-6">
        <div className="mb-8 max-w-2xl">
          <div className="mb-4 text-xs uppercase tracking-[0.2em] text-accent">Por que Shop2Shops</div>
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Cada recurso existe pra <span className="text-gradient-brand">tirar dinheiro do bolso do seu concorrente</span>.
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">Passa o mouse. Sente o que vai estar do seu lado.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {features.map((f) => <TiltCard key={f.t} {...f} />)}
        </div>
      </div>
    </section>
  );
}

function TiltCard({ i: Icon, t, d }: { i: typeof Store; t: string; d: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [8, -8]), { stiffness: 200, damping: 20 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-8, 8]), { stiffness: 200, damping: 20 });
  const background = useTransform(
    [x, y],
    ([gx, gy]: number[]) =>
      `radial-gradient(400px circle at ${(gx + 0.5) * 100}% ${(gy + 0.5) * 100}%, color-mix(in oklab, var(--color-primary) 22%, transparent), transparent 60%)`,
  );

  return (
    <motion.div
      ref={ref}
      onMouseMove={(e) => {
        const r = ref.current!.getBoundingClientRect();
        x.set((e.clientX - r.left) / r.width - 0.5);
        y.set((e.clientY - r.top) / r.height - 0.5);
      }}
      onMouseLeave={() => { x.set(0); y.set(0); }}
      style={{ rotateX, rotateY, transformPerspective: 1000 }}
      className="glass-card group overflow-hidden p-6"
    >
      <motion.div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100"
        style={{ background }}
      />
      <div className="relative">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/30">
          <Icon className="h-6 w-6" />
        </div>
        <h3 className="mt-4 text-lg font-semibold">{t}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{d}</p>
      </div>
    </motion.div>
  );
}

function DistributionPlayground() {
  const [weights, setWeights] = useState([50, 30, 20]);
  // Monochrome brand triad — derived from --color-primary so tones stay on-brand
  const colors = [
    "oklch(0.92 0.24 130)", // primary
    "oklch(0.84 0.22 138)", // deeper lime
    "oklch(0.96 0.18 122)", // pale highlight
  ];
  const total = weights.reduce((a, b) => a + b, 0);

  const update = (idx: number, val: number) => {
    const next = [...weights];
    next[idx] = val;
    setWeights(next);
  };

  // 3D mouse-parallax for the stage
  const stageRef = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rX = useSpring(useTransform(my, [-1, 1], [6, -6]), { stiffness: 80, damping: 18 });
  const rY = useSpring(useTransform(mx, [-1, 1], [-8, 8]), { stiffness: 80, damping: 18 });

  const handleMove = (e: React.MouseEvent) => {
    const r = stageRef.current?.getBoundingClientRect();
    if (!r) return;
    mx.set(((e.clientX - r.left) / r.width) * 2 - 1);
    my.set(((e.clientY - r.top) / r.height) * 2 - 1);
  };
  const handleLeave = () => { mx.set(0); my.set(0); };

  return (
    <section className="grain relative flex min-h-[calc(100vh-5rem)] items-center overflow-hidden border-t border-border/40 py-12">
      {/* Perspective floor grid — Apple Vision-style */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[55%] opacity-[0.18]"
        style={{
          perspective: "900px",
          maskImage: "linear-gradient(to top, black 30%, transparent 95%)",
          WebkitMaskImage: "linear-gradient(to top, black 30%, transparent 95%)",
        }}
        aria-hidden
      >
        <div
          className="absolute inset-x-[-20%] bottom-0 h-[120%]"
          style={{
            transform: "rotateX(64deg)",
            transformOrigin: "center bottom",
            backgroundImage:
              "linear-gradient(to right, color-mix(in oklab, var(--color-primary) 60%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in oklab, var(--color-primary) 60%, transparent) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />
      </div>
      <div className="light-orb right-[-15%] top-[10%] h-[520px] w-[520px] opacity-25" />
      <div className="light-orb left-[-10%] bottom-[-10%] h-[400px] w-[400px] opacity-15" style={{ animationDelay: "-4s" }} />

      <div className="relative z-10 mx-auto max-w-7xl px-6">
        {/* Centered header */}
        <div className="mx-auto mb-10 max-w-3xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.32em] text-primary">
            <span className="h-px w-6 bg-primary/60" />
            Você no controle
            <span className="h-px w-6 bg-primary/60" />
          </div>
          <h2 className="text-balance text-3xl font-bold leading-[1.05] tracking-[-0.035em] md:text-[2.75rem]">
            Mexa nos sliders.{" "}
            <span className="text-gradient-brand">É exatamente assim que o seu dinheiro vai entrar.</span>
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
            Decide quanto cada loja recebe — a gente entrega, pedido a pedido. Conta nova esquenta no ritmo certo. Conta forte fatura no talo.
          </p>
        </div>

        {/* 3D stage */}
        <motion.div
          ref={stageRef}
          onMouseMove={handleMove}
          onMouseLeave={handleLeave}
          className="relative"
          style={{ perspective: 1400 }}
        >
          <motion.div
            className="grid items-stretch gap-6 md:grid-cols-2"
            style={{ rotateX: rX, rotateY: rY, transformStyle: "preserve-3d" }}
          >
            {/* Controls card */}
            <div
              className="relative flex h-[420px] w-full flex-col overflow-hidden rounded-[20px] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.015))] p-8 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl"
              style={{ transform: "translateZ(30px)" }}
            >
              {/* Specular top edge */}
              <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
              <div className="mb-6 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                <span className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary shadow-[0_0_8px_var(--color-primary)]" />
                  Distribuição ao vivo
                </span>
                <span className="font-mono text-primary/80">{total}%</span>
              </div>
              <div className="flex flex-1 flex-col justify-around gap-6">
                {weights.map((w, i) => {
                  const pct = Math.round((w / total) * 100);
                  return (
                    <div key={i}>
                      <div className="mb-2.5 flex items-end justify-between">
                        <span className="flex items-center gap-2.5 text-sm">
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ background: colors[i], boxShadow: `0 0 12px ${colors[i]}` }}
                          />
                          <span className="font-medium tracking-[-0.01em]">Loja {i + 1}</span>
                        </span>
                        <span
                          className="font-mono text-base font-semibold tabular-nums tracking-tight"
                          style={{ color: colors[i] }}
                        >
                          {pct}<span className="text-muted-foreground/60">%</span>
                        </span>
                      </div>
                      <input
                        type="range" min={0} max={100} value={w}
                        onChange={(e) => update(i, Number(e.target.value))}
                        className="s2s-range"
                        style={
                          {
                            ["--val" as string]: `${w}%`,
                            ["--track-fill" as string]: colors[i],
                          } as React.CSSProperties
                        }
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Flow card */}
            <div style={{ transform: "translateZ(60px)" }}>
              <OrderFlow weights={weights} colors={colors} />
            </div>
          </motion.div>

          {/* Floor reflection */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-6 top-full mt-2 h-24 scale-y-[-1] opacity-[0.18]"
            style={{
              background: "radial-gradient(ellipse at top, color-mix(in oklab, var(--color-primary) 25%, transparent), transparent 70%)",
              maskImage: "linear-gradient(to bottom, black, transparent)",
              WebkitMaskImage: "linear-gradient(to bottom, black, transparent)",
            }}
          />
        </motion.div>
      </div>
    </section>
  );
}

function OrderFlow({ weights, colors }: { weights: number[]; colors: string[] }) {
  const total = weights.reduce((a, b) => a + b, 0);
  const pcts = weights.map((w) => (w / total) * 100);
  // Evenly-spaced order sequence so pills never overlap mid-flight
  const COUNT = 8;
  const CYCLE = 6; // seconds, total loop duration
  const orders = Array.from({ length: COUNT }, (_, k) => {
    // Route by weighted random (stable per k)
    let r = ((k * 37) % 100);
    let acc = 0;
    let target = 0;
    for (let i = 0; i < pcts.length; i++) {
      acc += pcts[i];
      if (r < acc) { target = i; break; }
    }
    const delay = (k * CYCLE) / COUNT;
    return { k, target, delay };
  });

  // Column anchors (% from left) — must match the 3-col grid centers
  const colX = [50 / 3, 50, 100 - 50 / 3]; // ~16.67, 50, 83.33
  const hubX = 50;
  const hubY = 18; // % — center of the "Carrinho S2S" badge
  const dropY = 62; // % — pills fade out here, just above store cards

  return (
    <div
      className="relative h-[420px] w-full overflow-hidden rounded-[20px] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.015))] p-8 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl"
    >
      <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
      {/* Ambient top glow */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-[radial-gradient(ellipse_at_top,color-mix(in_oklab,var(--color-primary)_22%,transparent),transparent_70%)]" />

      {/* Fan-out routing lines */}
      <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
        <defs>
          <linearGradient id="of-line" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.5" />
            <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0.05" />
          </linearGradient>
        </defs>
        {colX.map((x, i) => (
          <path
            key={i}
            d={`M ${hubX} ${hubY} C ${hubX} ${(hubY + dropY) / 2}, ${x} ${(hubY + dropY) / 2}, ${x} ${dropY + 8}`}
            fill="none"
            stroke="url(#of-line)"
            strokeWidth="0.4"
            strokeDasharray="1.2 1.6"
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>

      {/* Hub */}
      <div className="absolute left-1/2 top-[10%] -translate-x-1/2">
        <div className="relative">
          <div className="absolute inset-0 -z-10 rounded-full bg-primary/30 blur-xl" />
          <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-medium text-primary backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_8px_var(--color-primary)]" />
            Carrinho S2S
          </div>
        </div>
      </div>

      {/* Store cards */}
      <div className="absolute inset-x-6 bottom-6 grid grid-cols-3 gap-3">
        {weights.map((_, i) => (
          <div
            key={i}
            className="relative rounded-xl border p-3 text-center backdrop-blur-md transition-colors"
            style={{
              borderColor: `color-mix(in oklab, ${colors[i]} 35%, transparent)`,
              background: `linear-gradient(to bottom, color-mix(in oklab, ${colors[i]} 8%, transparent), transparent)`,
              boxShadow: `0 0 24px -8px color-mix(in oklab, ${colors[i]} 50%, transparent)`,
            }}
          >
            <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Loja {i + 1}
            </div>
            <div className="mt-1 font-mono text-lg font-semibold tabular-nums" style={{ color: colors[i] }}>
              {Math.round(pcts[i])}%
            </div>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/[0.06]">
              <motion.div
                className="h-full"
                style={{ background: colors[i], boxShadow: `0 0 8px ${colors[i]}` }}
                animate={{ width: `${pcts[i]}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Animated order pills traveling hub → store */}
      {orders.map(({ k, target, delay }) => {
        const targetX = colX[target];
        return (
          <motion.div
            key={`${k}-${target}-${weights.join("-")}`}
            initial={{ left: `${hubX}%`, top: `${hubY}%`, opacity: 0, scale: 0.5 }}
            animate={{
              left: [`${hubX}%`, `${hubX}%`, `${targetX}%`, `${targetX}%`],
              top: [`${hubY}%`, `${hubY + 6}%`, `${dropY - 4}%`, `${dropY}%`],
              opacity: [0, 1, 1, 0],
              scale: [0.5, 1, 1, 0.85],
            }}
            transition={{
              duration: 1.8,
              times: [0, 0.15, 0.85, 1],
              delay,
              repeat: Infinity,
              repeatDelay: CYCLE - 1.8,
              ease: [0.4, 0, 0.2, 1],
            }}
            className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full px-2 py-[3px] text-[10px] font-bold tabular-nums text-background"
            style={{
              background: colors[target],
              boxShadow: `0 4px 12px -2px color-mix(in oklab, ${colors[target]} 55%, transparent), 0 0 0 1px color-mix(in oklab, ${colors[target]} 30%, transparent)`,
            }}
          >
            #{1000 + k}
          </motion.div>
        );
      })}
    </div>
  );
}

function StatsStrip() {
  const stats = [
    { v: "+R$40Mi", l: "já processados pelos nossos clientes" },
    { v: "47+", l: "clientes protegidos" },
    { v: "117+", l: "lojas escalando em paralelo" },
    { v: "3 dias", l: "grátis pra testar sem cartão" },
  ];

  return (
    <section className="relative">
      <div className="relative mx-auto max-w-6xl px-6">
        <div className="glass-card grid grid-cols-2 divide-x divide-white/[0.06] overflow-hidden rounded-2xl shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)] md:grid-cols-4 md:divide-y-0">
          {stats.map((s, i) => (
            <motion.div
              key={s.l}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="relative p-8"
            >
              <div className="text-gradient-brand text-4xl font-bold tracking-[-0.03em] tabular-nums md:text-5xl">
                {s.v}
              </div>
              <div className="mt-2 text-sm leading-snug text-muted-foreground">{s.l}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { n: "01", t: "Conecte suas lojas", d: "Adicione sua Loja Vitrine e quantas Lojas de Checkout quiser." },
    { n: "02", t: "Mapeie os produtos", d: "Manual, por tag, por IA ou automático — você escolhe." },
    { n: "03", t: "Ative o carrinho", d: "Injetamos o carrinho proprietário e começamos a distribuir pedidos." },
  ];
  return (
    <section id="how" className="border-t border-border/40 py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-16 text-center">
          <h2 className="text-4xl font-bold tracking-tight">Como funciona</h2>
          <p className="mt-3 text-muted-foreground">Três passos para começar a distribuir pedidos.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {steps.map((s) => (
            <Card key={s.n} className="border-border/60 bg-card p-8">
              <div className="font-mono text-sm text-accent">{s.n}</div>
              <h3 className="mt-4 text-xl font-semibold">{s.t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.d}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function Features() {
  const items = [
    { i: Store, t: "Loja Vitrine", d: "A loja que recebe todo o tráfego, onde os clientes navegam e adicionam produtos ao carrinho." },
    { i: ShoppingCart, t: "Carrinho Proprietário", d: "Painel lateral flutuante injetado via Script Tag — totalmente customizado, sem checkout nativo." },
    { i: Shuffle, t: "Distribuição Inteligente", d: "Rotação, peso percentual, regras ou análise por IA. Você define como os pedidos são distribuídos." },
    { i: RefreshCw, t: "Sincronização de Produtos", d: "Mapeamento manual, por tag, por IA ou totalmente automático entre todas as lojas." },
  ];
  return (
    <section id="features" className="border-t border-border/40 bg-card/30 py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-16 text-center">
          <h2 className="text-4xl font-bold tracking-tight">Construído para escalar com segurança</h2>
          <p className="mt-3 text-muted-foreground">Cada recurso pensado para proteger suas contas novas.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {items.map(({ i: Icon, t, d }) => (
            <Card key={t} className="border-border/60 bg-card p-8">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 text-xl font-semibold">{t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{d}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  const plans = [
    {
      name: "ScalaFofo",
      slug: "scalafofo",
      tagline: "Pra quem tá começando a escalar",
      icon: Sparkles,
      price: "R$197",
      oldPrice: "R$297",
      promoBadge: "Promo de lançamento",
      period: "/mês",
      features: ["1 Loja Vitrine", "2 Lojas Checkout", "Carrinho proprietário S2S", "Suporte por chat"],
      cta: "Começar a faturar",
    },
    {
      name: "ScalaForte",
      slug: "scalaforte",
      tagline: "Pro player sério",
      icon: Zap,
      price: "R$447",
      period: "/mês",
      features: ["3 Lojas Vitrine", "3 Lojas Checkout por Vitrine", "Total de 12 lojas operando", "Distribuição inteligente por IA", "Suporte prioritário"],
      cta: "Quero crescer",
      highlight: true,
    },
    {
      name: "ScalaZord",
      slug: "scalazord",
      tagline: "Pra quem joga pra dominar",
      icon: Crown,
      price: "R$997",
      period: "/mês",
      features: ["Lojas Vitrine ilimitadas", "Lojas Checkout ilimitadas por Vitrine", "Sem teto. Sem freio.", "Gerente de conta dedicado", "Onboarding 1:1 com o time"],
      cta: "Escalar sem limite",
    },
  ];
  return (
    <section id="pricing" className="grain surface-gradient relative flex min-h-[calc(100vh-5rem)] items-center overflow-hidden border-t border-border/40 py-12">
      <div className="light-orb left-1/2 top-1/3 h-[600px] w-[600px] -translate-x-1/2 opacity-20" />
      <div className="relative mx-auto max-w-6xl px-6">
        <div className="mb-8 max-w-2xl">
          <div className="mb-4 text-xs font-medium uppercase tracking-[0.25em] text-primary">Planos</div>
          <h2 className="text-balance text-3xl font-bold leading-[1.05] tracking-[-0.025em] md:text-4xl">
            Quanto custa <span className="text-gradient-brand">parar de perder venda?</span>
          </h2>
          <p className="mt-3 text-base text-muted-foreground">Menos que uma conta travada. Muito menos.</p>
        </div>
        <div className="mx-auto grid max-w-5xl gap-5 md:grid-cols-3 md:items-stretch">
          {plans.map((p) => {
            const Icon = p.icon;
            return (
              <div
                key={p.name}
                className={`glass-card relative flex flex-col p-6 ${
                  p.highlight
                    ? "border-primary/40 shadow-[0_0_80px_-20px_oklch(0.92_0.24_130/0.55)] md:-translate-y-3 md:scale-[1.02]"
                    : ""
                }`}
              >
                {p.highlight && (
                  <>
                    <div className="pointer-events-none absolute inset-0 rounded-[1.25rem] bg-gradient-to-b from-primary/[0.08] to-transparent" />
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-primary-foreground shadow-[0_0_24px_-4px_oklch(0.92_0.24_130/0.6)]">
                      Mais popular
                    </div>
                  </>
                )}
                <div className="relative">
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-xl ring-1 ${
                      p.highlight
                        ? "bg-primary/15 text-primary ring-primary/40"
                        : "bg-white/[0.04] text-foreground/80 ring-white/[0.06]"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold tracking-tight">{p.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{p.tagline}</p>
                  <div className="mt-4 flex items-baseline gap-2">
                    {p.oldPrice && (
                      <span className="text-base font-medium text-muted-foreground line-through tabular-nums">{p.oldPrice}</span>
                    )}
                    <span className="text-4xl font-bold tracking-[-0.03em] tabular-nums">{p.price}</span>
                    <span className="text-sm text-muted-foreground">{p.period}</span>
                  </div>
                  {p.promoBadge && (
                    <div className="mt-2 inline-flex items-center rounded-full bg-accent/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-accent ring-1 ring-accent/30">
                      {p.promoBadge}
                    </div>
                  )}
                  <div className="hairline my-4" />
                  <ul className="flex-1 space-y-2.5">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-start gap-3 text-[13px] leading-snug">
                        <span
                          className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
                            p.highlight ? "bg-primary/20 text-primary" : "bg-white/[0.05] text-foreground/70"
                          }`}
                        >
                          <Check className="h-3 w-3" />
                        </span>
                        <span className="text-foreground/85">{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    asChild
                    className={`mt-6 h-11 w-full rounded-xl font-semibold ${
                      p.highlight ? "btn-holo" : "btn-neon"
                    }`}
                  >
                    <Link to="/signup" search={{ plan: p.slug }}>{p.cta}</Link>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          3 dias grátis no plano ScalaFofo. Cancele quando quiser, sem letra miúda.
        </p>
      </div>
    </section>
  );
}

function PowerFeatures() {
  const items = [
    { i: Target, t: "Camuflador de domínio", d: "O cliente enxerga sempre sua marca. Por trás, o pedido cai em qualquer uma das suas contas — sem URL estranha, sem desconfiança." },
    { i: Activity, t: "Tracking UTM ponta-a-ponta", d: "UTMs preservadas do anúncio até o pedido pago, mesmo trocando de loja no meio do caminho. Sem dado perdido, sem campanha cega." },
    { i: BarChart3, t: "Pixels server-side", d: "Meta CAPI, TikTok Events API, Google Ads e GA4 disparados do servidor. iOS, AdBlock e cookie de terceiros deixam de ser problema." },
    { i: Wand2, t: "Mapeamento por IA", d: "A IA olha título, imagem e descrição e casa o mesmo produto entre lojas diferentes. Você não cadastra duas vezes — nunca mais." },
    { i: Globe, t: "Anti-bloqueio inteligente", d: "Saúde de cada conta monitorada em tempo real. Conta cansada sai da rotação sozinha, conta nova entra quando tá pronta." },
    { i: Tag , t: "Regras + peso + IA", d: "Distribua por percentual, por tag de produto, por país do cliente — ou deixe a IA escolher a loja com maior chance de aprovar." },
  ];
  return (
    <section className="grain spotlight relative flex min-h-[calc(100vh-5rem)] items-center overflow-hidden border-t border-border/40 bg-card/20 py-16">
      <div className="grid-texture pointer-events-none absolute inset-0 opacity-30" />
      <div className="light-orb right-[-10%] top-[20%] h-[460px] w-[460px] opacity-25" />
      <div className="relative z-10 mx-auto max-w-6xl px-6">
        <div className="mb-12 max-w-2xl">
          <div className="mb-4 text-xs uppercase tracking-[0.2em] text-accent">O arsenal completo</div>
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Tudo que você precisa pra <span className="text-gradient-brand">escalar sem ser pego</span>.
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Camuflador, tracking, IA, anti-bloqueio. Os recursos que separam quem fatura de quem fica reclamando de bloqueio.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((f) => <TiltCard key={f.t} {...f} />)}
        </div>
      </div>
    </section>
  );
}

function FAQ() {
  const faqs = [
    { q: "Preciso de conhecimento técnico pra instalar?", a: "Não. A instalação é via Script Tag — cola um código no tema da sua loja e pronto. Em 2 minutos tá rodando. Se travar, a gente instala junto com você no onboarding." },
    { q: "A Shopify pode bloquear minha conta usando Shop2Shops?", a: "O Shop2Shops foi desenhado pra justamente evitar isso. Camuflador de domínio, distribuição inteligente e monitoramento de saúde de conta protegem suas lojas. Quem usa errado é que tem problema — não a ferramenta." },
    { q: "Funciona com qualquer tema da Shopify?", a: "Sim. O carrinho proprietário é injetado por cima do tema, sem mexer no código. Funciona em tema gratuito, pago, custom — qualquer um." },
    { q: "Os pixels (Meta, TikTok, GA4) continuam funcionando?", a: "Sim, e melhor. Disparamos server-side via CAPI / Events API, então você ganha precisão mesmo com iOS 17, AdBlock e cookie de terceiros bloqueado." },
    { q: "Quantas lojas posso conectar?", a: "Depende do plano. ScalaFofo: 1 vitrine + 2 checkouts. ScalaForte: 3 vitrines com até 12 lojas operando. Planos maiores sob demanda." },
    { q: "Posso cancelar quando quiser?", a: "Sim. Sem fidelidade, sem multa, sem letra miúda. Cancelou, parou de cobrar no próximo ciclo." },
  ];
  return (
    <section id="faq" className="relative overflow-hidden border-t border-border/40 py-20">
      <div className="light-orb left-[-10%] bottom-0 h-[420px] w-[420px] opacity-20" />
      <div className="relative z-10 mx-auto max-w-7xl px-6">
        <div className="mb-10 text-center">
          <div className="mb-3 text-xs uppercase tracking-[0.2em] text-accent">Perguntas frequentes</div>
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Sem enrolação. Sem letra miúda.</h2>
          <p className="mt-3 text-sm text-muted-foreground">As perguntas que todo mundo faz antes de assinar.</p>
        </div>
        <Accordion type="single" collapsible className="mx-auto w-full rounded-2xl border border-border/60 bg-card/40 px-8 backdrop-blur">
          {faqs.map((f, idx) => (
            <AccordionItem key={idx} value={`item-${idx}`} className="border-border/40 last:border-0">
              <AccordionTrigger className="py-5 text-left text-base font-semibold hover:no-underline">
                {f.q}
              </AccordionTrigger>
              <AccordionContent className="pb-5 text-sm leading-relaxed text-muted-foreground">
                {f.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-border/40 pt-16 pb-8">
      <div className="light-orb left-1/2 top-full h-[400px] w-[700px] -translate-x-1/2 -translate-y-1/2 opacity-15" />
      <div className="relative mx-auto max-w-7xl px-6">
        {/* Top: brand + columns */}
        <div className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-4">
            <div className="flex items-center gap-2">
              <img src={logoAsset.url} alt="Shop2Shops" className="h-10 w-auto object-contain" />
            </div>
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">
              Plataforma de distribuição de checkout e camuflagem de operação para e-commerces que escalam.
            </p>
            <div className="mt-6 text-xs text-muted-foreground">
              <div className="font-semibold text-foreground">Controlador de Dados</div>
              <div className="mt-1">Shop2Shops Tecnologia Ltda.</div>
              <a href="mailto:privacidade@shop2shops.com.br" className="mt-3 flex items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-primary">
                <Mail className="h-3.5 w-3.5" />
                privacidade@shop2shops.com.br
              </a>
            </div>
          </div>

          <div className="md:col-span-2">
            <h4 className="text-sm font-semibold text-foreground">Produto</h4>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              <li><a href="#features" className="transition-colors hover:text-primary">Funcionalidades</a></li>
              <li><a href="#pricing" className="transition-colors hover:text-primary">Preços</a></li>
              <li><Link to="/login" className="transition-colors hover:text-primary">Entrar</Link></li>
              <li><Link to="/signup" className="transition-colors hover:text-primary">Criar conta</Link></li>
              <li><a href="#faq" className="transition-colors hover:text-primary">FAQ</a></li>
              <li><Link to="/report-abuse" className="transition-colors hover:text-primary">Relatar abuso</Link></li>
            </ul>
          </div>

          <div className="md:col-span-3">
            <h4 className="text-sm font-semibold text-foreground">Legal &amp; Privacidade</h4>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              <FooterLegal icon={Shield} label="Política de Privacidade" to="/legal/privacidade" />
              <FooterLegal icon={FileText} label="Termos de Uso" to="/legal/termos" />
              <FooterLegal icon={RefreshCw} label="Política de Reembolso" to="/legal/reembolso" />
              <FooterLegal icon={Cookie} label="Política de Cookies" to="/legal/cookies" />
              <FooterLegal icon={Scale} label="Acordo de Processamento (DPA)" to="/legal/dpa" />
              <FooterLegal icon={Server} label="Subprocessadores" to="/legal/subprocessadores" />
              <FooterLegal icon={UserCheck} label="Do Not Sell or Share My Info (CCPA)" to="/legal/ccpa" />
              <FooterLegal icon={Users} label="Encarregado (DPO)" to="/legal/dpo" />
            </ul>
          </div>

          <div className="md:col-span-3">
            <h4 className="text-sm font-semibold text-foreground">Seus direitos como titular</h4>
            <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
              {[
                "Acesso aos seus dados",
                "Retificação de dados incorretos",
                "Exclusão ou anonimização",
                "Portabilidade dos dados",
                "Revogação do consentimento",
                "Oposição ao tratamento",
                "Informação sobre compartilhamento",
                "Não discriminação pelo exercício de direitos",
              ].map((r) => (
                <li key={r} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
                  <span>{r}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-muted-foreground">
              Exerça seus direitos a qualquer momento em{" "}
              <a href="mailto:privacidade@shop2shops.com.br" className="text-primary hover:underline">privacidade@shop2shops.com.br</a>.
              Respondemos em até 15 dias (LGPD) / 30 dias (GDPR).
            </p>
          </div>
        </div>

        {/* Compliance badges */}
        <div className="mt-12 grid items-center gap-6 border-t border-border/40 pt-8 md:grid-cols-[180px_1fr]">
          <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Em conformidade<br />com
          </div>
          <div className="flex flex-wrap gap-2.5">
            {[
              { code: "LGPD", region: "Brasil" },
              { code: "GDPR", region: "União Europeia" },
              { code: "UK GDPR", region: "Reino Unido" },
              { code: "CCPA / CPRA", region: "Califórnia, EUA" },
              { code: "PIPEDA", region: "Canadá" },
              { code: "Lei n° 25.326", region: "Argentina" },
            ].map((b) => (
              <div key={b.code} className="flex items-center gap-2 rounded-full border border-border/60 bg-card/40 px-3 py-1.5 text-xs">
                <Shield className="h-3.5 w-3.5 text-primary" />
                <span className="font-semibold text-foreground">{b.code}</span>
                <span className="text-muted-foreground">· {b.region}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Regulatory notice */}
        <div className="mt-10 space-y-4 border-t border-border/40 pt-8 text-xs leading-relaxed text-muted-foreground">
          <p>
            <span className="font-semibold text-foreground">Aviso Regulatório: </span>
            Tratamos dados pessoais conforme a Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018 — Brasil),
            o Regulamento Geral de Proteção de Dados (GDPR — Regulamento UE 2016/679), UK GDPR &amp; Data Protection
            Act 2018, California Consumer Privacy Act (CCPA) conforme alterada pela California Privacy Rights Act
            (CPRA), Virginia CDPA, Colorado CPA, Connecticut CTDPA, Utah UCPA, PIPEDA (Canadá) e demais legislações
            aplicáveis. Você pode apresentar reclamação à autoridade competente da sua jurisdição:{" "}
            <span className="font-semibold text-foreground">ANPD</span> (Brasil),{" "}
            <span className="font-semibold text-foreground">EDPB</span> e autoridades nacionais (UE),{" "}
            <span className="font-semibold text-foreground">ICO</span> (Reino Unido),{" "}
            <span className="font-semibold text-foreground">CPPA</span> e{" "}
            <span className="font-semibold text-foreground">California AG</span> (Califórnia).
          </p>
          <p>
            <span className="font-semibold text-foreground">Transferências Internacionais: </span>
            Quando dados são transferidos para fora do EEE, Reino Unido ou Brasil, utilizamos Cláusulas Contratuais
            Padrão (SCCs) aprovadas pela Comissão Europeia e mecanismos equivalentes previstos no art. 33 da LGPD.
          </p>
          <p>
            <span className="font-semibold text-foreground">Uso Responsável: </span>
            A Shop2Shops fornece infraestrutura tecnológica para gestão e distribuição de operações de e-commerce.
            Cada lojista é responsável pelo cumprimento das obrigações fiscais, contratuais e legais aplicáveis às
            suas operações nas plataformas conectadas.
          </p>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-border/40 pt-6 text-xs text-muted-foreground md:flex-row">
          <div className="flex items-center gap-2">
            <img src={iconAsset.url} alt="" className="h-5 w-5 object-contain opacity-80" />
            <span>© {new Date().getFullYear()} Shop2Shops · Todos os direitos reservados</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterLegal({ icon: Icon, label, to }: { icon: React.ComponentType<{ className?: string }>; label: string; to: string }) {
  return (
    <li>
      <Link to={to} className="flex items-center gap-2 transition-colors hover:text-primary">
        <Icon className="h-3.5 w-3.5 text-muted-foreground/70" />
        <span>{label}</span>
      </Link>
    </li>
  );
}
