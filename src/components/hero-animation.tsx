import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
const Lock = ({ className }: { className?: string }) => (
  <Icon icon="solar:lock-bold" className={className} />
);

// Three checkout shops in a row at the bottom
const SHOPS = [
  { x: 22 },
  { x: 50 },
  { x: 78 },
];

const PHASE_MS = 3400;

export function HeroAnimation() {
  const [active, setActive] = useState(0);
  const [blocked, setBlocked] = useState(false);
  const [status, setStatus] = useState<"active" | "blocked" | "switching">("active");

  useEffect(() => {
    let cancelled = false;
    const tick = () => {
      if (cancelled) return;
      setBlocked(false);
      setStatus("active");
      const t1 = setTimeout(() => {
        if (cancelled) return;
        setBlocked(true);
        setStatus("blocked");
        const t2 = setTimeout(() => {
          if (cancelled) return;
          setStatus("switching");
          const t3 = setTimeout(() => {
            if (cancelled) return;
            setActive((a) => (a + 1) % SHOPS.length);
            tick();
          }, 700);
          timers.push(t3);
        }, 1300);
        timers.push(t2);
      }, PHASE_MS);
      timers.push(t1);
    };
    const timers: ReturnType<typeof setTimeout>[] = [];
    tick();
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, []);

  return (
    <div className="relative aspect-[4/5] w-full max-w-[560px] justify-self-center">
      {/* Top section: hub + 3 shops with connecting lines */}
      <div className="relative h-[62%] w-full">
        <svg
          viewBox="0 0 100 100"
          className="absolute inset-0 h-full w-full"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="flow" x1="0" y1="0" x2="0" y2="100" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.1" />
              <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="1" />
            </linearGradient>
            <filter id="lineGlow" filterUnits="userSpaceOnUse" x="0" y="0" width="100" height="100">
              <feGaussianBlur stdDeviation="1.6" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="bloomHeavy" filterUnits="userSpaceOnUse" x="-20" y="-20" width="140" height="140">
              <feGaussianBlur stdDeviation="9" in="SourceGraphic" result="haze" />
              <feGaussianBlur stdDeviation="4" in="SourceGraphic" result="bloom" />
              <feGaussianBlur stdDeviation="1.4" in="SourceGraphic" result="tight" />
              <feMerge>
                <feMergeNode in="haze" />
                <feMergeNode in="bloom" />
                <feMergeNode in="tight" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <radialGradient id="flare" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
              <stop offset="35%" stopColor="#AAFF00" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#AAFF00" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="plasma" x1="0" y1="24" x2="0" y2="80" gradientUnits="userSpaceOnUse">
              <stop offset="0%"   stopColor="#ffffff" stopOpacity="0.95" />
              <stop offset="22%"  stopColor="#d8ff4d" />
              <stop offset="50%"  stopColor="#aaff00" />
              <stop offset="78%"  stopColor="#d8ff4d" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.95" />
            </linearGradient>
          </defs>
          {/* Radar rings around hub */}
          <g style={{ transformOrigin: "50px 22px" }}>
            {[0, 1, 2].map((i) => (
              <circle
                key={i}
                cx="50"
                cy="22"
                r="6"
                fill="none"
                stroke="var(--color-primary)"
                strokeWidth="0.5"
                style={{
                  transformOrigin: "50px 22px",
                  animation: `s2s-radar 3.6s ${i * 1.2}s ease-out infinite`,
                  filter: "drop-shadow(0 0 1.5px var(--color-primary))",
                }}
              />
            ))}
          </g>
          {SHOPS.map((s, i) => {
            const isActive = i === active;
            // Wider, more organic curve — wide at origin via spread anchors
            const d = `M 50 24 C ${50 + (s.x - 50) * 0.15} 45, ${s.x} 55, ${s.x} 80`;
            // Reverse path for bottom→top particle travel
            const dRev = `M ${s.x} 80 C ${s.x} 55, ${50 + (s.x - 50) * 0.15} 45, 50 24`;
            const beamId = `beam-${i}`;
            const beamRevId = `beam-rev-${i}`;
            if (isActive && !blocked) {
              const ex = s.x; // end x
              const ey = 80;  // end y
              const sx = 50;  // start x
              const sy = 24;  // start y
              // Compute a small lateral offset for electric arcs
              const arcD1 = `M 50 30 Q ${50 + (s.x - 50) * 0.05 + 3} 48 ${(50 + s.x) / 2} 60`;
              const arcD2 = `M ${(50 + s.x) / 2 - 2} 55 Q ${s.x - 3} 68 ${s.x} 78`;
              return (
                <g key={i} style={{ animation: "s2s-beam-pulse 2s ease-in-out infinite" }}>
                  {/* Hidden path defs for motion */}
                  <defs>
                    <path id={beamId} d={d} />
                    <path id={beamRevId} d={dRev} />
                  </defs>

                  {/* Layer 4 — Atmospheric distortion haze */}
                  <g filter="url(#bloomHeavy)">
                    <path d={d} fill="none" stroke="#aaff00" strokeWidth={4.5} strokeLinecap="round" opacity={0.4} />
                  </g>
                  {/* Layer 3 — Neon outer glow */}
                  <path d={d} fill="none" stroke="#7dff00" strokeWidth={2.6} strokeLinecap="round" opacity={0.55}
                    style={{ filter: "blur(1.2px)" }} />
                  {/* Layer 2 — Plasma beam with vertical gradient */}
                  <path d={d} fill="none" stroke="url(#plasma)" strokeWidth={1.4} strokeLinecap="round"
                    style={{ filter: "drop-shadow(0 0 1.5px #d8ff4d) drop-shadow(0 0 3px #aaff00)" }} />
                  {/* Layer 1 — Razor-thin white energy core */}
                  <path d={d} fill="none" stroke="#ffffff" strokeWidth={0.35} strokeLinecap="round" opacity={0.95} />

                  {/* Electric arcs — random low-intensity flickers */}
                  <path d={arcD1} fill="none" stroke="#d8ff4d" strokeWidth={0.35} strokeLinecap="round"
                    opacity={0} style={{ filter: "drop-shadow(0 0 1px #aaff00)", animation: "s2s-arc-a 4.2s ease-in-out infinite" }} />
                  <path d={arcD2} fill="none" stroke="#d8ff4d" strokeWidth={0.35} strokeLinecap="round"
                    opacity={0} style={{ filter: "drop-shadow(0 0 1px #aaff00)", animation: "s2s-arc-b 5.7s ease-in-out infinite" }} />

                  {/* Contact halos — origin (top, intense) and terminus (bottom, pulsing) */}
                  <circle cx={sx} cy={sy} r="5" fill="url(#flare)" opacity={0.9} />
                  <circle cx={ex} cy={ey} r="4.5" fill="url(#flare)"
                    style={{ animation: "s2s-halo-pulse 1.6s ease-in-out infinite", transformOrigin: `${ex}px ${ey}px` }} />
                  <circle cx={sx} cy={sy} r="0.9" fill="#ffffff" />
                  <circle cx={ex} cy={ey} r="0.9" fill="#ffffff" />

                  {/* Energy particles traveling bottom → top */}
                  {[0, 0.35, 0.7, 1.05].map((delay, k) => (
                    <circle key={k} r="0.6" fill="#ffffff"
                      style={{ filter: "drop-shadow(0 0 1.2px #ffffff) drop-shadow(0 0 2.5px #d8ff4d) drop-shadow(0 0 5px #aaff00)" }}>
                      <animateMotion dur="1.5s" repeatCount="indefinite" begin={`${delay}s`} keyPoints="0;1" keyTimes="0;1">
                        <mpath href={`#${beamRevId}`} />
                      </animateMotion>
                      <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.15;0.85;1"
                        dur="1.5s" begin={`${delay}s`} repeatCount="indefinite" />
                    </circle>
                  ))}
                </g>
              );
            }
            return (
              <path
                key={i}
                d={d}
                fill="none"
                stroke="rgba(255,255,255,0.28)"
                strokeWidth={0.5}
                strokeDasharray="2 2"
                strokeLinecap="round"
              />
            );
          })}
        </svg>

        {/* Hub (big Shopify bag) */}
        <div className="absolute left-1/2 top-[8%] -translate-x-1/2">
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
            className="relative"
          >
            <div
              className="absolute inset-0 -z-10 rounded-full blur-2xl"
              style={{ background: "var(--color-primary)", opacity: 0.45 }}
            />
            <Icon icon="logos:shopify" className="h-32 w-32 md:h-40 md:w-40" />
          </motion.div>
        </div>

        {/* Failover arrows between shops */}
        {SHOPS.slice(0, -1).map((s, i) => {
          const next = SHOPS[i + 1];
          const mid = (s.x + next.x) / 2;
          return (
            <div
              key={`arr-${i}`}
              className="absolute -translate-x-1/2 -translate-y-1/2 text-white/70"
              style={{ left: `${mid}%`, top: "82%" }}
            >
              <motion.div
                animate={{ x: [-3, 3, -3], opacity: [0.4, 0.9, 0.4] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut", delay: i * 0.3 }}
              >
                <Icon icon="solar:alt-arrow-right-bold" className="h-5 w-5 drop-shadow-[0_0_4px_rgba(255,255,255,0.6)]" />
              </motion.div>
            </div>
          );
        })}

        {/* Bottom shops */}
        {SHOPS.map((s, i) => {
          const isActive = i === active;
          return (
            <ShopNode key={i} x={s.x} active={isActive} blocked={isActive && blocked} />
          );
        })}

      </div>

      {/* Revenue card */}
      <RevenueCard blocked={blocked} active={active} status={status} />

      <style>{`
        @keyframes s2s-dash { to { stroke-dashoffset: -13; } }
        @keyframes s2s-radar {
          0%   { r: 6;  opacity: 0.7; stroke-width: 0.6; }
          80%  { r: 26; opacity: 0;   stroke-width: 0.2; }
          100% { r: 26; opacity: 0;   stroke-width: 0.2; }
        }
        @keyframes s2s-beam-pulse {
          0%, 100% { filter: brightness(1); }
          50%      { filter: brightness(1.6); }
        }
        @keyframes s2s-halo-pulse {
          0%, 100% { transform: scale(1);   opacity: 0.8; }
          50%      { transform: scale(1.3); opacity: 1; }
        }
        @keyframes s2s-arc-a {
          0%, 92%, 100% { opacity: 0; }
          93%, 95%      { opacity: 0.7; }
        }
        @keyframes s2s-arc-b {
          0%, 88%, 100% { opacity: 0; }
          89%, 92%      { opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}

function ShopNode({ x, active, blocked }: { x: number; active: boolean; blocked: boolean }) {
  return (
    <div
      className="absolute -translate-x-1/2"
      style={{ left: `${x}%`, top: "76%" }}
    >
      {/* Floor halo */}
      <div
        className="pointer-events-none absolute left-1/2 top-full -translate-x-1/2 -translate-y-1/2"
        style={{
          width: active && !blocked ? "180%" : "120%",
          height: active && !blocked ? "55%" : "32%",
          background:
            active && !blocked
              ? "radial-gradient(ellipse at center, color-mix(in oklab, var(--color-primary) 75%, transparent) 0%, color-mix(in oklab, var(--color-primary) 30%, transparent) 35%, transparent 70%)"
              : blocked
                ? "radial-gradient(ellipse at center, hsl(0 84% 60% / 0.55) 0%, hsl(0 84% 60% / 0.15) 40%, transparent 70%)"
                : "radial-gradient(ellipse at center, rgba(0,0,0,0.65) 0%, transparent 70%)",
          filter: active && !blocked ? "blur(6px)" : "blur(4px)",
          transition: "all 0.6s ease",
        }}
      />
      <motion.div
        animate={{
          scale: active ? 1 : 0.88,
          filter: blocked
            ? "grayscale(1) sepia(1) saturate(6) hue-rotate(-50deg) brightness(1.1)"
            : active
              ? "grayscale(0)"
              : "grayscale(1) brightness(0.25) contrast(1.6)",
          opacity: (active && !blocked) || blocked ? 1 : 0.55,
        }}
        transition={{ duration: 0.6 }}
        className="relative"
      >
        {active && !blocked && (
          <div
            className="absolute inset-0 -z-10 rounded-full blur-xl"
            style={{ background: "var(--color-primary)", opacity: 0.55 }}
          />
        )}
        {blocked && (
          <div
            className="absolute inset-0 -z-10 rounded-full blur-xl"
            style={{ background: "hsl(0 84% 60%)", opacity: 0.6 }}
          />
        )}
        <Icon icon="logos:shopify" className="h-16 w-16 md:h-20 md:w-20" />
        {/* Specular highlight on chrome-black inactive */}
        {!active && !blocked && (
          <div
            className="pointer-events-none absolute inset-0 rounded-md"
            style={{
              background:
                "linear-gradient(160deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 35%, rgba(255,255,255,0) 70%, rgba(255,255,255,0.05) 100%)",
              mixBlendMode: "screen",
            }}
          />
        )}
        <AnimatePresence>
          {blocked && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ type: "spring", stiffness: 220, damping: 14 }}
              className="absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full border border-border bg-card text-foreground"
            >
              <Lock className="h-3.5 w-3.5" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

function FlowDots({ targetX }: { targetX: number }) {
  const dots = [0, 0.4, 0.8];
  return (
    <>
      {dots.map((delay, i) => (
        <motion.div
          key={i}
          initial={{ left: "50%", top: "22%", opacity: 0, scale: 0.6 }}
          animate={{
            left: `${targetX}%`,
            top: "78%",
            opacity: [0, 1, 1, 0],
            scale: [0.7, 1.4, 1.4, 0.6],
          }}
          transition={{
            duration: 1.8,
            delay: delay * 1.6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary px-2.5 py-1 text-sm font-extrabold text-primary-foreground shadow-[0_0_20px_var(--color-primary)] ring-2 ring-primary/40"
        >
          $
        </motion.div>
      ))}
    </>
  );
}

type Status = "active" | "blocked" | "switching";
function RevenueCard({ blocked, active, status }: { blocked: boolean; active: number; status: Status }) {
  const [value, setValue] = useState(1248932);
  const [tick, setTick] = useState(0);
  const [crashY, setCrashY] = useState(0); // 0 = no crash, 1 = fully crashed

  useEffect(() => {
    if (status !== "active") return;
    const id = setInterval(() => {
      setValue((v) => v + Math.floor(120 + Math.random() * 480));
    }, 200);
    return () => clearInterval(id);
  }, [active, status]);
  const STATUS_MAP: Record<Status, { label: string; tone: string; icon: string; dot: string }> = {
    active:    { label: "Loja ativa",      tone: "border-primary/40 bg-primary/15 text-primary",        icon: "solar:check-circle-bold", dot: "bg-primary" },
    blocked:   { label: "Loja bloqueada",  tone: "border-destructive/40 bg-destructive/15 text-destructive", icon: "solar:lock-bold",         dot: "bg-destructive" },
    switching: { label: "Alternando loja", tone: "border-primary/40 bg-primary/10 text-primary",         icon: "solar:refresh-bold",      dot: "bg-primary" },
  };
  const s = STATUS_MAP[status];


  // Animated scrolling chart — pauses when not active
  useEffect(() => {
    if (status !== "active") return;
    let raf = 0;
    const loop = () => {
      setTick((t) => t + 1);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [status]);

  // Crash animation: chart drops when blocked/switching, recovers when active
  useEffect(() => {
    const target = status === "active" ? 0 : 1;
    let raf = 0;
    const speed = status === "active" ? 0.04 : 0.06;
    const loop = () => {
      setCrashY((y) => {
        const next = y + (target - y) * speed;
        if (Math.abs(target - next) < 0.005) return target;
        raf = requestAnimationFrame(loop);
        return next;
      });
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [status]);

  // Infinite ascending chart with waves scrolling left-to-right
  const N = 56;
  const offset = tick * 0.25;
  const ys = Array.from({ length: N }, (_, i) => {
    // Visual trend: ascends from left (low) to right (high) — fixed in view
    const trend = 38 - i * 0.55;
    // Scrolling wave layers (phase shifts with time → waves move right)
    const phase = i + offset;
    const wave =
      Math.sin(phase * 0.42) * 3.2 +
      Math.sin(phase * 0.85) * 1.6 +
      Math.cos(phase * 0.23) * 2.4;
    const base = Math.max(3, Math.min(40, trend + wave));
    // Crash: progressively pull the right side of the curve down toward floor (y=42)
    // Stronger drop on the right, smaller on the left → cliff shape
    const dropWeight = Math.pow(i / (N - 1), 1.4);
    return base + (42 - base) * dropWeight * crashY;
  });
  const points = ys.map((y, i) => `${(i * 100) / (N - 1)},${y.toFixed(2)}`).join(" ");
  const tipY = ys[N - 1];

  const formatted = value.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const isDown = status !== "active";
  // Red theme color for blocked state
  const accent = isDown ? "#ef4444" : "var(--color-primary)";
  const accentSoft = isDown ? "rgba(239, 68, 68, 0.4)" : "var(--color-primary)";

  return (
    <div
      className="absolute inset-x-2 bottom-0 overflow-hidden rounded-[22px] border p-5 backdrop-blur-xl transition-[border-color,background-color,box-shadow] duration-500"
      style={{
        borderColor: isDown ? "rgba(239, 68, 68, 0.35)" : "color-mix(in oklab, var(--color-primary) 30%, transparent)",
        background: isDown ? "rgba(20, 6, 6, 0.92)" : "rgba(10, 15, 10, 0.9)",
        boxShadow:
          isDown
            ? "0 30px 60px -20px rgba(0,0,0,0.7), 0 0 0 1px rgba(239, 68, 68, 0.25), 0 0 40px -10px rgba(239, 68, 68, 0.35), inset 0 1px 0 rgba(239, 68, 68, 0.25)"
            : "0 30px 60px -20px rgba(0,0,0,0.7), 0 0 0 1px color-mix(in oklab, var(--color-primary) 20%, transparent), inset 0 1px 0 color-mix(in oklab, var(--color-primary) 25%, transparent)",
      }}
    >
      {/* Inner corner glows */}
      <div
        className="pointer-events-none absolute -left-20 -top-20 h-56 w-56 rounded-full blur-3xl transition-colors duration-500"
        style={{ background: isDown ? "#ef4444" : "var(--color-primary)", opacity: 0.18 }}
      />
      <div
        className="pointer-events-none absolute -right-24 -bottom-24 h-56 w-56 rounded-full blur-3xl transition-colors duration-500"
        style={{ background: isDown ? "#ef4444" : "var(--color-primary)", opacity: isDown ? 0.18 : 0.12 }}
      />
      <div className="relative">
      <div className="flex items-start justify-between gap-3">
        <div
          className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider transition-colors duration-500"
          style={{ color: accent }}
        >
          <span className="h-1.5 w-1.5 animate-pulse rounded-full" style={{ background: accent }} />
          {isDown ? "Faturamento em risco" : "Faturamento protegido"}
        </div>
        <div className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider transition-colors ${s.tone}`}>
          <span className={`h-1.5 w-1.5 animate-pulse rounded-full ${s.dot}`} />
          <Icon icon={s.icon} className="h-3 w-3" />
          {s.label}
        </div>
      </div>

      <div
        className="mt-2 text-3xl font-bold tabular-nums transition-colors duration-500 md:text-4xl"
        style={{ color: accent }}
      >
        R$ {formatted}
      </div>
      <div className="mt-1 text-xs text-muted-foreground">
        {isDown ? (
          <>
            Conectando{" "}
            <span className="font-medium" style={{ color: accent }}>loja alternativa…</span>
          </>
        ) : (
          <>
            Transferindo automaticamente para{" "}
            <span className="font-medium text-primary">loja alternativa…</span>
          </>
        )}
      </div>

      <div className="mt-3">
        <svg viewBox="0 0 100 44" className="h-24 w-full" preserveAspectRatio="none">
          <defs>
            <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={accent} stopOpacity="0.4" />
              <stop offset="100%" stopColor={accent} stopOpacity="0" />
            </linearGradient>
          </defs>
          <polygon points={`0,44 ${points} 100,44`} fill="url(#chartFill)" />
          <polyline
            points={points}
            fill="none"
            stroke={accent}
            strokeWidth="0.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ filter: `drop-shadow(0 0 2px ${accentSoft})`, transition: "stroke 500ms ease" }}
          />
          <circle cx="100" cy={tipY} r="1.6" fill={accent} style={{ filter: `drop-shadow(0 0 3px ${accentSoft})` }} />
        </svg>
      </div>
      </div>
    </div>
  );
}