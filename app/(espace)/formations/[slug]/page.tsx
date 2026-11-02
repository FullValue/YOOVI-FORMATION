import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Award, Check, CircleCheckBig, Clock, Library, Lock, PlayCircle, Target } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { getLearnerOverview } from "@/lib/catalog";
import { formatDuration, formatTimecode, plural } from "@/lib/format";
import { cn } from "@/lib/cn";
import { ModuleCover } from "@/components/learning/ModuleCover";
import { moduleCta, StateBadge } from "@/components/learning/ModuleCard";
import { ResourceLink } from "@/components/learning/LessonPlayer";
import { ProgressBar } from "@/components/ui/Progress";
import { buttonClass } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const o = await getLearnerOverview(await requireUser());
  return { title: o.modules.find((m) => m.module.slug === slug)?.module.title ?? "Module" };
}

export default async function ModulePage({ params }: Params) {
  const { slug } = await params;
  const user = await requireUser();
  const o = await getLearnerOverview(user);
  const index = o.modules.findIndex((m) => m.module.slug === slug);
  const p = o.modules[index];
  if (!p) notFound();
  const m = p.module;
  const cta = moduleCta(p);
  const withVideo = m.lessons.filter((l) => l.video_ref).length;

  return (
    <div className="pt-3 sm:pt-6">
      <Link href="/formations" className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-muted hover:text-violet-600">
        <ArrowLeft className="size-4" /> Toutes les formations
      </Link>

      <section className="grid overflow-hidden rounded-[32px] bg-white shadow-card lg:grid-cols-[1fr_1.1fr] animate-fade-up">
        <ModuleCover module={m} index={index} size="lg" className="min-h-[220px] lg:min-h-[360px]" />
        <div className="flex flex-col p-6 sm:p-10">
          <div className="flex flex-wrap items-center gap-2"><StateBadge p={p} /></div>
          <h1 className="mt-3 text-[30px] font-bold leading-tight sm:text-[38px]">{m.title}</h1>
          <p className="mt-3 font-reading text-[17px] text-ink-muted">{m.summary}</p>
          {m.objective && (
            <div className="mt-5 flex gap-3 rounded-2xl bg-violet-50 p-4">
              <Target className="mt-0.5 size-5 shrink-0 text-violet-500" aria-hidden />
              <p className="text-[15px]"><strong className="font-semibold">Objectif :</strong> {m.objective}</p>
            </div>
          )}
          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-[14px] font-medium text-ink-muted">
            {p.total > 0 && <span className="inline-flex items-center gap-1.5"><PlayCircle className="size-4 text-violet-500" />{plural(p.total, "vidéo")}</span>}
            {p.total > 0 && <span className="inline-flex items-center gap-1.5"><Clock className="size-4 text-violet-500" />{p.durationKnown ? formatDuration(p.durationSeconds) : "Durée à venir"}</span>}
            {m.resources.length > 0 && <span className="inline-flex items-center gap-1.5"><Library className="size-4 text-violet-500" />{plural(m.resources.length, "ressource")}</span>}
          </div>
          {p.total > 0 && (
            <div className="mt-auto pt-7">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-semibold">{p.completed}/{p.total} vidéos terminées</span>
                <span className="font-display font-bold text-violet-600">{p.percent} %</span>
              </div>
              <ProgressBar value={p.percent} tone={p.state === "completed" ? "menthe" : "violet"} label="Progression du module" />
              <Link href={cta.href} className={buttonClass("primary", "lg", "mt-6 w-full sm:w-auto")}>
                <PlayCircle className="size-5" />
                {p.state === "completed" ? "Revoir le module" : p.state === "in_progress" ? "Reprendre" : "Commencer le module"}
              </Link>
            </div>
          )}
        </div>
      </section>

      {p.state === "completed" && (
        <div className="mt-6 flex items-center gap-4 rounded-3xl bg-menthe-100 p-5 animate-fade-up">
          <span className="grid size-12 shrink-0 animate-pop place-items-center rounded-full bg-gradient-to-br from-jaune-300 to-jaune-500 text-jaune-700"><Award className="size-6" /></span>
          <div>
            <p className="font-display font-bold text-menthe-700">Bien joué ! Vous avez terminé ce module.</p>
            <p className="text-sm text-menthe-700/80">Le badge « {m.title} » a été ajouté à votre progression.</p>
          </div>
        </div>
      )}

      <div className="mt-10 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <section aria-labelledby="chapitres">
          <h2 id="chapitres" className="text-[22px] font-bold">Chapitres du module</h2>
          {p.total === 0 ? (
            <EmptyState className="mt-4" compact icon={<Library />} title="Un module de ressources">
              Ce module rassemble des documents et des liens pratiques plutôt que des vidéos.
            </EmptyState>
          ) : (
            <>
              {withVideo < p.total && (
                <p className="mt-1 text-[14px] text-ink-muted">
                  {withVideo === 0 ? "Les vidéos de ce module sont en cours de préparation." : `${withVideo} vidéo${withVideo > 1 ? "s" : ""} disponible${withVideo > 1 ? "s" : ""}, les autres arrivent bientôt.`}
                </p>
              )}
              <ol className="mt-4 space-y-2.5 stagger">
                {m.lessons.map((l, i) => {
                  const pr = o.progress.get(l.id);
                  const doneL = pr?.status === "completed";
                  return (
                    <li key={l.id}>
                      <Link href={`/formations/${m.slug}/${l.id}`}
                        className="group flex items-center gap-4 rounded-3xl bg-white p-4 shadow-card transition hover:-translate-y-0.5 hover:shadow-lift sm:p-5">
                        <span className={cn("grid size-11 shrink-0 place-items-center rounded-2xl font-display text-[15px] font-bold transition",
                          doneL ? "bg-menthe-100 text-menthe-700" : pr ? "bg-violet-500 text-white" : "bg-violet-50 text-violet-600 group-hover:bg-violet-100")}>
                          {doneL ? <Check className="size-5" strokeWidth={3} /> : String(i + 1).padStart(2, "0")}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block font-display text-[16px] font-bold leading-snug">{l.title}</span>
                          <span className="mt-1 flex flex-wrap items-center gap-x-3 text-[13px] text-ink-faint">
                            {l.video_ref ? <span className="inline-flex items-center gap-1"><Clock className="size-3.5" />{formatDuration(l.duration_seconds) ?? "Vidéo"}</span>
                              : <span className="inline-flex items-center gap-1"><Lock className="size-3.5" />Vidéo en préparation</span>}
                            {doneL && <span className="inline-flex items-center gap-1 font-semibold text-menthe-700"><CircleCheckBig className="size-3.5" />Terminée</span>}
                            {pr && !doneL && <span className="font-semibold text-violet-600">{pr.last_position_seconds > 5 ? `Reprendre à ${formatTimecode(pr.last_position_seconds)}` : "Commencée"}</span>}
                          </span>
                        </span>
                        <PlayCircle className="size-6 shrink-0 text-violet-300 transition group-hover:scale-110 group-hover:text-violet-500" aria-hidden />
                      </Link>
                    </li>
                  );
                })}
              </ol>
            </>
          )}
        </section>

        <section aria-labelledby="ressources">
          <h2 id="ressources" className="text-[22px] font-bold">Ressources</h2>
          {m.resources.length === 0 ? (
            <EmptyState className="mt-4" compact icon={<Library />} title="Ressources à venir">
              Guides, fiches pratiques et documents PDF seront ajoutés ici par l&apos;équipe Yoovi.
            </EmptyState>
          ) : (
            <ul className="mt-4 grid gap-2.5">{m.resources.map((r) => <ResourceLink key={r.id} r={r} />)}</ul>
          )}
        </section>
      </div>
    </div>
  );
}
