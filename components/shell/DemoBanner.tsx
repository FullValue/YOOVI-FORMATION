import { FlaskConical } from "lucide-react";
import { showDemoUi } from "@/lib/env";

/** Bandeau permanent en mode démo : les données sont locales et aucun e-mail n'est envoyé. */
export function DemoBanner() {
  if (!showDemoUi) return null;
  return (
    <div className="relative z-[60] flex items-center justify-center gap-2 bg-ink px-4 py-1.5 text-center text-[12.5px] font-medium text-white/90">
      <FlaskConical className="size-3.5 shrink-0 text-jaune-500" aria-hidden />
      <span>
        <strong className="font-semibold text-white">Mode démonstration</strong> — données locales de test, aucun e-mail n&apos;est envoyé.
        <span className="hidden sm:inline"> Connectez Supabase pour la mise en production.</span>
      </span>
    </div>
  );
}
