import Link from "next/link";
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "soft" | "dark";
type Size = "sm" | "md" | "lg";

const base =
  "group/btn relative inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-full font-display font-semibold transition-all duration-200 " +
  "active:scale-[.97] disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-300";

const variants: Record<Variant, string> = {
  // bouton principal du site Yoovi : fond #5046E5, relief intérieur
  primary: "bg-violet-500 text-white shadow-button hover:bg-violet-600 hover:-translate-y-px",
  dark: "bg-ink text-white shadow-button hover:bg-ink-soft hover:-translate-y-px",
  secondary: "bg-white text-ink ring-1 ring-ligne shadow-sm hover:ring-violet-300 hover:text-violet-600 hover:-translate-y-px",
  soft: "bg-violet-100 text-violet-700 hover:bg-violet-200",
  ghost: "text-ink-muted hover:bg-violet-100 hover:text-violet-700",
  danger: "bg-white text-corail-700 ring-1 ring-corail-100 hover:bg-corail-100",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3.5 text-[13px]",
  md: "h-11 px-5 text-[15px]",
  lg: "h-14 px-7 text-base",
};

interface CommonProps {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  iconRight?: ReactNode;
  loading?: boolean;
  className?: string;
  children?: ReactNode;
}

export function buttonClass(variant: Variant = "primary", size: Size = "md", className?: string) {
  return cn(base, variants[variant], sizes[size], className);
}

export const Button = forwardRef<HTMLButtonElement, CommonProps & ButtonHTMLAttributes<HTMLButtonElement>>(
  function Button({ variant = "primary", size = "md", icon, iconRight, loading, className, children, disabled, ...rest }, ref) {
    return (
      <button ref={ref} className={buttonClass(variant, size, className)} disabled={disabled || loading} aria-busy={loading || undefined} {...rest}>
        {loading ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : icon}
        {children}
        {iconRight}
      </button>
    );
  },
);

export function ButtonLink({
  href, variant = "primary", size = "md", icon, iconRight, className, children, external, ...rest
}: CommonProps & { href: string; external?: boolean; "aria-label"?: string; prefetch?: boolean }) {
  const cls = buttonClass(variant, size, className);
  if (external || href.startsWith("mailto:")) {
    return (
      <a href={href} className={cls} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})} {...rest}>
        {icon}{children}{iconRight}
      </a>
    );
  }
  return <Link href={href} className={cls} {...rest}>{icon}{children}{iconRight}</Link>;
}
