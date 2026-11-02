import "server-only";
import { randomUUID } from "node:crypto";
import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";
import type { Repo } from "@/lib/data/repo";
import type { LessonProgress, ModuleWithContent, Organization, Profile } from "@/lib/types";
import { createAdminClient, createAnonClient, createUserClient } from "./clients";

const PROFILE_COLS = "id, email, full_name, job_title, role, organization_id, status, last_seen_at, created_at";
const RESET_REDIRECT = `${env.siteUrl}/auth/callback?next=/reinitialiser`;

function fail(error: PostgrestError | Error | null, fallback = "Opération impossible.") {
  if (!error) return;
  const msg = "code" in error && error.code === "23505" ? "Cette valeur est déjà utilisée." : error.message || fallback;
  throw new Error(msg);
}

function authMessage(message: string) {
  if (/invalid login credentials/i.test(message)) return "Adresse e-mail ou mot de passe incorrect.";
  if (/email not confirmed/i.test(message)) return "Votre invitation n'a pas encore été acceptée. Utilisez le lien reçu par e-mail.";
  if (/banned/i.test(message)) return "Ce compte est désactivé. Contactez support@yoovi.fr.";
  if (/rate limit/i.test(message)) return "Trop de tentatives. Patientez quelques minutes avant de réessayer.";
  if (/should be different/i.test(message)) return "Le nouveau mot de passe doit être différent de l'ancien.";
  return "Une erreur est survenue. Réessayez dans un instant.";
}

async function reorder(sb: SupabaseClient, table: string, ids: string[]) {
  const results = await Promise.all(ids.map((id, position) => sb.from(table).update({ position }).eq("id", id)));
  fail(results.find((r) => r.error)?.error ?? null);
}

