"use client";
import Link from "next/link";
import { useActionState, useRef, useState } from "react";
import { ArrowRight, Eye, EyeOff, FlaskConical } from "lucide-react";
import { loginAction } from "../actions";
import { TextField } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";

type DemoAccount = { email: string; password: string; label: string };

export function LoginForm({ next, demoAccounts }: { next?: string; demoAccounts?: DemoAccount[] }) {
  const [state, action] = useActionState(loginAction, null);
  const [show, setShow] = useState(false);
  const [emailValue, setEmailValue] = useState("");
  const email = useRef<HTMLInputElement>(null);
  const password = useRef<HTMLInputElement>(null);
  const err = state && !state.ok ? state : null;

  return (
    <>
      <form action={action} className="space-y-5" noValidate>
        {next && <input type="hidden" name="suivant" value={next} />}
        {err && !err.fieldErrors && (
          <div role="alert" className="animate-scale-in rounded-2xl bg-corail-100 px-4 py-3 text-sm font-medium text-corail-700">{err.error}</div>
        )}
        <TextField ref={email} label="Adresse e-mail" name="email" type="email" autoComplete="email" inputMode="email"
          value={emailValue} onChange={(e) => setEmailValue(e.target.value)}
          placeholder="prenom.nom@organisme.fr" required error={err?.fieldErrors?.email} />
        <div>
          <div className="relative">
            <TextField ref={password} label="Mot de passe" name="password" type={show ? "text" : "password"} autoComplete="current-password"
              required error={err?.fieldErrors?.password} className="[&_input]:pr-12" />
            <button type="button" onClick={() => setShow((s) => !s)}
              className="absolute right-2 top-[34px] grid size-10 place-items-center rounded-xl text-ink-muted hover:bg-violet-100 hover:text-violet-700"
              aria-label={show ? "Masquer le mot de passe" : "Afficher le mot de passe"} aria-pressed={show}>
              {show ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}
            </button>
          </div>
          <div className="mt-2 text-right">
            <Link href="/mot-de-passe-oublie" className="text-sm font-semibold text-violet-600 hover:text-violet-700 hover:underline">
              Mot de passe oublié ?
            </Link>
          </div>
        </div>
        <SubmitButton size="lg" className="w-full" pendingLabel="Connexion…" iconRight={<ArrowRight className="size-5" />}>
          Se connecter
        </SubmitButton>
      </form>

      {demoAccounts && demoAccounts.length > 0 && (
        <div className="mt-8 rounded-3xl border border-dashed border-jaune-500/60 bg-jaune-100/60 p-4">
          <p className="mb-3 flex items-center gap-2 text-[13px] font-semibold text-jaune-700">
            <FlaskConical className="size-4" /> Comptes de démonstration (mode démo uniquement)
          </p>
          <div className="grid gap-2">
            {demoAccounts.map((a) => (
              <button key={a.email} type="button"
                onClick={() => {
                  setEmailValue(a.email);
                  if (password.current) password.current.value = a.password;
                  password.current?.focus();
                }}
                className="flex items-center justify-between rounded-2xl bg-white px-4 py-2.5 text-left text-sm shadow-sm ring-1 ring-jaune-500/20 transition hover:ring-violet-300">
                <span><span className="block font-semibold text-ink">{a.label}</span><span className="text-ink-muted">{a.email}</span></span>
                <span className="text-xs font-semibold text-violet-600">Remplir</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
