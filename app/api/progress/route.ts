import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getSessionUser, accessState } from "@/lib/auth/session";
import { getVisibleCatalog, computeModuleProgress } from "@/lib/catalog";
import { getRepo } from "@/lib/data";

const body = z.object({
  lessonId: z.string().uuid(),
  type: z.enum(["view", "position", "complete"]),
  seconds: z.number().min(0).max(60 * 60 * 24).optional(),
});

/** Enregistre la progression de l'utilisateur connecté (lecteur vidéo, y compris via sendBeacon). */
export async function POST(request: NextRequest) {
  // Protection CSRF : uniquement depuis la plateforme elle-même
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) return NextResponse.json({ error: "Origine refusée" }, { status: 403 });

  const user = await getSessionUser();
  if (!user || accessState(user) !== "ok") return NextResponse.json({ error: "Non connecté" }, { status: 401 });

  let parsed;
  try {
    parsed = body.safeParse(JSON.parse(await request.text()));
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }
  if (!parsed.success) return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  const { lessonId, type, seconds } = parsed.data;

  // La leçon doit faire partie du catalogue visible par cet utilisateur
  const catalog = await getVisibleCatalog(user);
  const module = catalog.find((m) => m.lessons.some((l) => l.id === lessonId));
  const lesson = module?.lessons.find((l) => l.id === lessonId);
  if (!module || !lesson) return NextResponse.json({ error: "Vidéo introuvable" }, { status: 404 });

  const repo = await getRepo();
  const before = await repo.listProgress({ userId: user.id });
  const wasCompleted = computeModuleProgress(module, new Map(before.map((r) => [r.lesson_id, r]))).state === "completed";

  const row = await repo.saveProgress(
    user.id, lesson,
    type === "position" ? { type, seconds: seconds ?? 0 } : type === "complete" ? { type, seconds } : { type },
  );

  const after = new Map(before.map((r) => [r.lesson_id, r]));
  after.set(row.lesson_id, row);
  const mp = computeModuleProgress(module, after);
  return NextResponse.json({
    status: row.status,
    moduleCompleted: mp.state === "completed",
    justCompletedModule: !wasCompleted && mp.state === "completed",
    remaining: mp.total - mp.completed,
    percent: mp.percent,
  });
}
