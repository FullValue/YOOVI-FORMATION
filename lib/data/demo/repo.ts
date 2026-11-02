import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { cookies } from "next/headers";
import { env } from "@/lib/env";
import type { Repo } from "@/lib/data/repo";
import type { LessonProgress, Module, ModuleWithContent } from "@/lib/types";
import { DATA_DIR, db, hashPassword, now, persist, randomUUID, verifyPassword } from "./store";

const COOKIE = "yv_demo_session";
const SESSION_DAYS = 7;

function sign(value: string) {
  return createHmac("sha256", db().secret).update(value).digest("hex");
}

function readSession(raw: string | undefined): string | null {
  if (!raw) return null;
  const [userId, expires, mac] = raw.split(".");
  if (!userId || !expires || !mac) return null;
  const expected = Buffer.from(sign(`${userId}.${expires}`));
  const given = Buffer.from(mac);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  if (Number(expires) < Date.now()) return null;
  return userId;
}

function issueToken(userId: string, purpose: "invite" | "recovery") {
  const d = db();
  const token = randomBytes(24).toString("base64url");
  const days = purpose === "invite" ? 7 : 1;
  d.tokens = d.tokens.filter((t) => !(t.user_id === userId && t.purpose === purpose));
  d.tokens.push({ token, user_id: userId, purpose, expires_at: new Date(Date.now() + days * 864e5).toISOString() });
  persist();
  return `${env.siteUrl}/reinitialiser?token=${token}${purpose === "invite" ? "&invitation=1" : ""}`;
}

function findToken(token: string | null) {
  if (!token) return null;
  const t = db().tokens.find((x) => x.token === token);
  return t && new Date(t.expires_at) > new Date() ? t : null;
}

const byPosition = <T extends { position: number }>(a: T, b: T) => a.position - b.position;

function reorder<T extends { id: string; position: number }>(items: T[], ids: string[]) {
  ids.forEach((id, i) => {
    const item = items.find((x) => x.id === id);
    if (item) item.position = i;
  });
}

function mustFind<T extends { id: string }>(items: T[], id: string, what: string): T {
  const item = items.find((x) => x.id === id);
  if (!item) throw new Error(`${what} introuvable`);
  return item;
}

