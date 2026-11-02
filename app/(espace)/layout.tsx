import Link from "next/link";
import { Eye } from "lucide-react";
import { requireUser, isStaff } from "@/lib/auth/session";
import { firstName, initials } from "@/lib/format";
import { Logo } from "@/components/brand/Logo";
import { DesktopNav, MobileTabBar, UserMenu } from "@/components/shell/PartnerNav";

export default async function PartnerLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const staff = isStaff(user);
  return (
    <div className="relative min-h-dvh">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] bg-gradient-to-b from-violet-100 via-violet-50 to-transparent" aria-hidden />
      {staff && (
        <div className="bg-violet-500 px-4 py-1.5 text-center text-[12.5px] font-medium text-white">
          <Eye className="mr-1.5 inline size-3.5" aria-hidden />
          Aperçu de l&apos;espace partenaire —{" "}
          <Link href="/admin" className="font-semibold underline underline-offset-2">retour au back-office</Link>
        </div>
      )}
      <header className="sticky top-0 z-40 bg-violet-50/75 backdrop-blur-xl supports-[backdrop-filter]:bg-violet-50/60">
        <div className="mx-auto flex h-[76px] max-w-[1240px] items-center justify-between gap-4 px-4 sm:px-6 lg:h-[88px]">
          <Link href="/tableau-de-bord" aria-label="Accueil Yoovi Formation" className="shrink-0"><Logo /></Link>
          <DesktopNav />
          <UserMenu
            name={user.full_name || firstName(user.email.split("@")[0]) || user.email}
            email={user.email}
            initials={initials(user.full_name, user.email)}
            orgName={user.organization?.name ?? (staff ? "Équipe Yoovi" : null)}
            staff={staff}
          />
        </div>
      </header>
      <main id="contenu" className="mx-auto max-w-[1240px] px-4 pb-32 pt-2 sm:px-6 lg:pb-20">{children}</main>
      <MobileTabBar />
    </div>
  );
}
