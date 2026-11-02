import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Award, CircleCheckBig, Compass, Hourglass, PlayCircle, Sparkles } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { computeBadges, encouragement, getLearnerOverview } from "@/lib/catalog";
import { firstName, formatRelative, formatTimecode } from "@/lib/format";
import { ProgressBar, ProgressRing } from "@/components/ui/Progress";
import { buttonClass } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ModuleCard, moduleCta } from "@/components/learning/ModuleCard";
import { ModuleCover } from "@/components/learning/ModuleCover";
import { SupportCard } from "@/components/learning/SupportCard";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "Tableau de bord" };

export default async function DashboardPage() {
  const user = await requireUser();
  const o = await getLearnerOverview(user);
  const name = firstName(user.full_name);
  const learnable = o.modules.filter((m) => m.state !== "empty");
  const focus = learnable.find((m) => m.state === "in_progress") ?? learnable.find((m) => m.state === "not_started") ?? null;
  const focusCta = focus ? moduleCta(focus) : null;
  const recommended = learnable.filter((m) => m.state === "not_started" && m !== focus).slice(0, 1)[0];
  const badges = computeBadges(o);
  const earned = badges.filter((b) => b.earned).length;
  const moduleIndex = new Map(o.modules.map((m, i) => [m.module.id, i]));

  return (
    <div className="space-y-12 sm:space-y-14">
      {/* ─── Bienvenue ─── */}
      <section className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-violet-500 via-[#6650EA] to-[#8A5BE6] p-6 text-white shadow-lift sm:p-10 animate-fade-up">
        <div className="absolute -right-24 -top-24 size-80 rounded-full bg-rose-500/40 blur-3xl" aria-hidden />
        <div className="absolute -bottom-28 left-1/3 size-72 rounded-full bg-bleu-500/40 blur-3xl" aria-hidden />
        <div className="relative grid items-center gap-8 lg:grid-cols-[1fr_auto]">
          <div className="max-w-2xl">
            {user.organization && (
              <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[12.5px] font-semibold ring-1 ring-white/25 backdrop-blur">
                <Sparkles className="size-3.5" aria-hidden /> {user.organization.name}
              </span>
            )}
            <h1 className="mt-4 text-[28px] font-bold leading-[1.15] text-white sm:text-[40px]">
              {name ? `Bonjour ${name}, bienvenue` : "Bienvenue"} sur votre espace de formation Yoovi&nbsp;!
            </h1>
            <p className="mt-3 max-w-xl font-reading text-[16px] text-white/85 sm:text-lg">
              Retrouvez ici toutes les ressources nécessaires pour découvrir, comprendre et maîtriser notre plateforme.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              {focusCta ? (
                <Link href={focusCta.href} className={buttonClass("secondary", "lg", "text-violet-700 ring-0")}>
                  <PlayCircle className="size-5" /> {focus?.state === "in_progress" ? "Reprendre ma formation" : "Commencer la formation"}
                </Link>
              ) : (
                <Link href="/formations" className={buttonClass("secondary", "lg", "text-violet-700 ring-0")}>Voir les formations</Link>
              )}
              <Link href="/formations" className="inline-flex items-center gap-1.5 px-2 text-[15px] font-semibold text-white/90 hover:text-white">
                Tous les modules <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-5 rounded-[28px] bg-white/12 p-5 ring-1 ring-white/20 backdrop-blur-md lg:flex-col lg:p-7">
            <ProgressRing value={o.percent} size={132} stroke={11} track="rgba(255,255,255,.22)" color="#fff">
              <span className="font-display text-[32px] font-bold leading-none text-white">{o.percent}<span className="text-lg">%</span></span>
              <span className="mt-1 block text-[11px] font-semibold uppercase tracking-wider text-white/70">parcours</span>
            </ProgressRing>
            <div className="lg:text-center">
              <p className="font-display text-[15px] font-semibold text-white">{o.completedLessons} / {o.totalLessons} vidéos terminées</p>
              <p className="mt-1 max-w-[220px] text-[13.5px] leading-snug text-white/75">{encouragement(o)}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Reprendre ma formation ─── */}
      <section aria-labelledby="reprendre">
        <SectionHead id="reprendre" eyebrow="Reprendre" title="Reprendre ma formation" />
        {o.recent.length === 0 ? (
          <EmptyState icon={<Compass />} title="Votre parcours commence ici" compact
            action={focusCta && <Link href={focusCta.href} className={buttonClass("primary", "md")}>Commencer « {focus?.module.title} » <ArrowRight className="size-4" /></Link>}>
            Les vidéos que vous consultez apparaîtront ici pour reprendre là où vous vous êtes arrêté.
          </EmptyState>
        ) : (
          <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-3 stagger">
            {o.recent.slice(0, 3).map(({ module, lesson, progress }) => {
              const done = progress.status === "completed";
              const lessonNo = module.lessons.findIndex((l) => l.id === lesson.id) + 1;
              return (
                <Link key={lesson.id} href={`/formations/${module.slug}/${lesson.id}`}
                  className="group flex w-[82%] shrink-0 snap-start gap-4 rounded-3xl bg-white p-3 pr-5 shadow-card transition hover:-translate-y-0.5 hover:shadow-lift sm:w-auto">
                  <div className="relative">
                    <ModuleCover module={module} size="sm" className="size-24 rounded-2xl sm:size-[104px]" />
                    <span className="absolute inset-0 grid place-items-center">
                      <span className="grid size-10 place-items-center rounded-full bg-white/95 text-violet-600 shadow-lg transition group-hover:scale-110">
                        {done ? <CircleCheckBig className="size-5 text-menthe-500" /> : <PlayCircle className="size-5" />}
                      </span>
                    </span>
                  </div>
                  <div className="min-w-0 flex-1 py-1">
                    <p className="truncate text-[12px] font-semibold uppercase tracking-wide text-violet-500">{module.title}</p>
                    <p className="mt-1 line-clamp-2 font-display text-[15.5px] font-bold leading-snug">{lesson.title}</p>
                    <p className="mt-2 text-[12.5px] text-ink-faint">
                      Vidéo {lessonNo}/{module.lessons.length} ·{" "}
                      {done ? "Terminée" : progress.last_position_seconds > 5 ? `Reprendre à ${formatTimecode(progress.last_position_seconds)}` : formatRelative(progress.last_viewed_at)}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* ─── Tous les modules ─── */}
      <section aria-labelledby="modules">
        <SectionHead id="modules" eyebrow="Catalogue" title="Tous les modules" link={{ href: "/formations", label: "Voir le catalogue" }} />
        {o.modules.length === 0 ? (
          <EmptyState icon={<Sparkles />} title="Les formations arrivent bientôt">L&apos;équipe Yoovi prépare vos premiers modules.</EmptyState>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4 stagger">
            {o.modules.map((p) => <ModuleCard key={p.module.id} p={p} index={moduleIndex.get(p.module.id) ?? 0} />)}
          </div>
        )}
      </section>

      {/* ─── Ma progression + support ─── */}
      <section aria-labelledby="progression" className="grid gap-5 lg:grid-cols-[1.25fr_1fr]">
        <div className="surface p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="eyebrow">Ma progression</p>
              <h2 id="progression" className="mt-1 text-2xl font-bold">{o.percent} % du parcours accompli</h2>
            </div>
            <Link href="/progression" className="hidden shrink-0 text-sm font-semibold text-violet-600 hover:underline sm:block">Détails</Link>
          </div>
          <ProgressBar value={o.percent} size="lg" className="mt-5" label="Progression globale" />
          <div className="mt-6 grid grid-cols-3 gap-3">
            <Stat icon={<CircleCheckBig />} value={o.counts.completed} label={["terminé", "terminés"]} tone="menthe" />
            <Stat icon={<Hourglass />} value={o.counts.in_progress} label={["en cours", "en cours"]} tone="violet" />
            <Stat icon={<Compass />} value={o.counts.not_started} label={["à découvrir", "à découvrir"]} tone="jaune" />
          </div>
          <div className="mt-6 flex items-center gap-3 rounded-2xl bg-violet-50 p-4">
            <div className="flex -space-x-2">
              {badges.slice(0, 5).map((b) => (
                <span key={b.key} title={b.title}
                  className={cn("grid size-9 place-items-center rounded-full ring-2 ring-white", b.earned ? "bg-gradient-to-br from-jaune-300 to-jaune-500 text-jaune-700" : "bg-violet-100 text-violet-300")}>
                  <Award className="size-4" aria-hidden />
                </span>
              ))}
            </div>
            <p className="flex-1 text-sm text-ink-muted"><strong className="text-ink">{earned} badge{earned > 1 ? "s" : ""}</strong> obtenu{earned > 1 ? "s" : ""} sur {badges.length}</p>
            <Link href="/progression" className="text-sm font-semibold text-violet-600 hover:underline">Voir</Link>
          </div>
          {recommended && (
            <Link href={`/formations/${recommended.module.slug}`} className="group mt-4 flex items-center gap-4 rounded-2xl border border-ligne p-3 transition hover:border-violet-300 hover:bg-violet-50">
              <ModuleCover module={recommended.module} size="sm" className="size-14 shrink-0 rounded-xl" />
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-semibold uppercase tracking-wide text-violet-500">À découvrir ensuite</p>
                <p className="truncate font-display font-bold">{recommended.module.title}</p>
              </div>
              <ArrowRight className="size-5 text-violet-500 transition group-hover:translate-x-1" />
            </Link>
          )}
        </div>
        <SupportCard />
      </section>
    </div>
  );
}

function SectionHead({ id, eyebrow, title, link }: { id: string; eyebrow: string; title: string; link?: { href: string; label: string } }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2 id={id} className="mt-1 text-[24px] font-bold sm:text-[28px]">{title}</h2>
      </div>
      {link && (
        <Link href={link.href} className="hidden items-center gap-1 text-sm font-semibold text-violet-600 hover:underline sm:inline-flex">
          {link.label} <ArrowRight className="size-4" />
        </Link>
      )}
    </div>
  );
}

function Stat({ icon, value, label, tone }: { icon: React.ReactNode; value: number; label: [string, string]; tone: "menthe" | "violet" | "jaune" }) {
  const tones = { menthe: "bg-menthe-100 text-menthe-700", violet: "bg-violet-100 text-violet-700", jaune: "bg-jaune-100 text-jaune-700" };
  return (
    <div className="rounded-2xl border border-ligne p-3 sm:p-4">
      <span className={cn("grid size-9 place-items-center rounded-xl [&>svg]:size-[18px]", tones[tone])}>{icon}</span>
      <p className="mt-3 font-display text-2xl font-bold leading-none">{value}</p>
      <p className="mt-1 text-[13px] text-ink-muted">{value > 1 ? `modules ${label[1]}` : `module ${label[0]}`}</p>
    </div>
  );
}
