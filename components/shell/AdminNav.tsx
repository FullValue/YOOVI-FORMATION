"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building, ChartColumn, Eye, LayoutDashboard, LogOut, MonitorPlay, Users } from "lucide-react";
import { cn } from "@/lib/cn";
import { logoutAction } from "@/app/(auth)/actions";
import { Logo } from "@/components/brand/Logo";

const NAV = [
  { href: "/admin", label: "Tableau de bord", icon: LayoutDashboard, exact: true },
  { href: "/admin/partenaires", label: "Partenaires", icon: Building },
  { href: "/admin/utilisateurs", label: "Utilisateurs", icon: Users },
  { href: "/admin/modules", label: "Formations", icon: MonitorPlay },
  { href: "/admin/statistiques", label: "Statistiques", icon: ChartColumn },
];

const active = (path: string, href: string, exact?: boolean) => (exact ? path === href : path === href || path.startsWith(`${href}/`));

export function AdminSidebar({ name, email, initials, roleLabel }: { name: string; email: string; initials: string; roleLabel: string }) {
  const path = usePathname();
  return (
    <aside className="sticky top-0 hidden h-dvh w-[264px] shrink-0 flex-col border-r border-ligne bg-white/70 p-5 backdrop-blur lg:flex">
      <Link href="/admin" className="mb-2 px-2"><Logo /></Link>
      <span className="mx-2 mb-6 w-fit rounded-full bg-ink px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white">Back-office</span>
      <nav aria-label="Administration" className="space-y-1">
        {NAV.map(({ href, label, icon: Icon, exact }) => {
          const on = active(path, href, exact);
          return (
            <Link key={href} href={href} aria-current={on ? "page" : undefined}
              className={cn("flex items-center gap-3 rounded-2xl px-3 py-2.5 text-[14.5px] font-semibold transition",
                on ? "bg-violet-500 text-white shadow-button" : "text-ink-muted hover:bg-violet-100 hover:text-violet-700")}>
              <Icon className="size-[18px]" aria-hidden />{label}
            </Link>
          );
        })}
      </nav>
      <Link href="/tableau-de-bord" className="mt-6 flex items-center gap-3 rounded-2xl border border-dashed border-violet-300 px-3 py-2.5 text-[14px] font-semibold text-violet-700 hover:bg-violet-50">
        <Eye className="size-[18px]" /> Voir l&apos;espace partenaire
      </Link>
      <div className="mt-auto flex items-center gap-3 rounded-2xl bg-violet-50 p-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-rose-500 font-display text-sm font-bold text-white">{initials}</span>
        <span className="min-w-0 flex-1 leading-tight">
          <span className="block truncate text-[13.5px] font-semibold">{name}</span>
          <span className="block truncate text-[12px] text-ink-faint" title={email}>{roleLabel}</span>
        </span>
        <form action={logoutAction}>
          <button className="grid size-9 place-items-center rounded-xl text-ink-muted hover:bg-white hover:text-corail-700" aria-label="Se déconnecter" title="Se déconnecter">
            <LogOut className="size-4" />
          </button>
        </form>
      </div>
    </aside>
  );
}

export function AdminMobileNav() {
  const path = usePathname();
  return (
    <div className="sticky top-0 z-40 border-b border-ligne bg-white/85 backdrop-blur-xl lg:hidden">
      <div className="flex items-center justify-between px-4 py-3">
        <Link href="/admin"><Logo compact /></Link>
        <span className="rounded-full bg-ink px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white">Back-office</span>
        <form action={logoutAction}>
          <button className="grid size-10 place-items-center rounded-xl text-ink-muted hover:bg-violet-100" aria-label="Se déconnecter"><LogOut className="size-[18px]" /></button>
        </form>
      </div>
      <nav aria-label="Administration" className="no-scrollbar flex gap-1.5 overflow-x-auto px-4 pb-3">
        {[...NAV, { href: "/tableau-de-bord", label: "Espace partenaire", icon: Eye, exact: false }].map(({ href, label, icon: Icon, exact }) => {
          const on = active(path, href, exact);
          return (
            <Link key={href} href={href} aria-current={on ? "page" : undefined}
              className={cn("flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-semibold",
                on ? "bg-violet-500 text-white" : "bg-violet-50 text-ink-muted")}>
              <Icon className="size-4" />{label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
