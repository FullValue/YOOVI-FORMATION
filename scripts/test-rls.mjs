// Vérifie les migrations et les règles RLS dans un Postgres en mémoire (PGlite),
// avec un environnement minimal imitant Supabase (schéma auth, rôles, storage).
// Usage : npm run test:sql
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
const db = new PGlite();

let passed = 0;
let failed = 0;
function check(name, ok, detail = "") {
  if (ok) { passed++; console.log(`  ✓ ${name}`); }
  else { failed++; console.log(`  ✗ ${name}${detail ? ` — ${detail}` : ""}`); }
}

// ── Environnement « façon Supabase » ───────────────────────────────────────
await db.exec(`
  create role anon nologin;
  create role authenticated nologin;
  create schema auth;
  create table auth.users (
    id uuid primary key, email text, raw_app_meta_data jsonb, raw_user_meta_data jsonb,
    last_sign_in_at timestamptz
  );
  create function auth.uid() returns uuid language sql stable as
    $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  create schema storage;
  create table storage.buckets (id text primary key, name text, public boolean,
    file_size_limit bigint, allowed_mime_types text[]);
  create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text);
  alter table storage.objects enable row level security;
  grant usage on schema auth, storage, public to anon, authenticated;
  grant execute on function auth.uid() to anon, authenticated;
`);

for (const f of ["0001_schema.sql", "0002_rls.sql", "0003_storage.sql"]) {
  await db.exec(read(`supabase/migrations/${f}`));
}
await db.exec(read("supabase/seed.sql"));
// Privilèges par défaut de Supabase (la RLS fait le tri)
await db.exec(`
  grant select, insert, update, delete on all tables in schema public to authenticated;
  grant select, insert, update, delete on storage.objects to authenticated;
  revoke all on all tables in schema public from anon;
`);
console.log("Migrations + seed appliqués\n");

// ── Jeu de données ─────────────────────────────────────────────────────────
const ids = {
  superAdmin: "00000000-0000-0000-0000-000000000001",
  admin: "00000000-0000-0000-0000-000000000002",
  alice: "00000000-0000-0000-0000-00000000000a", // CCAS de Trappes
  bob: "00000000-0000-0000-0000-00000000000b",   // Partenaire B
};
const orgA = (await db.query(`select id from public.organizations where name = 'CCAS de Trappes'`)).rows[0].id;
const orgB = (await db.query(`insert into public.organizations (name) values ('Partenaire B') returning id`)).rows[0].id;
await db.query(`insert into public.organization_notes (organization_id, notes) values ($1, 'note interne A')`, [orgA]);

const addUser = (id, email, meta) =>
  db.query(`insert into auth.users (id, email, raw_app_meta_data) values ($1, $2, $3)`, [id, email, JSON.stringify(meta)]);
await addUser(ids.superAdmin, "sa@yoovi.fr", { role: "super_admin" });
await addUser(ids.admin, "admin@yoovi.fr", { role: "admin" });
await addUser(ids.alice, "alice@trappes.fr", { organization_id: orgA, full_name: "Alice" });
await addUser(ids.bob, "bob@b.fr", { organization_id: orgB });
await db.exec(`update auth.users set last_sign_in_at = now()`);

const lesson = (await db.query(`select l.id, l.module_id from public.lessons l join public.modules m on m.id = l.module_id where m.slug = 'decouvrir-yoovi' order by l.position limit 1`)).rows[0];

// Exécute une requête en tant qu'utilisateur (rôle authenticated + jwt sub)
async function as(userId, sql, params = []) {
  await db.exec(`reset role; select set_config('request.jwt.claim.sub', '${userId ?? ""}', false);`);
  await db.exec(userId ? "set role authenticated" : "set role anon");
  try {
    return { rows: (await db.query(sql, params)).rows, error: null };
  } catch (e) {
    return { rows: [], error: e.message };
  } finally {
    await db.exec(`reset role; select set_config('request.jwt.claim.sub', '', false);`);
  }
}

// ── Tests ──────────────────────────────────────────────────────────────────
console.log("Profils créés par le trigger");
const profiles = (await db.query(`select id, role, organization_id, status from public.profiles order by email`)).rows;
check("4 profils", profiles.length === 4);
check("rôle repris de app_metadata", profiles.find((p) => p.id === ids.superAdmin)?.role === "super_admin");
check("statut actif après connexion", profiles.every((p) => p.status === "active"));

console.log("\nAnonyme");
let r = await as(null, `select * from public.modules`);
check("aucun accès anonyme au catalogue", r.error !== null || r.rows.length === 0, r.error ?? "");
r = await as(null, `select * from public.profiles`);
check("aucun accès anonyme aux profils", r.error !== null || r.rows.length === 0);

console.log("\nIsolation entre partenaires");
r = await as(ids.alice, `select id from public.organizations`);
check("Alice ne voit que son organisme", r.rows.length === 1 && r.rows[0].id === orgA);
r = await as(ids.alice, `select id from public.profiles`);
check("Alice ne voit que son profil", r.rows.length === 1 && r.rows[0].id === ids.alice);
r = await as(ids.alice, `select * from public.organization_notes`);
check("Alice ne lit pas les notes internes", r.rows.length === 0);
r = await as(ids.alice, `select count(*)::int n from public.modules`);
check("Alice voit les 4 modules publiés", r.rows[0]?.n === 4);

