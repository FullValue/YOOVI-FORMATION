import Link from "next/link";
import { ArrowRight, CircleCheckBig, Clock, FileText, PlayCircle } from "lucide-react";
import { formatDuration, plural } from "@/lib/format";
import type { ModuleProgress } from "@/lib/catalog";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/Progress";
import { buttonClass } from "@/components/ui/Button";
import { ModuleCover } from "./ModuleCover";

export function moduleCta(p: ModuleProgress) {
  const base = `/formations/${p.module.slug}`;
  if (p.state === "empty") return { label: "Découvrir", href: base };
  if (p.state === "completed") return { label: "Revoir", href: base };
  const href = p.nextLesson ? `${base}/${p.nextLesson.id}` : base;
  return { label: p.state === "in_progress" ? "Reprendre" : "Commencer", href };
}

export function StateBadge({ p }: { p: ModuleProgress }) {
  if (p.state === "completed") return <Badge tone="menthe" icon={<CircleCheckBig className="size-3.5" />}>Terminé</Badge>;
  if (p.state === "in_progress") return <Badge tone="violet" dot>En cours</Badge>;
  if (p.state === "empty") return <Badge tone="jaune">Ressources</Badge>;
  return <Badge tone="gris">À découvrir</Badge>;
}

export function ModuleCard({ p, index }: { p: ModuleProgress; index: number }) {
  const cta = moduleCta(p);
  const duration = p.durationKnown ? formatDuration(p.durationSeconds) : null;
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-[28px] bg-white shadow-card transition duration-300 hover:-translate-y-1 hover:shadow-lift">
      <ModuleCover module={p.module} index={index} className="aspect-[16/9]" />
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="mb-3 flex items-center justify-between gap-2">
          <StateBadge p={p} />
          {p.state !== "empty" && p.state !== "not_started" && (
            <span className="font-display text-sm font-bold text-violet-600">{p.percent} %</span>
          )}
        </div>
        <h3 className="text-[19px] font-bold leading-snug">
          <Link href={`/formations/${p.module.slug}`} className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none">
            {p.module.title}
          </Link>
        </h3>
        <p className="mt-1.5 line-clamp-2 text-[15px] leading-relaxed text-ink-muted">{p.module.summary}</p>
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] font-medium text-ink-muted">
          {p.total > 0 ? (
            <span className="inline-flex items-center gap-1.5"><PlayCircle className="size-4 text-violet-500" />{plural(p.total, "vidéo")}</span>
          ) : null}
          {p.module.resources.length > 0 && (
            <span className="inline-flex items-center gap-1.5"><FileText className="size-4 text-violet-500" />{plural(p.module.resources.length, "ressource")}</span>
          )}
          {p.total > 0 && (
            <span className="inline-flex items-center gap-1.5"><Clock className="size-4 text-violet-500" />{duration ?? "Durée à venir"}</span>
          )}
        </div>
        <div className="mt-auto pt-5">
          {p.state !== "empty" && <ProgressBar value={p.percent} size="sm" tone={p.state === "completed" ? "menthe" : "violet"} label={`Progression du module ${p.module.title}`} />}
          <div className="mt-4 flex items-center justify-between">
            <span className="text-[13px] text-ink-faint">
              {p.state === "empty" ? "Bibliothèque" : `${p.completed}/${p.total} terminée${p.completed > 1 ? "s" : ""}`}
            </span>
            <Link href={cta.href} className={buttonClass(p.state === "in_progress" ? "primary" : "secondary", "sm", "relative z-10")}>
              {cta.label}
              <ArrowRight className="size-4 transition-transform group-hover/btn:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
