import Image from "next/image";
import { cn } from "@/lib/cn";

/** Logo Yoovi (main « V ») + mot-symbole, avec mention « Formation ». */
export function Logo({ className, compact, tone = "dark" }: { className?: string; compact?: boolean; tone?: "dark" | "light" }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <Image src="/brand/yoovi-logo.png" alt="" width={40} height={40} priority className="size-10 drop-shadow-sm" />
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className={cn("font-display text-[22px] font-bold tracking-tight", tone === "light" ? "text-white" : "text-ink")}>Yoovi</span>
          <span className={cn("mt-0.5 font-reading text-[11px] font-semibold uppercase tracking-[0.14em]", tone === "light" ? "text-white/70" : "text-violet-500")}>
            Formation
          </span>
        </span>
      )}
      <span className="sr-only">Yoovi Formation</span>
    </span>
  );
}
