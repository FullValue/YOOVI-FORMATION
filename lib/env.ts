/** Configuration lue une seule fois. Les variables NEXT_PUBLIC_ sont les seules exposées au navigateur. */
export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  siteUrl: (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3100").replace(/\/$/, ""),
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "support@yoovi.fr",
};

export const isSupabaseConfigured = Boolean(env.supabaseUrl && env.supabaseAnonKey);

/** Mode démo : aucune base distante, données locales dans .data/, aucun e-mail envoyé. */
export const isDemoMode = !isSupabaseConfigured;

export function assertBackendAllowed() {
  if (isDemoMode && process.env.NODE_ENV === "production" && process.env.YOOVI_DEMO_MODE !== "1") {
    throw new Error(
      "Supabase n'est pas configuré (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY). " +
        "Le mode démo est refusé en production sauf si YOOVI_DEMO_MODE=1.",
    );
  }
}
