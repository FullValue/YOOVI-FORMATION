"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { assertStaff, isSuperAdmin } from "@/lib/auth/session";
import { getRepo } from "@/lib/data";
import { slugify } from "@/lib/format";
import { parseVideoInput } from "@/lib/video";
import { isDemoMode } from "@/lib/env";
import { saveUploadedVideo } from "@/lib/media";
import type { ActionResult, SessionUser } from "@/lib/types";
import { MODULE_COLORS, MODULE_ICONS } from "@/components/learning/icons";

/* Toutes les actions vérifient le rôle de l'appelant (assertStaff) : une action serveur est un
   point d'entrée HTTP à part entière. Avec Supabase, la RLS applique les mêmes règles en base. */

type Result<T = undefined> = ActionResult<T>;

async function run<T>(fn: (actor: SessionUser) => Promise<Result<T>>): Promise<Result<T>> {
  try {
    const actor = await assertStaff();
    const res = await fn(actor);
    if (res.ok) revalidatePath("/", "layout");
    return res;
  } catch (e) {
    if (e && typeof e === "object" && "digest" in e && String((e as { digest: unknown }).digest).startsWith("NEXT_REDIRECT")) throw e;
    return { ok: false, error: e instanceof Error ? e.message : "Une erreur est survenue." };
  }
}

function invalid(error: z.ZodError): Result<never> {
  const fieldErrors: Record<string, string> = {};
  for (const i of error.issues) fieldErrors[String(i.path[0])] ??= i.message;
  return { ok: false, error: error.issues[0].message, fieldErrors };
}

const optText = (max = 200) => z.string().trim().max(max).optional().transform((v) => v || null);
const str = (form: FormData, k: string) => (form.get(k) as string | null) ?? undefined;

// ─── Partenaires ─────────────────────────────────────────────────────────────

const orgSchema = z.object({
  name: z.string().trim().min(2, "Le nom doit contenir au moins 2 caractères.").max(120),
  kind: z.string().trim().min(1).max(60).default("Autre"),
  city: optText(80),
  contact_name: optText(120),
  contact_email: z.string().trim().toLowerCase().email("Adresse e-mail invalide.").optional().or(z.literal("")).transform((v) => v || null),
  status: z.enum(["active", "inactive"]).default("active"),
});

const orgFields = (form: FormData) => ({
  name: str(form, "name"), kind: str(form, "kind"), city: str(form, "city"),
  contact_name: str(form, "contact_name"), contact_email: str(form, "contact_email"), status: str(form, "status"),
});

export async function createOrganizationAction(_: Result<{ id: string }> | null, form: FormData): Promise<Result<{ id: string }>> {
  return run<{ id: string }>(async () => {
    const parsed = orgSchema.safeParse(orgFields(form));
    if (!parsed.success) return invalid(parsed.error);
    const repo = await getRepo();
    const org = await repo.createOrganization({ ...parsed.data, catalog_mode: "all" });
    return { ok: true, message: `Le partenaire « ${org.name} » a été créé.`, data: { id: org.id } };
  });
}

export async function updateOrganizationAction(id: string, _: Result | null, form: FormData): Promise<Result> {
  return run(async () => {
    const parsed = orgSchema.safeParse(orgFields(form));
    if (!parsed.success) return invalid(parsed.error);
    const repo = await getRepo();
    await repo.updateOrganization(id, parsed.data);
    return { ok: true, message: "Informations du partenaire enregistrées." };
  });
}

export async function setOrganizationStatusAction(id: string, status: "active" | "inactive"): Promise<Result> {
  return run(async () => {
    const repo = await getRepo();
    await repo.updateOrganization(id, { status });
    return { ok: true, message: status === "active" ? "Le partenaire est réactivé." : "Le partenaire est désactivé : ses utilisateurs n'ont plus accès à la plateforme." };
  });
}

