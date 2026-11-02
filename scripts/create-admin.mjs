// Crée (ou promeut) le premier super administrateur dans le projet Supabase.
// Usage : node --env-file=.env.local scripts/create-admin.mjs prenom.nom@yoovi.fr "Prénom Nom"
// Un e-mail d'invitation est envoyé : la personne choisit elle-même son mot de passe.
import { createClient } from "@supabase/supabase-js";

const [email, fullName = null] = process.argv.slice(2);
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const site = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3100").replace(/\/$/, "");

if (!email || !url || !key) {
  console.error("Usage : node --env-file=.env.local scripts/create-admin.mjs email@yoovi.fr \"Prénom Nom\"");
  console.error("Variables requises : NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const admin = createClient(url, key, { auth: { persistSession: false } });

const { data: list } = await admin.auth.admin.listUsers({ perPage: 1000 });
let user = list?.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());

if (!user) {
  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${site}/auth/callback?next=${encodeURIComponent("/reinitialiser?invitation=1")}`,
  });
  if (error) throw error;
  user = data.user;
  console.log(`Invitation envoyée à ${email}.`);
}

await admin.auth.admin.updateUserById(user.id, { app_metadata: { role: "super_admin" } });
const { error } = await admin.from("profiles").update({ role: "super_admin", organization_id: null, full_name: fullName }).eq("id", user.id);
if (error) throw error;
console.log(`${email} est super administrateur.`);
