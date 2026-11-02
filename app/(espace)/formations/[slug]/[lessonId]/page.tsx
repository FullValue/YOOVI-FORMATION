import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { getLearnerOverview } from "@/lib/catalog";
import { LessonPlayer } from "@/components/learning/LessonPlayer";

type Params = { params: Promise<{ slug: string; lessonId: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug, lessonId } = await params;
  const user = await requireUser();
  const o = await getLearnerOverview(user);
  const m = o.modules.find((x) => x.module.slug === slug);
  return { title: m?.module.lessons.find((l) => l.id === lessonId)?.title ?? "Vidéo" };
}

export default async function LessonPage({ params }: Params) {
  const { slug, lessonId } = await params;
  const user = await requireUser();
  const o = await getLearnerOverview(user);
  const idx = o.modules.findIndex((x) => x.module.slug === slug);
  const mp = o.modules[idx];
  const lesson = mp?.module.lessons.find((l) => l.id === lessonId);
  if (!mp || !lesson) notFound();

  const progress = o.progress.get(lesson.id);
  const next = o.modules.slice(idx + 1).find((m) => m.state !== "empty") ?? o.modules[idx + 1];

  return (
    <div className="pt-3 sm:pt-6">
      <nav aria-label="Fil d'Ariane" className="mb-4 flex min-w-0 items-center gap-1.5 text-[13px] font-medium text-ink-muted">
        <Link href="/formations" className="shrink-0 hover:text-violet-600">Formations</Link>
        <ChevronRight className="size-3.5 shrink-0" />
        <Link href={`/formations/${slug}`} className="truncate hover:text-violet-600">{mp.module.title}</Link>
        <ChevronRight className="hidden size-3.5 shrink-0 sm:block" />
        <span className="hidden truncate text-ink sm:block" aria-current="page">{lesson.title}</span>
      </nav>
      <LessonPlayer
        module={{ id: mp.module.id, slug: mp.module.slug, title: mp.module.title }}
        lessons={mp.module.lessons.map((l) => ({
          id: l.id, title: l.title, duration_seconds: l.duration_seconds, video_provider: l.video_provider, video_ref: l.video_ref,
          status: o.progress.get(l.id)?.status ?? null,
        }))}
        lesson={{ id: lesson.id, title: lesson.title, description: lesson.description, provider: lesson.video_provider, ref: lesson.video_ref, duration: lesson.duration_seconds }}
        startAt={progress && progress.status !== "completed" ? progress.last_position_seconds : 0}
        resources={mp.module.resources.map(({ id, title, kind, url, file_path }) => ({ id, title, kind, url, file_path }))}
        nextModule={next ? { slug: next.module.slug, title: next.module.title, firstLessonId: next.nextLesson?.id ?? next.module.lessons[0]?.id ?? null } : null}
      />
    </div>
  );
}
