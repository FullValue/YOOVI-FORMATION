"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft, ArrowRight, Award, Check, ChevronDown, CircleCheckBig, Clock, Download, ExternalLink, FileText, ListChecks, Lock, PlayCircle, RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { formatDuration, formatTimecode } from "@/lib/format";
import type { Lesson, ProgressStatus, Resource, VideoProvider } from "@/lib/types";
import { Button, buttonClass } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/Progress";
import { Dialog } from "@/components/ui/Dialog";
import { useToast } from "@/components/ui/Toast";
import { VideoPlayer } from "./VideoPlayer";
import { Confetti } from "./Celebration";

interface Props {
  module: { id: string; slug: string; title: string };
  lessons: (Pick<Lesson, "id" | "title" | "duration_seconds" | "video_provider" | "video_ref"> & { status: ProgressStatus | null })[];
  lesson: { id: string; title: string; description: string; provider: VideoProvider; ref: string | null; duration: number | null };
  startAt: number;
  resources: Pick<Resource, "id" | "title" | "kind" | "url" | "file_path">[];
  nextModule: { slug: string; title: string; firstLessonId: string | null } | null;
}

async function send(lessonId: string, type: "view" | "position" | "complete", seconds?: number) {
  const res = await fetch("/api/progress", {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify({ lessonId, type, seconds }),
    keepalive: true,
  });
  if (!res.ok) throw new Error((await res.json().catch(() => null))?.error ?? "Enregistrement impossible");
  return res.json() as Promise<{ status: ProgressStatus; moduleCompleted: boolean; justCompletedModule: boolean; remaining: number; percent: number }>;
}

