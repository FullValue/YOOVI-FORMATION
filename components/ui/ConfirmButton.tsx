"use client";
import { useState, useTransition, type ReactNode } from "react";
import { Dialog } from "./Dialog";
import { Button } from "./Button";
import { useToast } from "./Toast";
import type { ActionResult } from "@/lib/types";

/** Bouton qui demande confirmation avant d'exécuter une action serveur sensible. */
export function ConfirmButton({ action, title, description, confirmLabel = "Confirmer", children, variant = "danger", size = "sm", icon, tone = "danger" }: {
  action: () => Promise<ActionResult<unknown>>; title: string; description: ReactNode; confirmLabel?: string;
  children: ReactNode; variant?: "danger" | "secondary" | "ghost" | "soft"; size?: "sm" | "md"; icon?: ReactNode; tone?: "danger" | "primary";
}) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const toast = useToast();
  return (
    <>
      <Button type="button" variant={variant} size={size} icon={icon} onClick={() => setOpen(true)}>{children}</Button>
      <Dialog open={open} onClose={() => setOpen(false)} title={title} description={description}>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={() => setOpen(false)}>Annuler</Button>
          <Button
            variant={tone === "danger" ? "dark" : "primary"}
            className={tone === "danger" ? "bg-corail-500 hover:bg-corail-700" : undefined}
            loading={pending}
            onClick={() => start(async () => {
              const res = await action();
              if (res.ok) { if (res.message) toast("success", res.message); setOpen(false); }
              else toast("error", res.error);
            })}
          >
            {confirmLabel}
          </Button>
        </div>
      </Dialog>
    </>
  );
}
