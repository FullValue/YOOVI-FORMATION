import type { Metadata } from "next";
import { Building, LogOut, Mail, ShieldCheck } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { formatDate, initials } from "@/lib/format";
import { ROLE_LABELS } from "@/lib/types";
import { env } from "@/lib/env";
import { logoutAction } from "@/app/(auth)/actions";
import { PageHeader } from "@/components/learning/PageHeader";
import { Button } from "@/components/ui/Button";
import { PasswordForm, ProfileForm } from "./ProfileForms";

export const metadata: Metadata = { title: "Profil et paramètres" };

export default async function ProfilePage() {
  const user = await requireUser();
  return (
    <>
      <PageHeader eyebrow="Mon compte" title="Profil et paramètres" />
      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <aside className="surface h-fit p-6 text-center animate-fade-up">
          <span className="mx-auto grid size-24 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-rose-500 font-display text-3xl font-bold text-white shadow-lift">
            {initials(user.full_name, user.email)}
          </span>
          <p className="mt-4 font-display text-xl font-bold">{user.full_name || "Nom à compléter"}</p>
          {user.job_title && <p className="text-ink-muted">{user.job_title}</p>}
          <ul className="mt-6 space-y-3 text-left text-[14px]">
            <li className="flex items-center gap-3"><Mail className="size-4 shrink-0 text-violet-500" /><span className="truncate">{user.email}</span></li>
            <li className="flex items-center gap-3"><Building className="size-4 shrink-0 text-violet-500" />{user.organization?.name ?? "Équipe Yoovi"}</li>
            <li className="flex items-center gap-3"><ShieldCheck className="size-4 shrink-0 text-violet-500" />{ROLE_LABELS[user.role]} · depuis le {formatDate(user.created_at)}</li>
          </ul>
          <form action={logoutAction} className="mt-6">
            <Button variant="danger" className="w-full" icon={<LogOut className="size-4" />}>Se déconnecter</Button>
          </form>
        </aside>
        <div className="space-y-6">
          <section className="surface p-6 sm:p-8" aria-labelledby="infos">
            <h2 id="infos" className="text-xl font-bold">Informations personnelles</h2>
            <p className="mb-6 mt-1 text-[15px] text-ink-muted">Votre nom apparaît sur votre tableau de bord et dans les demandes au support.</p>
            <ProfileForm key={`${user.full_name}|${user.job_title}`} fullName={user.full_name ?? ""} jobTitle={user.job_title ?? ""} email={user.email} />
          </section>
          <section className="surface p-6 sm:p-8" aria-labelledby="securite">
            <h2 id="securite" className="text-xl font-bold">Sécurité</h2>
            <p className="mb-6 mt-1 text-[15px] text-ink-muted">Choisissez un mot de passe que vous n&apos;utilisez pas ailleurs.</p>
            <PasswordForm />
          </section>
          <p className="text-center text-[13px] text-ink-faint">
            Une question sur vos données ? Écrivez à <a className="font-semibold text-violet-600" href={`mailto:${env.supportEmail}`}>{env.supportEmail}</a>.
          </p>
        </div>
      </div>
    </>
  );
}