export function LessonPlayer({ module, lessons: initial, lesson, startAt, resources, nextModule }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [lessons, setLessons] = useState(initial);
  const [pending, setPending] = useState(false);
  const [celebrate, setCelebrate] = useState(0);
  const [moduleDone, setModuleDone] = useState(false);
  const [chaptersOpen, setChaptersOpen] = useState(false);
  const lastSaved = useRef(startAt);
  const completing = useRef(false);
  const viewed = useRef<string | null>(null);

  const index = lessons.findIndex((l) => l.id === lesson.id);
  const current = lessons[index];
  const prev = lessons[index - 1];
  const next = lessons[index + 1];
  const done = current?.status === "completed";
  const completedCount = lessons.filter((l) => l.status === "completed").length;
  const remaining = lessons.length - completedCount;
  const percent = lessons.length ? Math.round((completedCount / lessons.length) * 100) : 0;

  useEffect(() => { setLessons(initial); }, [initial]);

  // Ouverture de la vidéo : compte une consultation et marque le chapitre « en cours »
  useEffect(() => {
    if (viewed.current !== lesson.id) {
      viewed.current = lesson.id;
      send(lesson.id, "view").catch(() => {});
    }
    setLessons((ls) => ls.map((l) => (l.id === lesson.id && !l.status ? { ...l, status: "in_progress" } : l)));
    lastSaved.current = startAt;
    completing.current = false;
  }, [lesson.id, startAt]);

  const markComplete = useCallback(async (seconds?: number, auto = false) => {
    if (completing.current) return;
    completing.current = true;
    setPending(true);
    try {
      const res = await send(lesson.id, "complete", seconds);
      setLessons((ls) => ls.map((l) => (l.id === lesson.id ? { ...l, status: "completed" } : l)));
      if (res.justCompletedModule) {
        setCelebrate((c) => c + 1);
        setModuleDone(true);
      } else if (res.remaining > 0) {
        toast("success", res.remaining <= 2
          ? res.remaining === 1 ? "Bien joué ! Plus qu'une vidéo pour terminer ce module." : "Bien joué ! Plus que deux vidéos pour terminer ce module."
          : auto ? "Vidéo terminée, elle a été enregistrée dans votre progression." : "Vidéo marquée comme terminée.");
      }
      router.refresh();
    } catch (e) {
      completing.current = false;
      toast("error", e instanceof Error ? e.message : "Enregistrement impossible");
    } finally {
      setPending(false);
    }
  }, [lesson.id, router, toast]);

  const onTime = useCallback((s: number, d: number) => {
    if (Math.abs(s - lastSaved.current) >= 15) {
      lastSaved.current = s;
      send(lesson.id, "position", s).catch(() => {});
    }
    // Considérée comme vue à 95 %
    if (d > 0 && s / d >= 0.95 && current?.status !== "completed") markComplete(s, true);
  }, [lesson.id, current?.status, markComplete]);

  const onPause = useCallback((s: number) => {
    if (s > 0 && Math.abs(s - lastSaved.current) >= 2) {
      lastSaved.current = s;
      send(lesson.id, "position", s).catch(() => {});
    }
  }, [lesson.id]);

  const href = (id: string) => `/formations/${module.slug}/${id}`;

  const chapterList = (
    <ol className="space-y-1">
      {lessons.map((l, i) => {
        const active = l.id === lesson.id;
        return (
          <li key={l.id}>
            <Link href={href(l.id)} aria-current={active ? "page" : undefined}
              className={cn("group flex items-start gap-3 rounded-2xl p-3 transition",
                active ? "bg-violet-500 text-white shadow-button" : "hover:bg-violet-50")}>
              <span className={cn("mt-0.5 grid size-7 shrink-0 place-items-center rounded-full text-[12px] font-bold",
                l.status === "completed" ? (active ? "bg-white text-menthe-700" : "bg-menthe-100 text-menthe-700")
                  : active ? "bg-white/20 text-white" : l.status === "in_progress" ? "bg-violet-100 text-violet-700" : "bg-violet-50 text-ink-faint ring-1 ring-ligne")}>
                {l.status === "completed" ? <Check className="size-4" strokeWidth={3} /> : i + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className={cn("block text-[14px] font-semibold leading-snug", !active && "text-ink")}>{l.title}</span>
                <span className={cn("mt-0.5 flex items-center gap-1.5 text-[12px]", active ? "text-white/75" : "text-ink-faint")}>
                  {l.video_ref ? (
                    <><PlayCircle className="size-3.5" />{formatDuration(l.duration_seconds) ?? "Vidéo"}</>
                  ) : (
                    <><Lock className="size-3.5" />Vidéo à venir</>
                  )}
                  {l.status === "in_progress" && !active && <span className="text-violet-600">· en cours</span>}
                </span>
              </span>
            </Link>
          </li>
        );
      })}
    </ol>
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-8">
      <Confetti fire={celebrate} />
      <div className="min-w-0">
        <VideoPlayer key={lesson.id} provider={lesson.provider} refId={lesson.ref} startAt={done ? 0 : startAt} title={lesson.title}
          onTime={onTime} onPause={onPause} onEnded={(d) => markComplete(d, true)} />

        {startAt > 5 && !done && lesson.ref && (
          <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-violet-100 px-3 py-1.5 text-[13px] font-semibold text-violet-700">
            <RotateCcw className="size-3.5" /> Reprise là où vous vous étiez arrêté ({formatTimecode(startAt)})
          </p>
        )}

        <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-[13px] font-semibold uppercase tracking-wide text-violet-500">
              Vidéo {index + 1} sur {lessons.length}
              {lesson.duration ? <span className="ml-2 inline-flex items-center gap-1 text-ink-faint normal-case tracking-normal"><Clock className="size-3.5" />{formatDuration(lesson.duration)}</span> : null}
            </p>
            <h1 className="mt-1.5 text-[24px] font-bold leading-tight sm:text-[30px]">{lesson.title}</h1>
          </div>
          {done ? (
            <span className="inline-flex shrink-0 items-center gap-2 self-start rounded-full bg-menthe-100 px-4 py-2.5 text-sm font-bold text-menthe-700 animate-pop">
              <CircleCheckBig className="size-[18px]" /> Vidéo terminée
            </span>
          ) : (
            <Button onClick={() => markComplete()} loading={pending} variant="dark" className="shrink-0 self-start" icon={<Check className="size-[18px]" />}>
              Marquer comme terminée
            </Button>
          )}
        </div>

        {lesson.description ? (
          <div className="mt-4 whitespace-pre-line font-reading text-[16px] leading-relaxed text-ink-muted">{lesson.description}</div>
        ) : (
          <p className="mt-4 font-reading text-[15px] italic text-ink-faint">La description de cette vidéo sera ajoutée prochainement.</p>
        )}

        {/* Navigation précédente / suivante */}
        <nav aria-label="Navigation entre les vidéos" className="mt-8 grid grid-cols-2 gap-3">
          {prev ? (
            <Link href={href(prev.id)} className="group flex items-center gap-3 rounded-2xl bg-white p-4 shadow-card transition hover:-translate-y-0.5 hover:shadow-lift">
              <ArrowLeft className="size-5 shrink-0 text-violet-500 transition group-hover:-translate-x-1" />
              <span className="min-w-0">
                <span className="block text-[12px] font-semibold uppercase tracking-wide text-ink-faint">Vidéo précédente</span>
                <span className="block truncate text-[14px] font-semibold">{prev.title}</span>
              </span>
            </Link>
          ) : <span />}
          {next ? (
            <Link href={href(next.id)}
              className={cn("group flex items-center justify-end gap-3 rounded-2xl p-4 text-right shadow-card transition hover:-translate-y-0.5 hover:shadow-lift",
                done ? "bg-violet-500 text-white" : "bg-white")}>
              <span className="min-w-0">
                <span className={cn("block text-[12px] font-semibold uppercase tracking-wide", done ? "text-white/75" : "text-ink-faint")}>Vidéo suivante</span>
                <span className="block truncate text-[14px] font-semibold">{next.title}</span>
              </span>
              <ArrowRight className={cn("size-5 shrink-0 transition group-hover:translate-x-1", done ? "text-white" : "text-violet-500")} />
            </Link>
          ) : nextModule ? (
            <Link href={nextModule.firstLessonId ? `/formations/${nextModule.slug}/${nextModule.firstLessonId}` : `/formations/${nextModule.slug}`}
              className="group flex items-center justify-end gap-3 rounded-2xl bg-white p-4 text-right shadow-card transition hover:-translate-y-0.5 hover:shadow-lift">
              <span className="min-w-0">
                <span className="block text-[12px] font-semibold uppercase tracking-wide text-ink-faint">Module suivant</span>
                <span className="block truncate text-[14px] font-semibold">{nextModule.title}</span>
              </span>
              <ArrowRight className="size-5 shrink-0 text-violet-500 transition group-hover:translate-x-1" />
            </Link>
          ) : <span />}
        </nav>

        {resources.length > 0 && (
          <section aria-labelledby="res-title" className="mt-10">
            <h2 id="res-title" className="text-lg font-bold">Ressources du module</h2>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {resources.map((r) => <ResourceLink key={r.id} r={r} />)}
            </ul>
          </section>
        )}
      </div>

      {/* Chapitres */}
      <aside className="lg:sticky lg:top-[104px] lg:self-start">
        <div className="surface overflow-hidden">
          <button onClick={() => setChaptersOpen((o) => !o)} aria-expanded={chaptersOpen}
            className="flex w-full items-center gap-3 p-5 text-left lg:pointer-events-none">
            <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-violet-100 text-violet-600"><ListChecks className="size-5" /></span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-display font-bold">{module.title}</span>
              <span className="block text-[13px] text-ink-muted">{completedCount}/{lessons.length} vidéos terminées · {percent} %</span>
            </span>
            <ChevronDown className={cn("size-5 text-ink-faint transition lg:hidden", chaptersOpen && "rotate-180")} />
          </button>
          <div className="px-5"><ProgressBar value={percent} size="sm" tone={percent === 100 ? "menthe" : "violet"} label="Progression du module" /></div>
          <p className="px-5 pt-3 text-[13px] font-medium text-ink-muted">
            {remaining === 0 ? "Bien joué ! Vous avez terminé ce module." : remaining <= 2 ? remaining === 1 ? "Plus qu'une vidéo pour terminer ce module !" : "Plus que deux vidéos pour terminer ce module !" : "Vous avancez dans votre découverte de Yoovi."}
          </p>
          <div className={cn("max-h-[60vh] overflow-y-auto p-3 pt-3 lg:block", !chaptersOpen && "hidden")}>{chapterList}</div>
        </div>
        <Link href={`/formations/${module.slug}`} className="mt-3 flex items-center justify-center gap-1.5 py-2 text-sm font-semibold text-violet-600 hover:underline">
          <ArrowLeft className="size-4" /> Présentation du module
        </Link>
      </aside>

      <Dialog open={moduleDone} onClose={() => setModuleDone(false)} title="Bien joué ! Vous avez terminé ce module."
        description={`Vous avez suivi toutes les vidéos de « ${module.title} ». Votre badge est débloqué.`}>
        <div className="mb-6 grid place-items-center">
          <span className="grid size-24 animate-pop place-items-center rounded-full bg-gradient-to-br from-jaune-300 to-jaune-500 text-jaune-700 shadow-lift ring-8 ring-jaune-100">
            <Award className="size-11" />
          </span>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Link href="/progression" className={buttonClass("secondary", "md")}>Voir ma progression</Link>
          {nextModule ? (
            <Link href={`/formations/${nextModule.slug}`} className={buttonClass("primary", "md")}>
              Module suivant <ArrowRight className="size-4" />
            </Link>
          ) : (
            <Link href="/tableau-de-bord" className={buttonClass("primary", "md")}>Retour à l&apos;accueil</Link>
          )}
        </div>
      </Dialog>
    </div>
  );
}

export function ResourceLink({ r }: { r: Pick<Resource, "id" | "title" | "kind" | "url" | "file_path"> }) {
  const isFile = Boolean(r.file_path);
  const href = isFile ? `/api/files/resources/${r.file_path}` : r.url!;
  return (
    <li>
      <a href={href} target="_blank" rel="noopener noreferrer"
        className="group flex items-center gap-3 rounded-2xl bg-white p-3.5 shadow-card transition hover:-translate-y-0.5 hover:shadow-lift">
        <span className={cn("grid size-10 shrink-0 place-items-center rounded-xl", isFile ? "bg-corail-100 text-corail-700" : "bg-bleu-100 text-bleu-600")}>
          {isFile ? <FileText className="size-5" /> : <ExternalLink className="size-5" />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[14px] font-semibold">{r.title}</span>
          <span className="text-[12px] text-ink-faint">{isFile ? "Document PDF" : "Lien externe"}</span>
        </span>
        {isFile ? <Download className="size-4 text-ink-faint group-hover:text-violet-600" /> : <ArrowRight className="size-4 text-ink-faint group-hover:text-violet-600" />}
      </a>
    </li>
  );
}
