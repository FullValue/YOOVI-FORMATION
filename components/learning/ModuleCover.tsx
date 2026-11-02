/* eslint-disable @next/next/no-img-element */
import { cn } from "@/lib/cn";
import { colorOf, ModuleIcon } from "./icons";

/** Couverture d'un module : miniature fournie, ou composition aux couleurs Yoovi. */
export function ModuleCover({ module, index, className, size = "md" }: {
  module: { title: string; icon: string; color: string; thumbnail_url: string | null };
  index?: number; className?: string; size?: "sm" | "md" | "lg";
}) {
  const c = colorOf(module.color);
  if (module.thumbnail_url) {
    return (
      <div className={cn("relative overflow-hidden bg-violet-100", className)}>
        <img src={module.thumbnail_url} alt="" className="absolute inset-0 size-full object-cover" loading="lazy" />
      </div>
    );
  }
  const bubble = size === "lg" ? "size-28 [&>svg]:size-12" : size === "sm" ? "size-12 [&>svg]:size-6" : "size-20 [&>svg]:size-9";
  return (
    <div className={cn("relative isolate overflow-hidden", className)} style={{ background: `linear-gradient(135deg, ${c.from}, ${c.to})` }} aria-hidden>
      <div className="absolute -right-10 -top-12 size-44 rounded-full opacity-40 blur-2xl" style={{ background: c.accent }} />
      <div className="absolute -bottom-16 -left-8 size-40 rounded-full bg-white/20 blur-xl" />
      <svg className="absolute inset-0 size-full opacity-[.13]" aria-hidden>
        <defs>
          <pattern id={`dots-${module.color}`} width="18" height="18" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.4" fill="white" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#dots-${module.color})`} />
      </svg>
      {index != null && size !== "sm" && (
        <span className="absolute left-4 top-4 rounded-full bg-white/20 px-2.5 py-1 font-display text-[11px] font-bold uppercase tracking-wider text-white ring-1 ring-white/30 backdrop-blur">
          Module {String(index + 1).padStart(2, "0")}
        </span>
      )}
      <div className="absolute inset-0 grid place-items-center">
        <div className={cn(
          "grid place-items-center rounded-full bg-white/90 text-[--c] shadow-[0_20px_40px_-12px_rgba(0,0,0,.35),inset_0_-6px_12px_rgba(80,70,229,.12),inset_0_2px_0_#fff] ring-4 ring-white/40 transition-transform duration-500 group-hover:-translate-y-1 group-hover:rotate-[-4deg]",
          bubble,
        )} style={{ ["--c" as string]: c.from }}>
          <ModuleIcon name={module.icon} />
        </div>
      </div>
    </div>
  );
}