console.log("\nProgression");
r = await as(ids.alice, `insert into public.lesson_progress (user_id, lesson_id, module_id) values ($1, $2, $3) returning organization_id`, [ids.alice, lesson.id, lesson.module_id]);
check("Alice enregistre sa progression", !r.error && r.rows[0]?.organization_id === orgA, r.error ?? "");
r = await as(ids.bob, `insert into public.lesson_progress (user_id, lesson_id, module_id) values ($1, $2, $3)`, [ids.alice, lesson.id, lesson.module_id]);
check("Bob ne peut pas écrire la progression d'Alice", !!r.error);
r = await as(ids.bob, `select * from public.lesson_progress`);
check("Bob ne voit pas la progression d'Alice", r.rows.length === 0);
r = await as(ids.bob, `update public.lesson_progress set status = 'completed' where user_id = $1 returning *`, [ids.alice]);
check("Bob ne peut pas modifier la progression d'Alice", r.rows.length === 0);
r = await as(ids.alice, `update public.lesson_progress set status = 'completed' where user_id = $1 returning status, completed_at`, [ids.alice]);
check("Alice termine une leçon (completed_at renseigné)", r.rows[0]?.status === "completed" && r.rows[0]?.completed_at);
r = await as(ids.alice, `update public.lesson_progress set status = 'in_progress' where user_id = $1 returning status`, [ids.alice]);
check("une leçon terminée le reste", r.rows[0]?.status === "completed");
r = await as(ids.admin, `select count(*)::int n from public.lesson_progress`);
check("l'admin voit toute la progression", r.rows[0]?.n === 1);

console.log("\nÉlévation de privilèges");
r = await as(ids.alice, `update public.profiles set role = 'admin' where id = $1`, [ids.alice]);
check("Alice ne peut pas se donner le rôle admin", !!r.error);
r = await as(ids.alice, `update public.profiles set organization_id = $2 where id = $1`, [ids.alice, orgB]);
check("Alice ne peut pas changer d'organisme", !!r.error);
r = await as(ids.alice, `update public.profiles set full_name = 'Alice Martin' where id = $1 returning full_name`, [ids.alice]);
check("Alice peut modifier son nom", r.rows[0]?.full_name === "Alice Martin", r.error ?? "");
r = await as(ids.alice, `insert into public.modules (slug, title) values ('pirate', 'Pirate')`);
check("Alice ne peut pas créer de module", !!r.error);
r = await as(ids.alice, `insert into public.organizations (name) values ('Pirate')`);
check("Alice ne peut pas créer d'organisme", !!r.error);
r = await as(ids.admin, `update public.profiles set role = 'super_admin' where id = $1`, [ids.alice]);
check("un admin ne peut pas promouvoir un compte", !!r.error);
r = await as(ids.admin, `update public.profiles set status = 'disabled' where id = $1`, [ids.superAdmin]);
check("un admin ne peut pas désactiver un super admin", !!r.error);
r = await as(ids.superAdmin, `update public.profiles set status = 'disabled' where id = $1`, [ids.superAdmin]);
check("personne ne se désactive soi-même", !!r.error);
r = await as(ids.admin, `delete from public.organizations where id = $1 returning id`, [orgB]);
check("seul un super admin supprime un organisme", r.rows.length === 0);

console.log("\nAdministration");
r = await as(ids.admin, `insert into public.modules (slug, title) values ('nouveau-module', 'Nouveau module') returning id`);
check("l'admin crée un module (brouillon)", !r.error && r.rows.length === 1, r.error ?? "");
const draftId = r.rows[0]?.id;
r = await as(ids.alice, `select id from public.modules where id = $1`, [draftId]);
check("un brouillon est invisible pour les partenaires", r.rows.length === 0);
r = await as(ids.admin, `update public.profiles set job_title = 'Référente' where id = $1 returning job_title`, [ids.alice]);
check("l'admin modifie un compte partenaire", r.rows[0]?.job_title === "Référente", r.error ?? "");

console.log("\nCatalogue personnalisé et désactivations");
await db.query(`update public.organizations set catalog_mode = 'custom' where id = $1`, [orgB]);
await db.query(`insert into public.organization_modules (organization_id, module_id) values ($1, $2)`, [orgB, lesson.module_id]);
r = await as(ids.bob, `select count(*)::int n from public.modules`);
check("catalogue personnalisé : Bob ne voit qu'un module", r.rows[0]?.n === 1);
await db.query(`update public.organizations set status = 'inactive' where id = $1`, [orgB]);
r = await as(ids.bob, `select count(*)::int n from public.modules`);
check("organisme désactivé : plus aucun accès au catalogue", r.rows[0]?.n === 0);
await db.query(`update public.profiles set status = 'disabled' where id = $1`, [ids.alice]);
r = await as(ids.alice, `select count(*)::int n from public.modules`);
check("compte désactivé : plus aucun accès au catalogue", r.rows[0]?.n === 0);
r = await as(ids.alice, `insert into public.lesson_progress (user_id, lesson_id, module_id) values ($1, $2, $3)`, [ids.alice, lesson.id, lesson.module_id]);
check("compte désactivé : plus d'écriture de progression", !!r.error);

console.log("\nStockage");
await db.query(`insert into storage.objects (bucket_id, name) values ('resources', 'guide.pdf')`);
await db.query(`insert into public.resources (module_id, title, file_path) values ($1, 'Guide', 'guide.pdf')`, [lesson.module_id]);
await db.query(`update public.profiles set status = 'active' where id = $1`, [ids.alice]);
r = await as(ids.alice, `select name from storage.objects where bucket_id = 'resources'`);
check("Alice lit un PDF d'un module accessible", r.rows.length === 1);
r = await as(ids.alice, `insert into storage.objects (bucket_id, name) values ('resources', 'pirate.pdf')`);
check("Alice ne peut pas déposer de fichier", !!r.error);

console.log(`\n${passed} réussis, ${failed} échoués`);
process.exit(failed ? 1 : 0);
