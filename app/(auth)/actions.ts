"use server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getRepo } from "@/lib/data";
import { accessState, getSessionUser, isStaff } from "@/lib/auth/session";
import type { ActionResult } from "@/lib/types";

const emailSchema = z.string().trim().toLowerCase().email("Saisissez une adresse e-mail valide.");

/** N'accepte que des chemins internes (pas de redirection ouverte). */
function safeNext(value: FormDataEntryValue | null) {
  const v = typeof value === "string" ? value : "";
  return v.startsWith("/") && !v.startsWith("//") && !v.startsWith("/\\") ? v : null;
}

export async function loginAction(_: ActionResult | null, form: FormData): Promise<ActionResult> {
  const email = emailSchema.safeParse(form.get("email"));
  const password = String(form.get("password") ?? "");
  if (!email.success) return { ok: false, error: email.error.issues[0].message, fieldErrors: { email: email.error.issues[0].message } };
  if (!password) return { ok: false, error: "Saisissez votre mot de passe.", fieldErrors: { password: "Saisissez votre mot de passe." } };

  const repo = await getRepo();
  const res = await repo.signIn(email.data, password);
  if (!res.ok) return { ok: false, error: res.error };

  const user = await getSessionUser();
  if (!user) {
    await repo.signOut();
    return { ok: false, error: "Votre compte n'est pas encore configuré. Contactez support@yoovi.fr." };
  }
  const state = accessState(user);
  if (state !== "ok") {
    await repo.signOut();
    return {
      ok: false,
      error: state === "disabled"
        ? "Ce compte est désactivé. Contactez support@yoovi.fr si vous pensez qu'il s'agit d'une erreur."
        : "L'accès de votre organisme est suspendu. Contactez support@yoovi.fr.",
    };
  }
  redirect(safeNext(form.get("suivant")) ?? (isStaff(user) ? "/admin" : "/tableau-de-bord"));
}

export async function forgotPasswordAction(_: ActionResult<{ demoLink?: string }> | null, form: FormData): Promise<ActionResult<{ demoLink?: string }>> {
  const email = emailSchema.safeParse(form.get("email"));
  if (!email.success) return { ok: false, error: email.error.issues[0].message, fieldErrors: { email: email.error.issues[0].message } };
  const repo = await getRepo();
  try {
    const { demoLink } = await repo.requestPasswordReset(email.data);
    return { ok: true, data: { demoLink } };
  } catch {
    // Même réponse dans tous les cas : on ne révèle pas si un compte existe
    return { ok: true, data: {} };
  }
}

const passwordSchema = z
  .string()
  .min(10, "Au moins 10 caractères.")
  .regex(/[A-Za-z]/, "Au moins une lettre.")
  .regex(/[0-9]/, "Au moins un chiffre.");

export async function resetPasswordAction(_: ActionResult | null, form: FormData): Promise<ActionResult> {
  const password = passwordSchema.safeParse(String(form.get("password") ?? ""));
  if (!password.success) return { ok: false, error: password.error.issues[0].message, fieldErrors: { password: password.error.issues[0].message } };
  if (form.get("confirm") !== password.data) {
    return { ok: false, error: "Les deux mots de passe ne correspondent pas.", fieldErrors: { confirm: "Les deux mots de passe ne correspondent pas." } };
  }
  const token = (form.get("token") as string) || null;
  const repo = await getRepo();
  const res = await repo.setPassword(token, password.data);
  if (!res.ok) return res;
  if (repo.backend === "supabase") redirect("/");
  redirect("/connexion?mdp=ok");
}

export async function logoutAction() {
  const repo = await getRepo();
  await repo.signOut();
  redirect("/connexion?deconnexion=1");
}
