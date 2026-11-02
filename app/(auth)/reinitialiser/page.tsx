import type { Metadata } from "next";
import Link from "next/link";
import { LinkIcon } from "lucide-react";
import { getRepo } from "@/lib/data";
import { buttonClass } from "@/components/ui/Button";
import { ResetForm } from "./ResetForm";

export const metadata: Metadata = { title: "Choisir un mot de passe" };

export default async function ResetPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const token = sp.token ?? null;
  const invitation = sp.invitation === "1";
  const repo = await getRepo();
  const valid = await repo.canSetPassword(token);

  if (!valid) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-5 grid size-16 place-items-center rounded-3xl bg-corail-100 text-corail-700"><LinkIcon className="size-7" /></div>
        <h1 className="text-[28px] font-bold">Ce lien n&apos;est plus valide</h1>
        <p className="mt-2 text-ink-muted">Il a peut-être expiré ou déjà été utilisé. Demandez un nouveau lien, ou contactez l&apos;équipe Yoovi.</p>
        <div className="mt-8 flex flex-col gap-2">
          <Link href="/mot-de-passe-oublie" className={buttonClass("primary", "lg")}>Demander un nouveau lien</Link>
          <a href="mailto:support@yoovi.fr" className={buttonClass("ghost", "md")}>Contacter le support</a>
        </div>
      </div>
    );
  }

  return (
    <>
      <p className="eyebrow">{invitation ? "Activation du compte" : "Nouveau mot de passe"}</p>
      <h1 className="mt-2 text-[32px] font-bold leading-tight">
        {invitation ? "Bienvenue ! Choisissez votre mot de passe." : "Choisissez un nouveau mot de passe."}
      </h1>
      <p className="mb-8 mt-3 font-reading text-[17px] text-ink-muted">
        {invitation
          ? "Dernière étape avant de découvrir votre espace de formation Yoovi."
          : "Il remplacera l'ancien dès l'enregistrement."}
      </p>
      <ResetForm token={token} invitation={invitation} />
    </>
  );
}
