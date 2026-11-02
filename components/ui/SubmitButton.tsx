"use client";
import { useFormStatus } from "react-dom";
import type { ComponentProps } from "react";
import { Button } from "./Button";

/** Bouton d'envoi qui affiche l'état de chargement du formulaire parent. */
export function SubmitButton({ children, pendingLabel, ...rest }: ComponentProps<typeof Button> & { pendingLabel?: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending} {...rest}>
      {pending && pendingLabel ? pendingLabel : children}
    </Button>
  );
}
