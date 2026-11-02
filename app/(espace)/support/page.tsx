import type { Metadata } from "next";
import Image from "next/image";
import { Clock, KeyRound, Mail, MonitorPlay, Save } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { getVisibleCatalog } from "@/lib/catalog";
import { env } from "@/lib/env";
import { SupportForm } from "./SupportForm";

export const metadata: Metadata = { title: "Besoin d'aide ?" };

const FAQ = [
  { icon: KeyRound, q: "J'ai oublié mon mot de passe", a: "Sur la page de connexion, cliquez sur « Mot de passe oublié ? » : vous recevrez un lien par e-mail pour en choisir un nouveau." },
  { icon: Save, q: "Ma progression est-elle enregistrée ?", a: "Oui. Chaque vidéo consultée, la position de lecture et les vidéos terminées sont sauvegardées automatiquement sur votre compte, quel que soit l'appareil." },
  { icon: MonitorPlay, q: "Une vidéo ne se lance pas", a: "Vérifiez votre connexion et rechargez la page. Certains réseaux d'organismes bloquent YouTube ou Vimeo : dans ce cas, signalez-le-nous en précisant la vidéo concernée." },
  { icon: Clock, q: "Sous quel délai répondez-vous ?", a: "L'équipe Yoovi traite les demandes par e-mail, les jours ouvrés. Précisez le module ou la vidéo concernés pour une réponse plus rapide." },
];

export default async function SupportPage() {
  const user = await requireUser();
  const modules = (await getVisibleCatalog(user)).map((m) => m.title);
  return (
    <div className="pt-4 sm:pt-8">
      <section className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-violet-100 via-white to-rose-100 p-6 shadow-card sm:p-10 animate-fade-up">
        <Image src="/brand/mascotte.webp" alt="" width={360} height={222} priority
          className="pointer-events-none absolute -bottom-4 right-0 hidden w-[320px] lg:block" />
        <div className="relative max-w-xl">
          <p className="eyebrow">Support</p>
          <h1 className="mt-1.5 text-[32px] font-bold leading-tight sm:text-[42px]">Besoin d&apos;aide&nbsp;?</h1>
          <p className="mt-3 font-reading text-[17px] text-ink-muted">
            L&apos;équipe Yoovi est disponible pour accompagner les partenaires : prise en main de la plateforme, question sur une formation ou difficulté technique.
            Écrivez-nous, nous vous répondons par e-mail.
          </p>
          <a href={`mailto:${env.supportEmail}`} className="mt-5 inline-flex items-center gap-2.5 rounded-full bg-white px-4 py-2.5 font-display font-semibold text-violet-700 shadow-pill">
            <Mail className="size-4" /> {env.supportEmail}
          </a>
        </div>
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.35fr_1fr]">
        <section aria-labelledby="ecrire" className="surface p-6 sm:p-8">
          <h2 id="ecrire" className="text-[22px] font-bold">Contacter le support</h2>
          <p className="mb-6 mt-1 text-[15px] text-ink-muted">Préparez votre demande : elle s&apos;ouvrira dans votre messagerie, prête à être envoyée.</p>
          <SupportForm email={env.supportEmail} modules={modules}
            user={{ name: user.full_name || user.email, email: user.email, org: user.organization?.name ?? null }} />
        </section>
        <section aria-labelledby="faq">
          <h2 id="faq" className="mb-4 text-[22px] font-bold">Questions fréquentes</h2>
          <div className="space-y-3">
            {FAQ.map(({ icon: Icon, q, a }) => (
              <details key={q} className="group rounded-3xl bg-white p-5 shadow-card open:shadow-lift">
                <summary className="flex cursor-pointer list-none items-center gap-3 font-display font-bold [&::-webkit-details-marker]:hidden">
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-violet-100 text-violet-600"><Icon className="size-[18px]" /></span>
                  <span className="flex-1">{q}</span>
                  <span className="text-xl text-violet-400 transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 pl-12 text-[15px] leading-relaxed text-ink-muted">{a}</p>
              </details>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
