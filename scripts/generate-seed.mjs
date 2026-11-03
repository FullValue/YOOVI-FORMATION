// Génère supabase/seed.sql à partir de lib/seed/catalog.json (source unique du catalogue de départ).
import { readFileSync, writeFileSync } from "node:fs";

const data = JSON.parse(readFileSync(new URL("../lib/seed/catalog.json", import.meta.url), "utf8"));
const q = (v) => (v == null ? "null" : `'${String(v).replace(/'/g, "''")}'`);

let sql = `-- Généré par scripts/generate-seed.mjs depuis lib/seed/catalog.json — ne pas éditer à la main.
-- Catalogue de départ : modules publiés, chapitres avec leurs vidéos (public/videos).
begin;
`;
for (const o of data.organizations) {
  sql += `insert into public.organizations (name, kind, city)
select ${q(o.name)}, ${q(o.kind)}, ${q(o.city)}
where not exists (select 1 from public.organizations where name = ${q(o.name)});\n`;
}
data.modules.forEach((m, i) => {
  sql += `\ninsert into public.modules (slug, title, summary, objective, icon, color, position, status)
values (${q(m.slug)}, ${q(m.title)}, ${q(m.summary)}, ${q(m.objective)}, ${q(m.icon)}, ${q(m.color)}, ${i}, 'published')
on conflict (slug) do nothing;\n`;
  m.lessons.forEach(({ title, video, duration }, j) => {
    sql += `insert into public.lessons (module_id, title, video_provider, video_ref, duration_seconds, position, status)
select id, ${q(title)}, 'file', ${q(video)}, ${duration}, ${j}, 'published' from public.modules where slug = ${q(m.slug)}
  and not exists (select 1 from public.lessons l join public.modules mm on mm.id = l.module_id where mm.slug = ${q(m.slug)} and l.title = ${q(title)});\n`;
  });
});
sql += "commit;\n";
writeFileSync(new URL("../supabase/seed.sql", import.meta.url), sql);
console.log("supabase/seed.sql généré");
