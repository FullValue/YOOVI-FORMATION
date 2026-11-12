import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CircleCheck } from "lucide-react";
import { getSessionUser, accessState, isStaff } from "@/lib/auth/session";
import { showDemoUi } from "@/lib/env";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Connexion" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const user = await getSessionUser();
  if (user && accessState(user) === "ok") redirect(isStaff(user) ? "/admin" : "/tableau-de-bord");

  let demoAccounts: { email: string; password: string; label: string }[] | undefined;
  if (showDemoUi) {
    const { DEMO_ACCOUNTS } = await import("@/lib/data/demo/store");
    demoAccounts = DEMO_ACCOUNTS.map(({ email, password, label }) => ({ email, password, label }));
  }

  const notice = sp.mdp === "ok"
    ? "Votre mot de passe a été enregistré. Vous pouvez vous connecter."
    : sp.deconnexion ? "Vous êtes déconnecté. À bientôt !" : null;

  return (
    <>
      <p className="eyebrow">Espace partenaires</p>
      <h1 className="mt-2 text-[32px] font-bold leading-tight sm:text-[36px]">Bienvenue sur votre espace de formation Yoovi&nbsp;!</h1>
      <p className="mb-8 mt-3 font-reading text-[17px] text-ink-muted">
        Connectez-vous avec les identifiants transmis par l&apos;équipe Yoovi.
      </p>
      {notice && (
        <div role="status" className="mb-6 flex items-start gap-2.5 rounded-2xl bg-menthe-100 px-4 py-3 text-sm font-medium text-menthe-700">
          <CircleCheck className="mt-0.5 size-4 shrink-0" />{notice}
        </div>
      )}
      <LoginForm next={sp.suivant} demoAccounts={demoAccounts} />
      <p className="mt-8 text-center text-sm text-ink-muted">
        Pas encore d&apos;accès ? Écrivez-nous à{" "}
        <a href="mailto:support@yoovi.fr" className="font-semibold text-violet-600 hover:underline">support@yoovi.fr</a>
      </p>
    </>
  );
}
