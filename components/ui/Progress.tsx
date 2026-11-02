import { cn } from "@/lib/cn";

/** Barre de progression animée (la largeur se remplit au chargement). */
export function ProgressBar({ value, className, tone = "violet", size = "md", label }: {
  value: number; className?: string; tone?: "violet" | "menthe" | "white"; size?: "sm" | "md" | "lg"; label?: string;
}) {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div
      role="progressbar" aria-valuenow={v} aria-valuemin={0} aria-valuemax={100} aria-label={label ?? "Progression"}
      className={cn(
        "relative w-full overflow-hidden rounded-full",
        tone === "white" ? "bg-white/25" : "bg-violet-100",
        size === "sm" ? "h-1.5" : size === "lg" ? "h-3" : "h-2",
        className,
      )}
    >
      <div
        className={cn(
          "h-full origin-left rounded-full transition-[width] duration-700 ease-out [animation:grow_.9s_cubic-bezier(.2,.7,.2,1)_both]",
          tone === "menthe" ? "bg-menthe-500" : tone === "white" ? "bg-white" : "bg-gradient-to-r from-violet-500 to-[#8059E3]",
        )}
        style={{ width: `${v}%` }}
      />
      <style>{`@keyframes grow{from{transform:scaleX(0)}to{transform:scaleX(1)}}`}</style>
    </div>
  );
}

/** Anneau de progression (SVG). */
export function ProgressRing({ value, size = 120, stroke = 10, className, track = "#E9E1FB", color = "url(#yvRing)", children }: {
  value: number; size?: number; stroke?: number; className?: string; track?: string; color?: string; children?: React.ReactNode;
}) {
  const v = Math.max(0, Math.min(100, value));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className={cn("relative inline-grid place-items-center", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <defs>
          <linearGradient id="yvRing" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#5046E5" />
            <stop offset="100%" stopColor="#FF64F5" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c - (v / 100) * c}
          style={{ transition: "stroke-dashoffset 1s cubic-bezier(.2,.7,.2,1)", ["--c" as string]: c, animation: "ring 1.1s cubic-bezier(.2,.7,.2,1) both" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
      <style>{`@keyframes ring{from{stroke-dashoffset:var(--c)}}`}</style>
    </div>
  );
}