export async function createSupabaseRepo(): Promise<Repo> {
  const sb = await createUserClient();

  return {
    backend: "supabase",

    async signIn(email, password) {
      const { error } = await sb.auth.signInWithPassword({ email, password });
      return error ? { ok: false, error: authMessage(error.message) } : { ok: true };
    },

    async signOut() {
      await sb.auth.signOut();
    },

    async currentUserId() {
      const { data } = await sb.auth.getUser();
      return data.user?.id ?? null;
    },

    async requestPasswordReset(email) {
      await createAnonClient().auth.resetPasswordForEmail(email, { redirectTo: RESET_REDIRECT });
      return {};
    },

    async canSetPassword() {
      const { data } = await sb.auth.getUser();
      return Boolean(data.user);
    },

    async setPassword(_token, password) {
      const { error } = await sb.auth.updateUser({ password });
      return error ? { ok: false, error: authMessage(error.message) } : { ok: true };
    },

    async changePassword(_userId, email, current, next) {
      const check = await createAnonClient().auth.signInWithPassword({ email, password: current });
      if (check.error) return { ok: false, error: "Le mot de passe actuel est incorrect." };
      const { error } = await sb.auth.updateUser({ password: next });
      return error ? { ok: false, error: authMessage(error.message) } : { ok: true };
    },

    async getProfile(id) {
      const { data, error } = await sb.from("profiles").select(PROFILE_COLS).eq("id", id).maybeSingle();
      fail(error);
      return data as Profile | null;
    },

    async listProfiles(filter) {
      let q = sb.from("profiles").select(PROFILE_COLS).order("email");
      if (filter?.organizationId) q = q.eq("organization_id", filter.organizationId);
      const { data, error } = await q;
      fail(error);
      return (data ?? []) as Profile[];
    },

    async getOrganization(id) {
      const { data, error } = await sb.from("organizations").select("*").eq("id", id).maybeSingle();
      fail(error);
      return data as Organization | null;
    },

    async listOrganizations() {
      const { data, error } = await sb.from("organizations").select("*").order("name");
      fail(error);
      return (data ?? []) as Organization[];
    },

    async getOrganizationNotes(id) {
      const { data } = await sb.from("organization_notes").select("notes").eq("organization_id", id).maybeSingle();
      return data?.notes ?? "";
    },

    async listOrganizationModuleIds(orgId) {
      const { data, error } = await sb.from("organization_modules").select("module_id").eq("organization_id", orgId);
      fail(error);
      return (data ?? []).map((r) => r.module_id as string);
    },

    async listModules() {
      const { data, error } = await sb
        .from("modules")
        .select("*, lessons(*), resources(*)")
        .order("position")
        .order("position", { referencedTable: "lessons" })
        .order("position", { referencedTable: "resources" });
      fail(error);
      return (data ?? []) as ModuleWithContent[];
    },

    async listProgress(filter) {
      let q = sb.from("lesson_progress").select("*");
      if (filter.userId) q = q.eq("user_id", filter.userId);
      if (filter.organizationId) q = q.eq("organization_id", filter.organizationId);
      const { data, error } = await q;
      fail(error);
      return (data ?? []) as LessonProgress[];
    },

    async saveProgress(userId, lesson, event) {
      const { data: existing } = await sb
        .from("lesson_progress").select("*").eq("user_id", userId).eq("lesson_id", lesson.id).maybeSingle();
      const t = new Date().toISOString();
      const patch: Partial<LessonProgress> = { last_viewed_at: t };
      if (event.type === "view") patch.view_count = (existing?.view_count ?? 0) + 1;
      if (event.type === "position") patch.last_position_seconds = Math.max(0, Math.round(event.seconds));
      if (event.type === "complete") {
        patch.status = "completed";
        if (event.seconds != null) patch.last_position_seconds = Math.round(event.seconds);
      }
      const query = existing
        ? sb.from("lesson_progress").update(patch).eq("user_id", userId).eq("lesson_id", lesson.id)
        : sb.from("lesson_progress").insert({ user_id: userId, lesson_id: lesson.id, module_id: lesson.module_id, view_count: 1, ...patch });
      const { data, error } = await query.select("*").single();
      fail(error);
      return data as LessonProgress;
    },

    async createOrganization(input) {
      const { data, error } = await sb.from("organizations").insert(input).select("*").single();
      fail(error);
      return data as Organization;
    },

    async updateOrganization(id, input) {
      const { error } = await sb.from("organizations").update(input).eq("id", id);
      fail(error);
    },

    async setOrganizationNotes(id, notes) {
      const { error } = await sb.from("organization_notes")
        .upsert({ organization_id: id, notes, updated_at: new Date().toISOString() });
      fail(error);
    },

    async setOrganizationModules(orgId, moduleIds) {
      const del = await sb.from("organization_modules").delete().eq("organization_id", orgId);
      fail(del.error);
      if (moduleIds.length) {
        const ins = await sb.from("organization_modules").insert(moduleIds.map((module_id) => ({ organization_id: orgId, module_id })));
        fail(ins.error);
      }
    },

    async deleteOrganization(id) {
      const { error } = await sb.from("organizations").delete().eq("id", id);
      fail(error);
    },

    async inviteUser(input) {
      const admin = createAdminClient();
      const { data, error } = await admin.auth.admin.inviteUserByEmail(input.email, {
        redirectTo: `${env.siteUrl}/auth/callback?next=${encodeURIComponent("/reinitialiser?invitation=1")}`,
        data: { full_name: input.full_name },
      });
      if (error) throw new Error(/already been registered/i.test(error.message) ? "Un compte existe déjà avec cette adresse e-mail." : error.message);
      const id = data.user.id;
      // Rôle et organisme : écrits avec la clé service_role (le profil a été créé par le trigger)
      const { error: upErr } = await admin.from("profiles").update({
        full_name: input.full_name, job_title: input.job_title, role: input.role, organization_id: input.organization_id,
      }).eq("id", id);
      fail(upErr);
      await admin.auth.admin.updateUserById(id, { app_metadata: { role: input.role, organization_id: input.organization_id } });
      return { id };
    },

    async updateProfile(id, patch) {
      const { error } = await sb.from("profiles").update(patch).eq("id", id);
      fail(error);
      if (patch.status) {
        // Bloque aussi la connexion côté Auth (et invalide les sessions au prochain rafraîchissement)
        const { error: banErr } = await createAdminClient().auth.admin.updateUserById(id, {
          ban_duration: patch.status === "disabled" ? "876000h" : "none",
        });
        fail(banErr);
      }
    },

    async sendAccessReset(email) {
      const { error } = await createAnonClient().auth.resetPasswordForEmail(email, { redirectTo: RESET_REDIRECT });
      fail(error);
      return {};
    },

    async deleteUser(id) {
      const { error } = await createAdminClient().auth.admin.deleteUser(id);
      fail(error);
    },

    async createModule(input) {
      const { count } = await sb.from("modules").select("id", { count: "exact", head: true });
      const { data, error } = await sb.from("modules").insert({ ...input, position: count ?? 0 }).select("*").single();
      fail(error);
      return data;
    },

    async updateModule(id, input) {
      const { error } = await sb.from("modules").update(input).eq("id", id);
      fail(error);
    },

    async deleteModule(id) {
      const { error } = await sb.from("modules").delete().eq("id", id);
      fail(error);
    },

    async reorderModules(ids) {
      await reorder(sb, "modules", ids);
    },

    async createLesson(moduleId, input) {
      const { count } = await sb.from("lessons").select("id", { count: "exact", head: true }).eq("module_id", moduleId);
      const { data, error } = await sb.from("lessons").insert({ ...input, module_id: moduleId, position: count ?? 0 }).select("*").single();
      fail(error);
      return data;
    },

    async updateLesson(id, input) {
      const { error } = await sb.from("lessons").update(input).eq("id", id);
      fail(error);
    },

    async deleteLesson(id) {
      const { error } = await sb.from("lessons").delete().eq("id", id);
      fail(error);
    },

    async reorderLessons(_moduleId, ids) {
      await reorder(sb, "lessons", ids);
    },

    async createResource(moduleId, input) {
      const { count } = await sb.from("resources").select("id", { count: "exact", head: true }).eq("module_id", moduleId);
      const { data, error } = await sb.from("resources").insert({ ...input, module_id: moduleId, position: count ?? 0 }).select("*").single();
      fail(error);
      return data;
    },

    async updateResource(id, input) {
      const { error } = await sb.from("resources").update(input).eq("id", id);
      fail(error);
    },

    async deleteResource(id) {
      const { data } = await sb.from("resources").select("file_path").eq("id", id).maybeSingle();
      const { error } = await sb.from("resources").delete().eq("id", id);
      fail(error);
      if (data?.file_path) await sb.storage.from("resources").remove([data.file_path]);
    },

    async reorderResources(_moduleId, ids) {
      await reorder(sb, "resources", ids);
    },

    async uploadFile(bucket, file) {
      const safe = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, "-").slice(-60);
      const key = `${new Date().getFullYear()}/${randomUUID().slice(0, 8)}-${safe}`;
      const { error } = await sb.storage.from(bucket).upload(key, file, { contentType: file.type, upsert: false });
      fail(error);
      return bucket === "thumbnails" ? sb.storage.from(bucket).getPublicUrl(key).data.publicUrl : key;
    },

    async fileResponse(rel, download) {
      const [bucket, ...rest] = rel.split("/");
      if (bucket !== "resources") return new Response("Introuvable", { status: 404 });
      // La création de l'URL signée passe par la RLS du stockage : refusée si le module n'est pas accessible
      const { data, error } = await sb.storage.from("resources").createSignedUrl(rest.join("/"), 60, { download });
      if (error || !data) return new Response("Accès refusé", { status: 403 });
      return Response.redirect(data.signedUrl, 302);
    },
  };
}
