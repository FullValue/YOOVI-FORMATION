import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { Badge } from "@/components/ui/Badge";
import type { AccountStatus, UserRole } from "@/lib/types";
import { ROLE_LABELS, STATUS_LABELS } from "@/lib/types";

export function AdminHeader({ title, description, actions, crumbs }: {
  title: string; description?: ReactNode; actions?: ReactNode; crumbs?: { href: string; label: string }[];
}) {
  return (
    <div className="mb-8 animate-fade-up">
      {crumbs && (
        <nav aria-label="Fil d'Ariane" className="mb-3 flex items-center gap-1.5 text-[13px] font-medium text-ink-muted">
          {crumbs.map((c) => (
            <span key={c.href} className="flex items-center gap-1.5">
              <Link href={c.href} className="hover:text-violet-600">{c.label}</Link>
              <ChevronRight className="size-3.5" />
            </span>
          ))}
        </nav>
      )}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-[28px] font-bold leading-tight sm:text-[34px]">{title}</h1>
          {description && <p className="mt-1.5 max-w-2xl text-[15.5px] text-ink-muted">{description}</p>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
      </div>
    </div>
  );
}

export function Kpi({ icon, label, value, hint, tone = "violet" }: {
  icon: ReactNode; label: string; value: ReactNode; hint?: ReactNode; tone?: "violet" | "menthe" | "jaune" | "rose" | "bleu";
}) {
  const tones = {
    violet: "bg-violet-100 text-violet-600", menthe: "bg-menthe-100 text-menthe-700", jaune: "bg-jaune-100 text-jaune-700",
    rose: "bg-rose-100 text-rose-600", bleu: "bg-bleu-100 text-bleu-600",
  };
  return (
    <div className="surface p-5">
      <div className="flex items-center justify-between">
        <span className="text-[13.5px] font-semibold text-ink-muted">{label}</span>
        <span className={cn("grid size-9 place-items-center rounded-xl [&>svg]:size-[18px]", tones[tone])}>{icon}</span>
      </div>
      <p className="mt-3 font-display text-[32px] font-bold leading-none">{value}</p>
      {hint && <p className="mt-2 text-[13px] text-ink-faint">{hint}</p>}
    </div>
  );
}

export function Panel({ title, description, actions, children, className, id }: {
  title?: string; description?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string; id?: string;
}) {
  return (
    <section id={id} className={cn("surface p-5 sm:p-7", className)} aria-label={title}>
      {(title || actions) && (
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            {title && <h2 className="text-lg font-bold">{title}</h2>}
            {description && <p className="mt-0.5 text-[14px] text-ink-muted">{description}</p>}
          </div>
          {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

export function StatusBadge({ status }: { status: AccountStatus }) {
  const tone = status === "active" ? "menthe" : status === "invited" ? "jaune" : "corail";
  return <Badge tone={tone} dot>{STATUS_LABELS[status]}</Badge>;
}

export function RoleBadge({ role }: { role: UserRole }) {
  return <Badge tone={role === "partner" ? "gris" : role === "super_admin" ? "rose" : "violet"}>{ROLE_LABELS[role]}</Badge>;
}

export function MiniBar({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="h-1.5 w-full min-w-[60px] overflow-hidden rounded-full bg-violet-100">
        <div className={cn("h-full rounded-full", value >= 100 ? "bg-menthe-500" : "bg-violet-500")} style={{ width: `${Math.min(100, value)}%` }} />
      </div>
      <span className="w-10 shrink-0 text-right text-[12.5px] font-semibold tabular-nums text-ink-muted">{value} %</span>
    </div>
  );
}
