import type { Metadata } from "next";
import { Ban, Mail } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Button, ButtonLink } from "@/components/ui/Button";
import { logoutAction } from "@/app/(auth)/actions";
import { env } from "@/lib/env";

export const metadata: Metadata = { title: "Accès suspendu" };

const MESSAGES: Record<string, string> = {
  disabled: "Votre compte a été désactivé par l'équipe Yoovi.",
  org_inactive: "L'accès de votre organisme à la plateforme est actuellement suspendu.",
  no_org: "Votre compte n'est rattaché à aucun organisme partenaire pour le moment.",
};

export default async function SuspendedPage({ searchParams }: { searchParams: Promise<{ raison?: string }> }) {
  const { raison } = await searchParams;
  return (
    <main id="contenu" className="grid min-h-dvh place-items-center px-5 py-12">
      <div className="w-full max-w-md text-center">
        <Logo className="mb-10" />
        <div className="surface p-8">
          <div className="mx-auto mb-5 grid size-16 place-items-center rounded-3xl bg-corail-100 text-corail-700"><Ban className="size-7" /></div>
          <h1 className="text-2xl font-bold">Accès momentanément indisponible</h1>
          <p className="mt-2 text-ink-muted">{MESSAGES[raison ?? ""] ?? MESSAGES.disabled} Si vous pensez qu&apos;il s&apos;agit d&apos;une erreur, l&apos;équipe Yoovi vous répond par e-mail.</p>
          <div className="mt-7 flex flex-col gap-2">
            <ButtonLink href={`mailto:${env.supportEmail}?subject=${encodeURIComponent("Demande d'assistance — Formation Yoovi")}`} icon={<Mail className="size-4" />}>
              Contacter le support
            </ButtonLink>
            <form action={logoutAction}><Button variant="ghost" className="w-full">Se déconnecter</Button></form>
          </div>
        </div>
      </div>
    </main>
  );
}
