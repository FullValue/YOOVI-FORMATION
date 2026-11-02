import "server-only";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { env } from "@/lib/env";

/** Client lié à la session de l'utilisateur : toutes les requêtes passent par la RLS. */
export async function createUserClient(): Promise<SupabaseClient> {
  const store = await cookies();
  return createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list: { name: string; value: string; options?: CookieOptions }[]) => {
        try {
          list.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          // appelé depuis un Server Component : le middleware rafraîchit la session
        }
      },
    },
  });
}

/** Client service_role : contourne la RLS. Serveur uniquement, réservé aux opérations Auth. */
export function createAdminClient(): SupabaseClient {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY manquante : impossible de gérer les comptes.");
  return createClient(env.supabaseUrl, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

/** Client anonyme sans session (envoi des e-mails de réinitialisation). */
export function createAnonClient(): SupabaseClient {
  return createClient(env.supabaseUrl, env.supabaseAnonKey, { auth: { persistSession: false, autoRefreshToken: false } });
}