export async function saveOrganizationNotesAction(id: string, _: Result | null, form: FormData): Promise<Result> {
  return run(async () => {
    const repo = await getRepo();
    await repo.setOrganizationNotes(id, String(form.get("notes") ?? "").slice(0, 5000));
    return { ok: true, message: "Notes enregistrées." };
  });
}

export async function saveOrganizationCatalogAction(id: string, _: Result | null, form: FormData): Promise<Result> {
  return run(async () => {
    const mode = form.get("catalog_mode") === "custom" ? "custom" : "all";
    const moduleIds = form.getAll("modules").map(String);
    const repo = await getRepo();
    await repo.updateOrganization(id, { catalog_mode: mode });
    await repo.setOrganizationModules(id, mode === "custom" ? moduleIds : []);
    return { ok: true, message: mode === "all" ? "Ce partenaire accède à tout le catalogue publié." : `Catalogue personnalisé : ${moduleIds.length} module(s) ouvert(s).` };
  });
}

export async function deleteOrganizationAction(id: string): Promise<Result> {
  const res = await run(async (actor) => {
    if (!isSuperAdmin(actor)) return { ok: false, error: "Seul un super administrateur peut supprimer un partenaire." };
    const repo = await getRepo();
    await repo.deleteOrganization(id);
    return { ok: true, message: "Partenaire supprimé." };
  });
  if (res.ok) redirect("/admin/partenaires?supprime=1");
  return res;
}

// ─── Utilisateurs ───────────────────────────────────────────────────────────

const inviteSchema = z.object({
  email: z.string().trim().toLowerCase().email("Adresse e-mail invalide."),
  full_name: optText(80),
  job_title: optText(80),
  role: z.enum(["partner", "admin", "super_admin"]).default("partner"),
  organization_id: z.string().uuid().optional().or(z.literal("")).transform((v) => v || null),
});

export async function inviteUserAction(_: Result<{ demoLink?: string; email: string }> | null, form: FormData): Promise<Result<{ demoLink?: string; email: string }>> {
  return run<{ demoLink?: string; email: string }>(async (actor) => {
    const parsed = inviteSchema.safeParse({
      email: str(form, "email"), full_name: str(form, "full_name"), job_title: str(form, "job_title"),
      role: str(form, "role") || "partner", organization_id: str(form, "organization_id"),
    });
    if (!parsed.success) return invalid(parsed.error);
    const input = parsed.data;
    if (input.role !== "partner" && !isSuperAdmin(actor)) {
      return { ok: false, error: "Seul un super administrateur peut créer un compte administrateur." };
    }
    if (input.role === "partner" && !input.organization_id) {
      return { ok: false, error: "Choisissez l'organisme de cet utilisateur.", fieldErrors: { organization_id: "Choisissez un organisme." } };
    }
    const repo = await getRepo();
    if (input.organization_id) {
      const org = await repo.getOrganization(input.organization_id);
      if (!org) return { ok: false, error: "Organisme introuvable." };
    }
    const { demoLink } = await repo.inviteUser({ ...input, organization_id: input.role === "partner" ? input.organization_id : null });
    return {
      ok: true,
      message: demoLink ? "Compte créé. Mode démo : copiez le lien d'activation ci-dessous." : `Invitation envoyée à ${input.email}.`,
      data: { demoLink, email: input.email },
    };
  });
}

async function guardTarget(actor: SessionUser, id: string) {
  const repo = await getRepo();
  const target = await repo.getProfile(id);
  if (!target) throw new Error("Utilisateur introuvable.");
  if (target.role !== "partner" && !isSuperAdmin(actor) && target.id !== actor.id) {
    throw new Error("Seul un super administrateur peut modifier un compte de l'équipe Yoovi.");
  }
  return { repo, target };
}

const updateUserSchema = z.object({
  full_name: optText(80),
  job_title: optText(80),
  role: z.enum(["partner", "admin", "super_admin"]),
  organization_id: z.string().uuid().optional().or(z.literal("")).transform((v) => v || null),
});

