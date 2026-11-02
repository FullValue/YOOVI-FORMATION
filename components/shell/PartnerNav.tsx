"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChartColumn, ChevronDown, House, LayoutDashboard, LifeBuoy, Library, LogOut, MonitorPlay, User } from "lucide-react";
import { cn } from "@/lib/cn";
import { logoutAction } from "@/app/(auth)/actions";

const NAV = [
  { href: "/tableau-de-bord", label: "Accueil", icon: House },
  { href: "/formations", label: "Formations", icon: MonitorPlay },
  { href: "/progression", label: "Progression", icon: ChartColumn },
  { href: "/ressources", label: "Ressources", icon: Library },
  { href: "/support", label: "Support", icon: LifeBuoy },
];

const isActive = (path: string, href: string) => path === href || path.startsWith(`${href}/`);

export function DesktopNav() {
  const path = usePathname();
  return (
    <nav aria-label="Navigation principale" className="hidden items-center gap-1 rounded-full bg-white/80 p-1.5 shadow-pill ring-1 ring-white backdrop-blur lg:flex">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = isActive(path, href);
        return (
          <Link key={href} href={href} aria-current={active ? "page" : undefined}
            className={cn("flex items-center gap-2 rounded-full px-4 py-2 text-[14px] font-semibold transition",
              active ? "bg-violet-500 text-white shadow-button" : "text-ink-muted hover:bg-violet-100 hover:text-violet-700")}>
            <Icon className="size-4" aria-hidden />{label}
          </Link>
        );
      })}
    </nav>
  );
}

export function MobileTabBar() {
  const path = usePathname();
  return (
    <nav aria-label="Navigation principale" className="pb-safe fixed inset-x-0 bottom-0 z-50 border-t border-ligne bg-white/90 backdrop-blur-xl lg:hidden">
      <ul className="mx-auto grid max-w-lg grid-cols-5">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = isActive(path, href);
          return (
            <li key={href}>
              <Link href={href} aria-current={active ? "page" : undefined}
                className={cn("flex min-h-[60px] flex-col items-center justify-center gap-1 text-[11px] font-semibold transition",
                  active ? "text-violet-600" : "text-ink-faint")}>
                <span className={cn("grid h-7 w-12 place-items-center rounded-full transition", active && "bg-violet-100")}>
                  <Icon className="size-[19px]" aria-hidden />
                </span>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function UserMenu({ name, email, initials, orgName, staff }: { name: string; email: string; initials: string; orgName: string | null; staff: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const path = usePathname();
  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", close); };
  }, []);
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-haspopup="menu"
        className="flex items-center gap-2.5 rounded-full bg-white/80 py-1.5 pl-1.5 pr-3 shadow-pill ring-1 ring-white backdrop-blur transition hover:bg-white">
        <span className="grid size-9 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-rose-500 font-display text-sm font-bold text-white">{initials}</span>
        <span className="hidden max-w-[160px] text-left leading-tight sm:block lg:hidden xl:block">
          <span className="block truncate text-[13px] font-semibold">{name}</span>
          {orgName && <span className="block truncate text-[11.5px] text-ink-faint">{orgName}</span>}
        </span>
        <ChevronDown className={cn("size-4 text-ink-faint transition", open && "rotate-180")} />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-full z-50 mt-2 w-64 animate-scale-in overflow-hidden rounded-3xl bg-white p-2 shadow-lift ring-1 ring-ligne">
          <div className="px-3 py-2.5">
            <p className="truncate text-sm font-semibold">{name}</p>
            <p className="truncate text-[13px] text-ink-faint">{email}</p>
          </div>
          <div className="my-1 h-px bg-ligne" />
          <Link role="menuitem" href="/profil" className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium hover:bg-violet-50">
            <User className="size-4 text-violet-500" /> Profil et paramètres
          </Link>
          {staff && (
            <Link role="menuitem" href="/admin" className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium hover:bg-violet-50">
              <LayoutDashboard className="size-4 text-violet-500" /> Back-office Yoovi
            </Link>
          )}
          <form action={logoutAction}>
            <button role="menuitem" className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium text-corail-700 hover:bg-corail-100">
              <LogOut className="size-4" /> Se déconnecter
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
