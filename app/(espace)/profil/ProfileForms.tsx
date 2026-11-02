"use client";
import { useActionState, useRef } from "react";
import { KeyRound, Save } from "lucide-react";
import { changePasswordAction, updateProfileAction } from "./actions";
import { TextField } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { useActionToast } from "@/components/ui/Toast";

export function ProfileForm({ fullName, jobTitle, email }: { fullName: string; jobTitle: string; email: string }) {
  const [state, action] = useActionState(updateProfileAction, null);
  useActionToast(state);
  const err = state && !state.ok ? state.fieldErrors : undefined;
  return (
    <form action={action} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField label="Nom et prénom" name="full_name" defaultValue={fullName} autoComplete="name" required error={err?.full_name} />
        <TextField label="Fonction" name="job_title" defaultValue={jobTitle} optional placeholder="Ex. : Conseillère numérique" error={err?.job_title} />
      </div>
      <TextField label="Adresse e-mail" name="email_ro" value={email} readOnly disabled hint="Pour changer d'adresse, contactez l'équipe Yoovi." />
      <SubmitButton icon={<Save className="size-4" />} pendingLabel="Enregistrement…">Enregistrer</SubmitButton>
    </form>
  );
}

export function PasswordForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action] = useActionState(changePasswordAction, null);
  useActionToast(state, () => formRef.current?.reset());
  const err = state && !state.ok ? state.fieldErrors : undefined;
  return (
    <form ref={formRef} action={action} className="space-y-5">
      <TextField label="Mot de passe actuel" name="current" type="password" autoComplete="current-password" error={err?.current} />
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField label="Nouveau mot de passe" name="password" type="password" autoComplete="new-password" hint="10 caractères, dont une lettre et un chiffre." error={err?.password} />
        <TextField label="Confirmer" name="confirm" type="password" autoComplete="new-password" error={err?.confirm} />
      </div>
      <SubmitButton variant="dark" icon={<KeyRound className="size-4" />} pendingLabel="Modification…">Changer le mot de passe</SubmitButton>
    </form>
  );
}
