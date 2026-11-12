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

/** Bandeau et comptes de test affichés seulement avec YOOVI_SHOW_DEMO=1 (masqués par défaut). */
export const showDemoUi = isDemoMode && process.env.YOOVI_SHOW_DEMO === "1";

export function assertBackendAllowed() {
  if (isDemoMode && process.env.NODE_ENV === "production" && process.env.YOOVI_DEMO_MODE === "0") {
    throw new Error(
      "Supabase n'est pas configuré (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY). " +
        "Le mode démo est refusé car YOOVI_DEMO_MODE=0.",
    );
  }
}
