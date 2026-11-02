"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertUser } from "@/lib/auth/session";
import { getRepo } from "@/lib/data";
import type { ActionResult } from "@/lib/types";

const profileSchema = z.object({
  full_name: z.string().trim().min(2, "Indiquez votre nom (2 caractères minimum).").max(80),
  job_title: z.string().trim().max(80).optional().transform((v) => v || null),
});

export async function updateProfileAction(_: ActionResult | null, form: FormData): Promise<ActionResult> {
  try {
    const user = await assertUser();
    const parsed = profileSchema.safeParse({ full_name: form.get("full_name"), job_title: form.get("job_title") ?? undefined });
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return { ok: false, error: issue.message, fieldErrors: { [String(issue.path[0])]: issue.message } };
    }
    const repo = await getRepo();
    await repo.updateProfile(user.id, parsed.data);
    revalidatePath("/", "layout");
    return { ok: true, message: "Vos informations ont été enregistrées." };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Enregistrement impossible." };
  }
}

const pwd = z.string().min(10, "Au moins 10 caractères.").regex(/[A-Za-z]/, "Au moins une lettre.").regex(/[0-9]/, "Au moins un chiffre.");

export async function changePasswordAction(_: ActionResult | null, form: FormData): Promise<ActionResult> {
  try {
    const user = await assertUser();
    const current = String(form.get("current") ?? "");
    const next = pwd.safeParse(String(form.get("password") ?? ""));
    if (!current) return { ok: false, error: "Saisissez votre mot de passe actuel.", fieldErrors: { current: "Saisissez votre mot de passe actuel." } };
    if (!next.success) return { ok: false, error: next.error.issues[0].message, fieldErrors: { password: next.error.issues[0].message } };
    if (form.get("confirm") !== next.data) return { ok: false, error: "Les mots de passe ne correspondent pas.", fieldErrors: { confirm: "Les mots de passe ne correspondent pas." } };
    const repo = await getRepo();
    const res = await repo.changePassword(user.id, user.email, current, next.data);
    if (!res.ok) return { ok: false, error: res.error, fieldErrors: /actuel/.test(res.error) ? { current: res.error } : undefined };
    return { ok: true, message: "Votre mot de passe a été modifié." };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Modification impossible." };
  }
}