export async function updateUserAction(id: string, _: Result | null, form: FormData): Promise<Result> {
  return run(async (actor) => {
    const { repo, target } = await guardTarget(actor, id);
    const parsed = updateUserSchema.safeParse({
      full_name: str(form, "full_name"), job_title: str(form, "job_title"),
      role: str(form, "role") || target.role, organization_id: str(form, "organization_id"),
    });
    if (!parsed.success) return invalid(parsed.error);
    const data = parsed.data;
    if (data.role !== target.role) {
      if (!isSuperAdmin(actor)) return { ok: false, error: "Seul un super administrateur peut changer un rôle." };
      if (target.id === actor.id) return { ok: false, error: "Vous ne pouvez pas modifier votre propre rôle." };
    }
    if (data.role === "partner" && !data.organization_id) {
      return { ok: false, error: "Un utilisateur partenaire doit être rattaché à un organisme.", fieldErrors: { organization_id: "Choisissez un organisme." } };
    }
    await repo.updateProfile(id, { ...data, organization_id: data.role === "partner" ? data.organization_id : null });
    return { ok: true, message: "Utilisateur mis à jour." };
  });
}

export async function setUserStatusAction(id: string, status: "active" | "disabled"): Promise<Result> {
  return run(async (actor) => {
    if (id === actor.id) return { ok: false, error: "Vous ne pouvez pas désactiver votre propre compte." };
    const { repo, target } = await guardTarget(actor, id);
    const next = status === "active" ? (target.last_seen_at ? "active" : "invited") : "disabled";
    await repo.updateProfile(id, { status: next });
    return { ok: true, message: status === "disabled" ? "Compte désactivé : l'utilisateur ne peut plus se connecter." : "Compte réactivé." };
  });
}

export async function resetAccessAction(id: string): Promise<Result<{ demoLink?: string }>> {
  return run(async (actor) => {
    const { repo, target } = await guardTarget(actor, id);
    const { demoLink } = await repo.sendAccessReset(target.email);
    return {
      ok: true,
      message: demoLink ? "Lien généré (mode démo : aucun e-mail envoyé)." : `Un lien de réinitialisation a été envoyé à ${target.email}.`,
      data: { demoLink },
    };
  });
}

export async function deleteUserAction(id: string): Promise<Result> {
  return run(async (actor) => {
    if (!isSuperAdmin(actor)) return { ok: false, error: "Seul un super administrateur peut supprimer un compte." };
    if (id === actor.id) return { ok: false, error: "Vous ne pouvez pas supprimer votre propre compte." };
    const repo = await getRepo();
    await repo.deleteUser(id);
    return { ok: true, message: "Compte supprimé définitivement." };
  });
}

// ─── Modules ───────────────────────────────────────────────────────────────

const moduleSchema = z.object({
  title: z.string().trim().min(2, "Le titre doit contenir au moins 2 caractères.").max(120),
  slug: z.string().trim().max(80).optional(),
  summary: z.string().trim().max(300, "300 caractères maximum.").default(""),
  objective: z.string().trim().max(400, "400 caractères maximum.").default(""),
  icon: z.string().refine((v) => v in MODULE_ICONS, "Icône inconnue.").default("sparkles"),
  color: z.string().refine((v) => v in MODULE_COLORS, "Couleur inconnue.").default("violet"),
  thumbnail_url: z.string().trim().url("Adresse d'image invalide.").optional().or(z.literal("")).transform((v) => v || null),
  status: z.enum(["draft", "published"]).default("draft"),
});

