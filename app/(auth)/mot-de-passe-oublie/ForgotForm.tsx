"use client";
import Link from "next/link";
import { useActionState } from "react";
import { ArrowLeft, FlaskConical, MailCheck, Send } from "lucide-react";
import { forgotPasswordAction } from "../actions";
import { TextField } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";

export function ForgotForm() {
  const [state, action] = useActionState(forgotPasswordAction, null);
  if (state?.ok) {
    return (
      <div className="animate-scale-in text-center">
        <div className="mx-auto mb-5 grid size-16 place-items-center rounded-3xl bg-menthe-100 text-menthe-700"><MailCheck className="size-8" /></div>
        <h2 className="text-2xl font-bold">Vérifiez votre boîte mail</h2>
        <p className="mt-2 text-ink-muted">
          Si un compte existe avec cette adresse, vous allez recevoir un lien pour choisir un nouveau mot de passe. Pensez à regarder dans les courriers indésirables.
        </p>
        {state.data?.demoLink && (
          <div className="mt-6 rounded-2xl border border-dashed border-jaune-500/60 bg-jaune-100/60 p-4 text-left text-sm">
            <p className="mb-2 flex items-center gap-2 font-semibold text-jaune-700"><FlaskConical className="size-4" /> Mode démo : aucun e-mail n&apos;est envoyé</p>
            <Link href={state.data.demoLink} className="break-all font-semibold text-violet-600 underline">Ouvrir le lien de réinitialisation</Link>
          </div>
        )}
        <Link href="/connexion" className="mt-8 inline-flex items-center gap-2 font-semibold text-violet-600 hover:underline">
          <ArrowLeft className="size-4" /> Retour à la connexion
        </Link>
      </div>
    );
  }
  const err = state && !state.ok ? state : null;
  return (
    <form action={action} className="space-y-5" noValidate>
      <TextField label="Adresse e-mail" name="email" type="email" autoComplete="email" placeholder="prenom.nom@organisme.fr" required
        error={err?.fieldErrors?.email} />
      <SubmitButton size="lg" className="w-full" icon={<Send className="size-[18px]" />} pendingLabel="Envoi…">Recevoir le lien</SubmitButton>
      <Link href="/connexion" className="flex items-center justify-center gap-2 pt-2 text-sm font-semibold text-violet-600 hover:underline">
        <ArrowLeft className="size-4" /> Retour à la connexion
      </Link>
    </form>
  );
}
