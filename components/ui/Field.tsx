import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

interface Wrap { label: string; hint?: ReactNode; error?: string; className?: string; optional?: boolean }

function Shell({ id, label, hint, error, className, optional, children }: Wrap & { id: string; children: ReactNode }) {
  return (
    <div className={className}>
      <label htmlFor={id} className="label">
        {label}
        {optional && <span className="ml-1.5 font-normal text-ink-faint">(facultatif)</span>}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-sm font-medium text-corail-700">{error}</p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-[13px] text-ink-faint">{hint}</p>
      ) : null}
    </div>
  );
}

export function TextField({ label, hint, error, className, optional, id, name, ...rest }: Wrap & ComponentProps<"input">) {
  const fid = id ?? `f-${name}`;
  return (
    <Shell id={fid} {...{ label, hint, error, className, optional }}>
      <input id={fid} name={name} className={cn("field", error && "border-corail-500 focus:border-corail-500 focus:ring-corail-100")}
        aria-invalid={error ? true : undefined} aria-describedby={error ? `${fid}-error` : hint ? `${fid}-hint` : undefined} {...rest} />
    </Shell>
  );
}

export function TextArea({ label, hint, error, className, optional, id, name, ...rest }: Wrap & ComponentProps<"textarea">) {
  const fid = id ?? `f-${name}`;
  return (
    <Shell id={fid} {...{ label, hint, error, className, optional }}>
      <textarea id={fid} name={name} className={cn("field min-h-[110px] resize-y leading-relaxed", error && "border-corail-500")}
        aria-invalid={error ? true : undefined} {...rest} />
    </Shell>
  );
}

export function SelectField({ label, hint, error, className, optional, id, name, children, ...rest }: Wrap & ComponentProps<"select">) {
  const fid = id ?? `f-${name}`;
  return (
    <Shell id={fid} {...{ label, hint, error, className, optional }}>
      <select id={fid} name={name} className={cn("field appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2216%22 height=%2216%22 fill=%22none%22 stroke=%22%2355515B%22 stroke-width=%222%22 viewBox=%220 0 24 24%22><path d=%22m6 9 6 6 6-6%22/></svg>')] bg-[right_14px_center] bg-no-repeat pr-10")} {...rest}>
        {children}
      </select>
    </Shell>
  );
}
