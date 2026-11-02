import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Tone = "violet" | "menthe" | "jaune" | "corail" | "gris" | "rose" | "bleu";
const tones: Record<Tone, string> = {
  violet: "bg-violet-100 text-violet-700 ring-violet-200",
  menthe: "bg-menthe-100 text-menthe-700 ring-menthe-500/20",
  jaune: "bg-jaune-100 text-jaune-700 ring-jaune-500/30",
  corail: "bg-corail-100 text-corail-700 ring-corail-500/20",
  gris: "bg-white text-ink-muted ring-ligne",
  rose: "bg-rose-100 text-rose-600 ring-rose-300/40",
  bleu: "bg-bleu-100 text-bleu-600 ring-bleu-500/15",
};

export function Badge({ tone = "violet", icon, children, className, dot }: {
  tone?: Tone; icon?: ReactNode; children: ReactNode; className?: string; dot?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset", tones[tone], className)}>
      {dot && <span className="size-1.5 rounded-full bg-current" aria-hidden />}
      {icon}
      {children}
    </span>
  );
}
