import type { ComponentType, CSSProperties } from "react";

export type IconTone = "primary" | "warn" | "danger";

const TONE: Record<IconTone, { rgb: string; text: string }> = {
  primary: { rgb: "163,255,18", text: "text-primary" },
  warn: { rgb: "250,204,21", text: "text-yellow-400" },
  danger: { rgb: "248,113,113", text: "text-red-400" },
};

type Size = "sm" | "md" | "lg";
const SIZES: Record<Size, { box: string; radius: string; icon: string }> = {
  sm: { box: "h-10 w-10", radius: "10px", icon: "h-5 w-5" },
  md: { box: "h-12 w-12", radius: "14px", icon: "h-5 w-5" },
  lg: { box: "h-14 w-14", radius: "18px", icon: "h-6 w-6" },
};

export function IconTile({
  Icon,
  tone = "primary",
  size = "lg",
  className = "",
}: {
  Icon: ComponentType<{ className?: string }>;
  tone?: IconTone;
  size?: Size;
  className?: string;
}) {
  const t = TONE[tone];
  const s = SIZES[size];
  const style: CSSProperties = {
    borderRadius: s.radius,
    // iOS app-icon style: dark vertical gradient base
    background:
      "linear-gradient(160deg, #1a1a1a 0%, #0a0a0a 55%, #000 100%)",
    border: "1px solid rgba(255,255,255,0.06)",
    // Inner top-left diagonal glow ONLY + subtle outer depth shadow
    boxShadow: [
      `inset 1px 1px 0 rgba(255,255,255,0.05)`,
      `inset 12px 12px 20px -18px rgba(${t.rgb},0.20)`,
      `inset 20px 20px 42px -24px rgba(${t.rgb},0.07)`,
      `0 1px 0 rgba(255,255,255,0.03)`,
      `0 8px 20px -10px rgba(0,0,0,0.6)`,
    ].join(", "),
  };
  return (
    <div
      className={`relative grid shrink-0 place-items-center overflow-hidden ${s.box} ${t.text} ${className}`}
      style={style}
    >
      {/* Specular top-left highlight */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          borderRadius: s.radius,
          background:
            "radial-gradient(100% 75% at 0% 0%, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 45%)",
        }}
      />
      <span
        className="relative"
        style={{ filter: `drop-shadow(0 0 4px rgba(${t.rgb},0.20))` }}
      >
        <Icon className={`${s.icon} [&_*]:!stroke-2`} />
      </span>
    </div>
  );
}