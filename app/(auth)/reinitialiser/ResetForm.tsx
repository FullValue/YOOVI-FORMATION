"use client";
import { useActionState, useState } from "react";
import { Check, KeyRound } from "lucide-react";
import { resetPasswordAction } from "../actions";
import { TextField } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { cn } from "@/lib/cn";

const RULES = [
  { test: (v: string) => v.length >= 10, label: "10 caractères minimum" },
  { test: (v: string) => /[A-Za-z]/.test(v), label: "Une lettre" },
  { test: (v: string) => /[0-9]/.test(v), label: "Un chiffre" },
];

export function ResetForm({ token, invitation }: { token: string | null; invitation: boolean }) {
  const [state, action] = useActionState(resetPasswordAction, null);
  const [value, setValue] = useState("");
  const err = state && !state.ok ? state : null;
  return (
    <form action={action} className="space-y-5" noValidate>
      {token && <input type="hidden" name="token" value={token} />}
      {err && !err.fieldErrors && <div role="alert" className="rounded-2xl bg-corail-100 px-4 py-3 text-sm font-medium text-corail-700">{err.error}</div>}
      <div>
        <TextField label="Nouveau mot de passe" name="password" type="password" autoComplete="new-password" required
          value={value} onChange={(e) => setValue(e.target.value)} error={err?.fieldErrors?.password} />
        <ul className="mt-3 grid grid-cols-3 gap-2" aria-label="Règles du mot de passe">
          {RULES.map((r) => {
            const ok = r.test(value);
            return (
              <li key={r.label} className={cn("flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-[12px] font-medium transition",
                ok ? "bg-menthe-100 text-menthe-700" : "bg-violet-50 text-ink-faint")}>
                <Check className={cn("size-3.5 shrink-0 transition", ok ? "scale-100" : "scale-0")} />{r.label}
              </li>
            );
          })}
        </ul>
      </div>
      <TextField label="Confirmer le mot de passe" name="confirm" type="password" autoComplete="new-password" required error={err?.fieldErrors?.confirm} />
      <SubmitButton size="lg" className="w-full" icon={<KeyRound className="size-[18px]" />} pendingLabel="Enregistrement…">
        {invitation ? "Activer mon compte" : "Enregistrer le mot de passe"}
      </SubmitButton>
    </form>
  );
}
