import "server-only";
import { cache } from "react";
import { getRepo } from "@/lib/data";
import { isStaff } from "@/lib/auth/session";
import type { Lesson, LessonProgress, ModuleWithContent, SessionUser } from "@/lib/types";

export type ModuleState = "empty" | "not_started" | "in_progress" | "completed";

export interface ModuleProgress {
  module: ModuleWithContent;
  total: number;
  completed: number;
  started: number;
  percent: number;
  state: ModuleState;
  lastViewedAt: string | null;
  /** Prochain chapitre à suivre : le dernier ouvert non terminé, sinon le premier non terminé. */
  nextLesson: Lesson | null;
  durationSeconds: number;
  durationKnown: boolean;
}

export interface LearnerOverview {
  modules: ModuleProgress[];
  progress: Map<string, LessonProgress>;
  totalLessons: number;
  completedLessons: number;
  percent: number;
  counts: { completed: number; in_progress: number; not_started: number };
  recent: { module: ModuleWithContent; lesson: Lesson; progress: LessonProgress }[];
}

/**
 * Catalogue visible par un utilisateur dans l'espace de formation : modules et chapitres publiés,
 * limités aux modules ouverts à son organisme si son catalogue est personnalisé.
 * (Avec Supabase, la RLS applique déjà ces règles : ce filtre est une seconde barrière.)
 */
export const getVisibleCatalog = cache(async (user: SessionUser): Promise<ModuleWithContent[]> => {
  const repo = await getRepo();
  const all = await repo.listModules();
  let allowed: Set<string> | null = null;
  if (!isStaff(user) && user.organization?.catalog_mode === "custom") {
    allowed = new Set(await repo.listOrganizationModuleIds(user.organization.id));
  }
  return all
    .filter((m) => m.status === "published" && (!allowed || allowed.has(m.id)))
    .map((m) => ({ ...m, lessons: m.lessons.filter((l) => l.status === "published") }));
});

export function computeModuleProgress(module: ModuleWithContent, progress: Map<string, LessonProgress>): ModuleProgress {
  const rows = module.lessons.map((l) => progress.get(l.id)).filter(Boolean) as LessonProgress[];
  const completed = rows.filter((r) => r.status === "completed").length;
  const total = module.lessons.length;
  const lastViewed = rows.sort((a, b) => b.last_viewed_at.localeCompare(a.last_viewed_at))[0];
  const lastLesson = lastViewed && module.lessons.find((l) => l.id === lastViewed.lesson_id);
  const nextLesson =
    (lastLesson && lastViewed.status !== "completed" ? lastLesson : null) ??
    module.lessons.find((l) => progress.get(l.id)?.status !== "completed") ??
    null;
  const state: ModuleState =
    total === 0 ? "empty" : completed === total ? "completed" : rows.length > 0 ? "in_progress" : "not_started";
  return {
    module,
    total,
    completed,
    started: rows.length,
    percent: total ? Math.round((completed / total) * 100) : 0,
    state,
    lastViewedAt: lastViewed?.last_viewed_at ?? null,
    nextLesson,
    durationSeconds: module.lessons.reduce((s, l) => s + (l.duration_seconds ?? 0), 0),
    durationKnown: total > 0 && module.lessons.every((l) => l.duration_seconds != null),
  };
}

export const getLearnerOverview = cache(async (user: SessionUser): Promise<LearnerOverview> => {
  const repo = await getRepo();
  const [modules, rows] = await Promise.all([getVisibleCatalog(user), repo.listProgress({ userId: user.id })]);
  const progress = new Map(rows.map((r) => [r.lesson_id, r]));
  const perModule = modules.map((m) => computeModuleProgress(m, progress));
  const learnable = perModule.filter((m) => m.state !== "empty");
  const totalLessons = learnable.reduce((s, m) => s + m.total, 0);
  const completedLessons = learnable.reduce((s, m) => s + m.completed, 0);

  const lessonIndex = new Map(modules.flatMap((m) => m.lessons.map((l) => [l.id, { module: m, lesson: l }] as const)));
  const recent = rows
    .filter((r) => lessonIndex.has(r.lesson_id))
    .sort((a, b) => b.last_viewed_at.localeCompare(a.last_viewed_at))
    .slice(0, 6)
    .map((r) => ({ ...lessonIndex.get(r.lesson_id)!, progress: r }));

  return {
    modules: perModule,
    progress,
    totalLessons,
    completedLessons,
    percent: totalLessons ? Math.round((completedLessons / totalLessons) * 100) : 0,
    counts: {
      completed: learnable.filter((m) => m.state === "completed").length,
      in_progress: learnable.filter((m) => m.state === "in_progress").length,
      not_started: learnable.filter((m) => m.state === "not_started").length,
    },
    recent,
  };
});

/** Message d'encouragement sobre, adapté à l'avancement. */
export function encouragement(o: Pick<LearnerOverview, "percent" | "completedLessons" | "totalLessons">) {
  const left = o.totalLessons - o.completedLessons;
  if (o.totalLessons === 0) return "Les premières formations arrivent bientôt.";
  if (o.completedLessons === 0) return "Commencez par le premier module : quelques minutes suffisent pour découvrir Yoovi.";
  if (left === 0) return "Bravo, vous avez suivi l'ensemble des formations disponibles.";
  if (left === 1) return "Plus qu'une vidéo pour terminer l'ensemble des formations !";
  if (left === 2) return "Plus que deux vidéos pour terminer l'ensemble des formations !";
  if (o.percent >= 50) return "Vous avez passé la moitié du parcours. Continuez sur cette lancée !";
  return "Vous avancez dans votre découverte de Yoovi.";
}

export interface Badge { key: string; title: string; description: string; earned: boolean }

export function computeBadges(o: LearnerOverview): Badge[] {
  return [
    { key: "first", title: "Premier pas", description: "Terminer une première vidéo", earned: o.completedLessons >= 1 },
    ...o.modules
      .filter((m) => m.state !== "empty")
      .map((m) => ({
        key: m.module.id,
        title: m.module.title,
        description: m.state === "completed" ? "Module terminé" : `${m.completed}/${m.total} vidéos`,
        earned: m.state === "completed",
      })),
    { key: "half", title: "Mi-parcours", description: "Atteindre 50 % de progression", earned: o.percent >= 50 },
    { key: "all", title: "Parcours complet", description: "Terminer toutes les formations", earned: o.totalLessons > 0 && o.percent === 100 },
  ];
}
