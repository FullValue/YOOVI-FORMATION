import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Award, CircleCheckBig, Compass, Hourglass, PlayCircle } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { computeBadges, encouragement, getLearnerOverview } from "@/lib/catalog";
import { formatRelative } from "@/lib/format";
import { cn } from "@/lib/cn";
import { PageHeader } from "@/components/learning/PageHeader";
import { ModuleCover } from "@/components/learning/ModuleCover";
import { moduleCta, StateBadge } from "@/components/learning/ModuleCard";
import { ProgressBar, ProgressRing } from "@/components/ui/Progress";
import { EmptyState } from "@/components/ui/EmptyState";
import { buttonClass } from "@/components/ui/Button";

export const metadata: Metadata = { title: "Ma progression" };

export default async function ProgressPage() {
  const user = await requireUser();
  const o = await getLearnerOverview(user);
  const badges = computeBadges(o);
  const learnable = o.modules.filter((m) => m.state !== "empty");
  const completedRecent = [...o.progress.values()]
    .filter((p) => p.status === "completed" && p.completed_at)
    .sort((a, b) => b.completed_at!.localeCompare(a.completed_at!))
    .slice(0, 6)
    .map((p) => {
      const m = o.modules.find((x) => x.module.id === p.module_id)?.module;
      return { p, m, l: m?.lessons.find((l) => l.id === p.lesson_id) };
    })
    .filter((x) => x.m && x.l);

  return (
    <>
      <PageHeader eyebrow="Ma progression" title="Votre parcours de formation" description={encouragement(o)} />

      <section className="grid gap-5 lg:grid-cols-[auto_1fr] animate-fade-up">
        <div className="surface flex flex-col items-center justify-center p-8 text-center lg:w-[300px]">
          <ProgressRing value={o.percent} size={170} stroke={14}>
            <span className="font-display text-[42px] font-bold leading-none">{o.percent}<span className="text-xl">%</span></span>
            <span className="mt-1 block text-[12px] font-semibold uppercase tracking-wider text-ink-faint">accompli</span>
          </ProgressRing>
          <p className="mt-5 font-display text-lg font-bold">{o.completedLessons} / {o.totalLessons} vidéos</p>
          <p className="text-sm text-ink-muted">terminées sur l&apos;ensemble des modules</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { icon: CircleCheckBig, n: o.counts.completed, label: "Modules terminés", tone: "bg-menthe-100 text-menthe-700", bar: "menthe" as const },
            { icon: Hourglass, n: o.counts.in_progress, label: "Modules en cours", tone: "bg-violet-100 text-violet-700", bar: "violet" as const },
            { icon: Compass, n: o.counts.not_started, label: "Modules à découvrir", tone: "bg-jaune-100 text-jaune-700", bar: "violet" as const },
          ].map(({ icon: Icon, n, label, tone, bar }) => (
            <div key={label} className="surface flex flex-col p-6">
              <span className={cn("grid size-12 place-items-center rounded-2xl", tone)}><Icon className="size-6" /></span>
              <p className="mt-auto pt-6 font-display text-[44px] font-bold leading-none">{n}</p>
              <p className="mt-1 font-medium text-ink-muted">{label}</p>
              <ProgressBar className="mt-4" size="sm" tone={bar} value={learnable.length ? (n / learnable.length) * 100 : 0} label={label} />
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="par-module" className="mt-12">
        <h2 id="par-module" className="mb-4 text-[24px] font-bold">Progression par module</h2>
        {learnable.length === 0 ? (
          <EmptyState icon={<PlayCircle />} title="Aucun module vidéo pour le moment" />
        ) : (
          <div className="surface divide-y divide-ligne overflow-hidden">
            {learnable.map((p) => {
              const cta = moduleCta(p);
              return (
                <div key={p.module.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:gap-6 sm:p-6">
                  <div className="flex min-w-0 flex-1 items-center gap-4">
                    <ModuleCover module={p.module} size="sm" className="size-14 shrink-0 rounded-2xl" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link href={`/formations/${p.module.slug}`} className="truncate font-display text-[17px] font-bold hover:text-violet-600">{p.module.title}</Link>
                        <StateBadge p={p} />
                      </div>
                      <div className="mt-2.5 flex items-center gap-3">
                        <ProgressBar value={p.percent} size="sm" tone={p.state === "completed" ? "menthe" : "violet"} label={`Progression ${p.module.title}`} />
                        <span className="w-24 shrink-0 text-right text-[13px] font-semibold text-ink-muted">{p.completed}/{p.total} · {p.percent} %</span>
                      </div>
                      {p.lastViewedAt && <p className="mt-1.5 text-[12.5px] text-ink-faint">Dernière activité {formatRelative(p.lastViewedAt)}</p>}
                    </div>
                  </div>
                  <Link href={cta.href} className={buttonClass(p.state === "in_progress" ? "primary" : "secondary", "sm", "self-start sm:self-center")}>
                    {cta.label} <ArrowRight className="size-4" />
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <div className="mt-12 grid gap-8 lg:grid-cols-[1.3fr_1fr]">
        <section aria-labelledby="badges">
          <h2 id="badges" className="mb-4 text-[24px] font-bold">Badges</h2>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 stagger">
            {badges.map((b) => (
              <li key={b.key} className={cn("rounded-3xl p-4 text-center transition", b.earned ? "bg-white shadow-card" : "border border-dashed border-ligne bg-white/50")}>
                <span className={cn("mx-auto grid size-14 place-items-center rounded-full",
                  b.earned ? "bg-gradient-to-br from-jaune-300 to-jaune-500 text-jaune-700 shadow-lg ring-4 ring-jaune-100" : "bg-violet-50 text-violet-200")}>
                  <Award className="size-7" />
                </span>
                <p className={cn("mt-3 line-clamp-2 text-[14px] font-bold leading-snug", !b.earned && "text-ink-faint")}>{b.title}</p>
                <p className="mt-0.5 text-[12px] text-ink-faint">{b.earned ? "Obtenu" : b.description}</p>
              </li>
            ))}
          </ul>
        </section>
        <section aria-labelledby="historique">
          <h2 id="historique" className="mb-4 text-[24px] font-bold">Dernières vidéos terminées</h2>
          {completedRecent.length === 0 ? (
            <EmptyState compact icon={<CircleCheckBig />} title="Rien pour l'instant">Vos vidéos terminées s&apos;afficheront ici.</EmptyState>
          ) : (
            <ol className="relative space-y-4 border-l-2 border-violet-100 pl-6">
              {completedRecent.map(({ p, m, l }) => (
                <li key={p.lesson_id} className="relative">
                  <span className="absolute -left-[33px] top-1 grid size-4 place-items-center rounded-full bg-menthe-500 ring-4 ring-violet-50" />
                  <Link href={`/formations/${m!.slug}/${l!.id}`} className="block hover:text-violet-600">
                    <p className="font-semibold leading-snug">{l!.title}</p>
                    <p className="text-[13px] text-ink-faint">{m!.title} · {formatRelative(p.completed_at)}</p>
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </>
  );
}
