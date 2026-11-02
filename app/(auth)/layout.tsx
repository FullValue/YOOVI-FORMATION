import Image from "next/image";
import { Logo } from "@/components/brand/Logo";

const BUBBLES = [
  { src: "/brand/maths.webp", cls: "left-[8%] top-[18%] size-24 [animation-delay:-1s]" },
  { src: "/brand/philosophie.webp", cls: "right-[10%] top-[12%] size-20 [animation-delay:-3s]" },
  { src: "/brand/svt.webp", cls: "left-[14%] bottom-[16%] size-20 [animation-delay:-5s]" },
  { src: "/brand/histoire-geo.webp", cls: "right-[12%] bottom-[22%] size-24 [animation-delay:-2s]" },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main id="contenu" className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      {/* Panneau de marque (ordinateur) */}
      <section className="relative hidden overflow-hidden bg-gradient-to-br from-violet-500 via-[#6A4FE8] to-[#8059E3] lg:block" aria-hidden>
        <div className="absolute -left-24 -top-24 size-[420px] rounded-full bg-rose-500/40 blur-3xl" />
        <div className="absolute -bottom-32 right-0 size-[460px] rounded-full bg-bleu-500/40 blur-3xl" />
        <div className="bg-grain absolute inset-0 opacity-40 [filter:invert(1)]" />
        {BUBBLES.map((b) => (
          <Image key={b.src} src={b.src} alt="" width={120} height={120} className={`absolute animate-float drop-shadow-2xl ${b.cls}`} />
        ))}
        <div className="relative flex h-full flex-col justify-between p-12 text-white">
          <Logo tone="light" />
          <div className="mx-auto max-w-md text-center">
            <div className="mx-auto mb-8 grid size-36 place-items-center rounded-[40px] bg-white/15 ring-1 ring-white/30 backdrop-blur-md">
              <Image src="/brand/yoovi-logo.png" alt="" width={110} height={110} className="drop-shadow-xl" />
            </div>
            <h2 className="font-display text-[34px] font-bold leading-tight text-white">
              Découvrir, comprendre et maîtriser Yoovi.
            </h2>
            <p className="mt-4 font-reading text-lg text-white/80">
              L&apos;espace de formation réservé aux partenaires de Yoovi : des vidéos courtes, des ressources pratiques et votre progression au même endroit.
            </p>
          </div>
          <p className="text-sm text-white/60">© {new Date().getFullYear()} Yoovi — Le compagnon éducatif IA, du collège au lycée.</p>
        </div>
      </section>

      {/* Formulaire */}
      <section className="relative flex flex-col bg-white lg:bg-violet-50">
        <div className="absolute inset-x-0 top-0 h-56 bg-gradient-to-b from-violet-100 to-transparent lg:hidden" aria-hidden />
        <div className="relative flex flex-1 items-center justify-center px-5 py-10 sm:px-10">
          <div className="w-full max-w-[440px] animate-fade-up">
            <div className="mb-8 lg:hidden"><Logo /></div>
            {children}
          </div>
        </div>
      </section>
    </main>
  );
}
