import "server-only";
import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import catalog from "@/lib/seed/catalog.json";
import type {
  LessonProgress, Lesson, Module, Organization, Profile, Resource,
} from "@/lib/types";

/* Base locale du MODE DÉMO : un fichier JSON dans .data/ (ignoré par git).
   Elle reprend le catalogue de départ (lib/seed/catalog.json) et ajoute des comptes de
   démonstration clairement identifiés. Supprimer .data/ pour repartir de zéro. */

// « .nosync » : dossier ignoré par la synchronisation iCloud (le projet vit sur le Bureau)
export const DATA_DIR = path.join(process.cwd(), ".data.nosync");
const DB_FILE = path.join(DATA_DIR, "demo-db.json");

export interface DemoAuthUser { id: string; email: string; password_hash: string | null }
export interface DemoToken { token: string; user_id: string; purpose: "invite" | "recovery"; expires_at: string }

export interface DemoDb {
  version: 1;
  secret: string;
  users: DemoAuthUser[];
  tokens: DemoToken[];
  profiles: Profile[];
  organizations: Organization[];
  organization_notes: Record<string, string>;
  organization_modules: { organization_id: string; module_id: string }[];
  modules: Module[];
  lessons: Lesson[];
  resources: Resource[];
  progress: LessonProgress[];
}

/** Comptes de démonstration (mode démo uniquement — jamais créés dans Supabase). */
export const DEMO_ACCOUNTS = [
  { key: "partner", email: "demo.trappes@yoovi.demo", password: "demo-partenaire", label: "Partenaire · CCAS de Trappes", full_name: "Camille (compte démo)", job_title: "Référente démo" },
  { key: "super_admin", email: "admin@yoovi.demo", password: "demo-admin", label: "Super administrateur Yoovi", full_name: "Admin démo Yoovi", job_title: "Équipe Yoovi" },
] as const;

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(password, salt, 32).toString("hex")}`;
}

export function verifyPassword(password: string, stored: string | null) {
  if (!stored) return false;
  const [salt, hash] = stored.split(":");
  const candidate = scryptSync(password, salt, 32);
  const expected = Buffer.from(hash, "hex");
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}

const now = () => new Date().toISOString();

function seed(): DemoDb {
  const t = now();
  const db: DemoDb = {
    version: 1,
    secret: randomBytes(32).toString("hex"),
    users: [], tokens: [], profiles: [], organizations: [], organization_notes: {},
    organization_modules: [], modules: [], lessons: [], resources: [], progress: [],
  };
  for (const o of catalog.organizations) {
    db.organizations.push({
      id: randomUUID(), name: o.name, kind: o.kind, city: o.city, contact_name: null, contact_email: null,
      status: "active", catalog_mode: "all", created_at: t, updated_at: t,
    });
  }
  catalog.modules.forEach((m, i) => {
    const id = randomUUID();
    db.modules.push({
      id, slug: m.slug, title: m.title, summary: m.summary, objective: m.objective, icon: m.icon, color: m.color,
      thumbnail_url: null, position: i, status: "published", created_at: t, updated_at: t,
    });
    m.lessons.forEach((title, j) => {
      db.lessons.push({
        id: randomUUID(), module_id: id, title, description: "", video_provider: "none", video_ref: null,
        duration_seconds: null, position: j, status: "published", created_at: t,
      });
    });
  });
  const trappes = db.organizations[0];
  for (const a of DEMO_ACCOUNTS) {
    const id = randomUUID();
    db.users.push({ id, email: a.email, password_hash: hashPassword(a.password) });
    db.profiles.push({
      id, email: a.email, full_name: a.full_name, job_title: a.job_title,
      role: a.key === "partner" ? "partner" : "super_admin",
      organization_id: a.key === "partner" ? trappes.id : null,
      status: "active", last_seen_at: null, created_at: t,
    });
  }
  return db;
}

declare global {
  // eslint-disable-next-line no-var
  var __yooviDemoDb: DemoDb | undefined;
}

export function db(): DemoDb {
  if (!globalThis.__yooviDemoDb) {
    if (existsSync(DB_FILE)) {
      globalThis.__yooviDemoDb = JSON.parse(readFileSync(DB_FILE, "utf8")) as DemoDb;
    } else {
      globalThis.__yooviDemoDb = seed();
      persist();
    }
  }
  return globalThis.__yooviDemoDb;
}

export function persist() {
  mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(DB_FILE, JSON.stringify(globalThis.__yooviDemoDb, null, 2));
}

export { now, randomUUID };
