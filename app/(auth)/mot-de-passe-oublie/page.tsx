import type { Metadata } from "next";
import { ForgotForm } from "./ForgotForm";

export const metadata: Metadata = { title: "Mot de passe oublié" };

export default function ForgotPage() {
  return (
    <>
      <p className="eyebrow">Mot de passe oublié</p>
      <h1 className="mt-2 text-[32px] font-bold leading-tight">Pas de panique, on s&apos;en occupe.</h1>
      <p className="mb-8 mt-3 font-reading text-[17px] text-ink-muted">
        Indiquez l&apos;adresse e-mail de votre compte : nous vous envoyons un lien pour choisir un nouveau mot de passe.
      </p>
      <ForgotForm />
    </>
  );
}