export function createDemoRepo(): Repo {
  return {
    backend: "demo",

    async signIn(email, password) {
      const d = db();
      const user = d.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
      if (!user || !verifyPassword(password, user.password_hash)) {
        return { ok: false, error: "Adresse e-mail ou mot de passe incorrect." };
      }
      const profile = d.profiles.find((p) => p.id === user.id);
      if (profile) {
        profile.last_seen_at = now();
        if (profile.status === "invited") profile.status = "active";
        persist();
      }
      const expires = Date.now() + SESSION_DAYS * 864e5;
      const value = `${user.id}.${expires}`;
      (await cookies()).set(COOKIE, `${value}.${sign(value)}`, {
        httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/",
        expires: new Date(expires),
      });
      return { ok: true };
    },

    async signOut() {
      (await cookies()).delete(COOKIE);
    },

    async currentUserId() {
      return readSession((await cookies()).get(COOKIE)?.value);
    },

    async requestPasswordReset(email) {
      const user = db().users.find((u) => u.email.toLowerCase() === email.toLowerCase());
      // Même réponse que l'adresse existe ou non (pas d'énumération de comptes)
      if (!user) return {};
      return { demoLink: issueToken(user.id, "recovery") };
    },

    async canSetPassword(token) {
      return Boolean(findToken(token));
    },

    async setPassword(token, password) {
      const t = findToken(token);
      if (!t) return { ok: false, error: "Ce lien a expiré ou a déjà été utilisé. Demandez un nouveau lien." };
      const d = db();
      const user = d.users.find((u) => u.id === t.user_id);
      if (!user) return { ok: false, error: "Compte introuvable." };
      user.password_hash = hashPassword(password);
      d.tokens = d.tokens.filter((x) => x.token !== token);
      persist();
      return { ok: true };
    },

    async changePassword(userId, _email, current, next) {
      const user = db().users.find((u) => u.id === userId);
      if (!user || !verifyPassword(current, user.password_hash)) return { ok: false, error: "Le mot de passe actuel est incorrect." };
      user.password_hash = hashPassword(next);
      persist();
      return { ok: true };
    },

    async getProfile(id) {
      return db().profiles.find((p) => p.id === id) ?? null;
    },

    async listProfiles(filter) {
      return db().profiles
        .filter((p) => !filter?.organizationId || p.organization_id === filter.organizationId)
        .sort((a, b) => a.email.localeCompare(b.email));
    },

    async getOrganization(id) {
      return db().organizations.find((o) => o.id === id) ?? null;
    },

    async listOrganizations() {
      return [...db().organizations].sort((a, b) => a.name.localeCompare(b.name, "fr"));
    },

    async getOrganizationNotes(id) {
      return db().organization_notes[id] ?? "";
    },

    async listOrganizationModuleIds(orgId) {
      return db().organization_modules.filter((x) => x.organization_id === orgId).map((x) => x.module_id);
    },

    async listModules() {
      const d = db();
      return [...d.modules].sort(byPosition).map<ModuleWithContent>((m) => ({
        ...m,
        lessons: d.lessons.filter((l) => l.module_id === m.id).sort(byPosition),
        resources: d.resources.filter((r) => r.module_id === m.id).sort(byPosition),
      }));
    },

    async listProgress(filter) {
      return db().progress.filter(
        (p) => (!filter.userId || p.user_id === filter.userId) && (!filter.organizationId || p.organization_id === filter.organizationId),
      );
    },

    async saveProgress(userId, lesson, event) {
      const d = db();
      const t = now();
      let row = d.progress.find((p) => p.user_id === userId && p.lesson_id === lesson.id);
      if (!row) {
        const profile = d.profiles.find((p) => p.id === userId);
        row = {
          user_id: userId, lesson_id: lesson.id, module_id: lesson.module_id,
          organization_id: profile?.organization_id ?? null, status: "in_progress",
          last_position_seconds: 0, view_count: 0, first_viewed_at: t, last_viewed_at: t, completed_at: null,
        } satisfies LessonProgress;
        d.progress.push(row);
      }
      row.last_viewed_at = t;
      if (event.type === "view") row.view_count += 1;
      if (event.type === "position") row.last_position_seconds = Math.max(0, Math.round(event.seconds));
      if (event.type === "complete") {
        if (event.seconds != null) row.last_position_seconds = Math.round(event.seconds);
        if (row.status !== "completed") { row.status = "completed"; row.completed_at = t; }
      }
      persist();
      return row;
    },

    async createOrganization(input) {
      const t = now();
      const org = { id: randomUUID(), ...input, created_at: t, updated_at: t };
      db().organizations.push(org);
      persist();
      return org;
    },

    async updateOrganization(id, input) {
      Object.assign(mustFind(db().organizations, id, "Partenaire"), input, { updated_at: now() });
      persist();
    },

    async setOrganizationNotes(id, notes) {
      db().organization_notes[id] = notes;
      persist();
    },

    async setOrganizationModules(orgId, moduleIds) {
      const d = db();
      d.organization_modules = d.organization_modules
        .filter((x) => x.organization_id !== orgId)
        .concat(moduleIds.map((module_id) => ({ organization_id: orgId, module_id })));
      persist();
    },

    async deleteOrganization(id) {
      const d = db();
      d.organizations = d.organizations.filter((o) => o.id !== id);
      d.organization_modules = d.organization_modules.filter((x) => x.organization_id !== id);
      delete d.organization_notes[id];
      for (const p of d.profiles) if (p.organization_id === id) { p.organization_id = null; p.status = "disabled"; }
      for (const p of d.progress) if (p.organization_id === id) p.organization_id = null;
      persist();
    },

    async inviteUser(input) {
      const d = db();
      if (d.users.some((u) => u.email.toLowerCase() === input.email.toLowerCase())) {
        throw new Error("Un compte existe déjà avec cette adresse e-mail.");
      }
      const id = randomUUID();
      d.users.push({ id, email: input.email, password_hash: null });
      d.profiles.push({ id, ...input, status: "invited", last_seen_at: null, created_at: now() });
      persist();
      return { id, demoLink: issueToken(id, "invite") };
    },

    async updateProfile(id, patch) {
      Object.assign(mustFind(db().profiles, id, "Utilisateur"), patch);
      persist();
    },

    async sendAccessReset(email) {
      const user = db().users.find((u) => u.email.toLowerCase() === email.toLowerCase());
      if (!user) throw new Error("Compte introuvable.");
      const profile = db().profiles.find((p) => p.id === user.id);
      return { demoLink: issueToken(user.id, profile?.status === "invited" ? "invite" : "recovery") };
    },

    async deleteUser(id) {
      const d = db();
      d.users = d.users.filter((u) => u.id !== id);
      d.profiles = d.profiles.filter((p) => p.id !== id);
      d.progress = d.progress.filter((p) => p.user_id !== id);
      d.tokens = d.tokens.filter((t) => t.user_id !== id);
      persist();
    },

    async createModule(input) {
      const d = db();
      if (d.modules.some((m) => m.slug === input.slug)) throw new Error("Cette adresse (slug) est déjà utilisée par un autre module.");
      const t = now();
      const mod: Module = { id: randomUUID(), ...input, position: d.modules.length, created_at: t, updated_at: t };
      d.modules.push(mod);
      persist();
      return mod;
    },

    async updateModule(id, input) {
      const d = db();
      if (input.slug && d.modules.some((m) => m.slug === input.slug && m.id !== id)) {
        throw new Error("Cette adresse (slug) est déjà utilisée par un autre module.");
      }
      Object.assign(mustFind(d.modules, id, "Module"), input, { updated_at: now() });
      persist();
    },

    async deleteModule(id) {
      const d = db();
      const lessonIds = new Set(d.lessons.filter((l) => l.module_id === id).map((l) => l.id));
      d.modules = d.modules.filter((m) => m.id !== id);
      d.lessons = d.lessons.filter((l) => l.module_id !== id);
      d.resources = d.resources.filter((r) => r.module_id !== id);
      d.progress = d.progress.filter((p) => !lessonIds.has(p.lesson_id));
      d.organization_modules = d.organization_modules.filter((x) => x.module_id !== id);
      persist();
    },

    async reorderModules(ids) {
      reorder(db().modules, ids);
      persist();
    },

    async createLesson(moduleId, input) {
      const d = db();
      const lesson = {
        id: randomUUID(), module_id: moduleId, ...input,
        position: d.lessons.filter((l) => l.module_id === moduleId).length, created_at: now(),
      };
      d.lessons.push(lesson);
      persist();
      return lesson;
    },

    async updateLesson(id, input) {
      Object.assign(mustFind(db().lessons, id, "Chapitre"), input);
      persist();
    },

    async deleteLesson(id) {
      const d = db();
      d.lessons = d.lessons.filter((l) => l.id !== id);
      d.progress = d.progress.filter((p) => p.lesson_id !== id);
      persist();
    },

    async reorderLessons(_moduleId, ids) {
      reorder(db().lessons, ids);
      persist();
    },

    async createResource(moduleId, input) {
      const d = db();
      const resource = {
        id: randomUUID(), module_id: moduleId, ...input,
        position: d.resources.filter((r) => r.module_id === moduleId).length, created_at: now(),
      };
      d.resources.push(resource);
      persist();
      return resource;
    },

    async updateResource(id, input) {
      Object.assign(mustFind(db().resources, id, "Ressource"), input);
      persist();
    },

    async deleteResource(id) {
      const d = db();
      d.resources = d.resources.filter((r) => r.id !== id);
      persist();
    },

    async reorderResources(_moduleId, ids) {
      reorder(db().resources, ids);
      persist();
    },

    async uploadFile(bucket, file) {
      const safe = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, "-").slice(-60);
      const key = `${randomUUID().slice(0, 8)}-${safe}`;
      const abs = path.join(DATA_DIR, "uploads", bucket, key);
      mkdirSync(path.dirname(abs), { recursive: true });
      writeFileSync(abs, Buffer.from(await file.arrayBuffer()));
      // même convention que Supabase : URL publique pour les miniatures, chemin dans le bucket pour les PDF
      return bucket === "thumbnails" ? `/api/files/thumbnails/${key}` : key;
    },

    async fileResponse(rel, download) {
      const abs = path.join(DATA_DIR, "uploads", rel);
      if (!abs.startsWith(path.join(DATA_DIR, "uploads")) || !existsSync(abs)) {
        return new Response("Fichier introuvable", { status: 404 });
      }
      const ext = path.extname(abs).toLowerCase();
      const type = ext === ".pdf" ? "application/pdf" : ext === ".png" ? "image/png" : ext === ".webp" ? "image/webp" : "image/jpeg";
      const name = path.basename(abs).replace(/^[a-f0-9]{8}-/, "");
      return new Response(readFileSync(abs), {
        headers: {
          "Content-Type": type,
          "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${name}"`,
          "Cache-Control": "private, max-age=300",
        },
      });
    },
  };
}