async function moduleData(form: FormData) {
  const parsed = moduleSchema.safeParse({
    title: str(form, "title"), slug: str(form, "slug"), summary: str(form, "summary") ?? "", objective: str(form, "objective") ?? "",
    icon: str(form, "icon") || "sparkles", color: str(form, "color") || "violet",
    thumbnail_url: str(form, "thumbnail_url"), status: str(form, "status") || "draft",
  });
  if (!parsed.success) return { error: invalid(parsed.error) };
  const slug = slugify(parsed.data.slug || parsed.data.title);
  if (!slug) return { error: { ok: false as const, error: "Adresse du module invalide.", fieldErrors: { slug: "Adresse invalide." } } };
  let thumbnail_url = parsed.data.thumbnail_url;
  const file = form.get("thumbnail_file");
  if (file instanceof File && file.size > 0) {
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) return { error: { ok: false as const, error: "Miniature : formats acceptés PNG, JPG ou WebP." } };
    if (file.size > 5 * 1024 * 1024) return { error: { ok: false as const, error: "Miniature : 5 Mo maximum." } };
    thumbnail_url = await (await getRepo()).uploadFile("thumbnails", file);
  }
  if (form.get("remove_thumbnail") === "1") thumbnail_url = null;
  return { data: { ...parsed.data, slug, thumbnail_url } };
}

export async function createModuleAction(_: Result | null, form: FormData): Promise<Result> {
  let id: string | null = null;
  const res = await run(async () => {
    const r = await moduleData(form);
    if ("error" in r) return r.error as Result;
    const mod = await (await getRepo()).createModule(r.data!);
    id = mod.id;
    return { ok: true, message: "Module créé." };
  });
  if (res.ok && id) redirect(`/admin/modules/${id}?cree=1`);
  return res;
}

export async function updateModuleAction(id: string, _: Result | null, form: FormData): Promise<Result> {
  return run(async () => {
    const r = await moduleData(form);
    if ("error" in r) return r.error as Result;
    await (await getRepo()).updateModule(id, r.data!);
    return { ok: true, message: "Module enregistré." };
  });
}

export async function setModuleStatusAction(id: string, status: "draft" | "published"): Promise<Result> {
  return run(async () => {
    await (await getRepo()).updateModule(id, { status });
    return { ok: true, message: status === "published" ? "Module publié : il est visible par les partenaires." : "Module dépublié : il n'est plus visible par les partenaires." };
  });
}

export async function deleteModuleAction(id: string): Promise<Result> {
  const res = await run(async () => {
    await (await getRepo()).deleteModule(id);
    return { ok: true, message: "Module supprimé." };
  });
  if (res.ok) redirect("/admin/modules?supprime=1");
  return res;
}

export async function reorderModulesAction(ids: string[]): Promise<Result> {
  return run(async () => {
    await (await getRepo()).reorderModules(z.array(z.string().uuid()).parse(ids));
    return { ok: true };
  });
}

// ─── Vidéos (chapitres) ─────────────────────────────────────────────────────

function parseDuration(v: string | undefined) {
  const s = (v ?? "").trim();
  if (!s) return { value: null };
  const m = s.match(/^(?:(\d+):)?(\d{1,2}):(\d{2})$/) ?? s.match(/^(\d+)$/);
  if (!m) return { error: "Format attendu : mm:ss (ex. 4:30) ou un nombre de minutes." };
  if (m.length === 2) return { value: Number(m[1]) * 60 };
  return { value: Number(m[1] ?? 0) * 3600 + Number(m[2]) * 60 + Number(m[3]) };
}

const lessonSchema = z.object({
  title: z.string().trim().min(2, "Le titre doit contenir au moins 2 caractères.").max(160),
  description: z.string().trim().max(4000).default(""),
  status: z.enum(["draft", "published"]).default("published"),
});

async function lessonData(form: FormData) {
  const file = form.get("videoFile");
  if (file instanceof File && file.size > 0) {
    if (!isDemoMode) return { error: { ok: false as const, error: "L'import de fichier n'est disponible qu'en mode local : utilisez un lien.", fieldErrors: { video: "Import indisponible." } } };
    if (!/\.(mp4|webm|mov|m4v)$/i.test(file.name)) return { error: { ok: false as const, error: "Format accepté : MP4, WebM ou MOV.", fieldErrors: { video: "Format non pris en charge." } } };
    form.set("video", await saveUploadedVideo(file));
  }
  const parsed = lessonSchema.safeParse({ title: str(form, "title"), description: str(form, "description") ?? "", status: str(form, "status") || "published" });
  if (!parsed.success) return { error: invalid(parsed.error) };
  const video = parseVideoInput(String(form.get("video") ?? ""));
  if (!video) return { error: { ok: false as const, error: "Lien vidéo non reconnu : utilisez un lien YouTube, Vimeo ou un fichier .mp4 en https.", fieldErrors: { video: "Lien non reconnu." } } };
  const duration = parseDuration(str(form, "duration"));
  if (duration.error) return { error: { ok: false as const, error: duration.error, fieldErrors: { duration: duration.error } } };
  return { data: { ...parsed.data, video_provider: video.provider, video_ref: video.ref, duration_seconds: duration.value ?? null } };
}

export async function createLessonAction(moduleId: string, _: Result | null, form: FormData): Promise<Result> {
  return run(async () => {
    const r = await lessonData(form);
    if ("error" in r) return r.error as Result;
    await (await getRepo()).createLesson(moduleId, r.data!);
    return { ok: true, message: "Vidéo ajoutée au module." };
  });
}

export async function updateLessonAction(id: string, _: Result | null, form: FormData): Promise<Result> {
  return run(async () => {
    const r = await lessonData(form);
    if ("error" in r) return r.error as Result;
    await (await getRepo()).updateLesson(id, r.data!);
    return { ok: true, message: "Vidéo enregistrée." };
  });
}

export async function deleteLessonAction(id: string): Promise<Result> {
  return run(async () => {
    await (await getRepo()).deleteLesson(id);
    return { ok: true, message: "Vidéo supprimée." };
  });
}

export async function reorderLessonsAction(moduleId: string, ids: string[]): Promise<Result> {
  return run(async () => {
    await (await getRepo()).reorderLessons(moduleId, z.array(z.string().uuid()).parse(ids));
    return { ok: true };
  });
}

// ─── Ressources ────────────────────────────────────────────────────────────

export async function createResourceAction(moduleId: string, _: Result | null, form: FormData): Promise<Result> {
  return run<undefined>(async (): Promise<Result> => {
    const title = String(form.get("title") ?? "").trim();
    const description = String(form.get("description") ?? "").trim().slice(0, 500);
    if (title.length < 2) return { ok: false, error: "Indiquez un titre.", fieldErrors: { title: "Indiquez un titre." } };
    const repo = await getRepo();
    const file = form.get("file");
    if (file instanceof File && file.size > 0) {
      if (file.type !== "application/pdf") return { ok: false, error: "Seuls les fichiers PDF sont acceptés.", fieldErrors: { file: "PDF uniquement." } };
      if (file.size > 25 * 1024 * 1024) return { ok: false, error: "25 Mo maximum.", fieldErrors: { file: "25 Mo maximum." } };
      const path = await repo.uploadFile("resources", file);
      await repo.createResource(moduleId, { title, description, kind: "pdf", file_path: path, url: null });
      return { ok: true, message: "Document PDF ajouté." };
    }
    const url = z.string().trim().url().refine((u) => u.startsWith("https://"), "Le lien doit commencer par https://").safeParse(form.get("url"));
    if (!url.success) return { ok: false, error: "Ajoutez un fichier PDF ou un lien https.", fieldErrors: { url: "Lien https requis (ou un PDF)." } };
    await repo.createResource(moduleId, { title, description, kind: url.data.toLowerCase().endsWith(".pdf") ? "pdf" : "link", url: url.data, file_path: null });
    return { ok: true, message: "Lien ajouté." };
  });
}

export async function deleteResourceAction(id: string): Promise<Result> {
  return run(async () => {
    await (await getRepo()).deleteResource(id);
    return { ok: true, message: "Ressource supprimée." };
  });
}

export async function reorderResourcesAction(moduleId: string, ids: string[]): Promise<Result> {
  return run(async () => {
    await (await getRepo()).reorderResources(moduleId, z.array(z.string().uuid()).parse(ids));
    return { ok: true };
  });
}

