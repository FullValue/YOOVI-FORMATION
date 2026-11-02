"use client";
import { useActionState, useState } from "react";
import { Power, Save, Trash } from "lucide-react";
import { deleteOrganizationAction, saveOrganizationCatalogAction, saveOrganizationNotesAction, setOrganizationStatusAction } from "@/app/admin/actions";
import type { Organization } from "@/lib/types";
import { cn } from "@/lib/cn";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { useActionToast } from "@/components/ui/Toast";
import { TextArea } from "@/components/ui/Field";

export function CatalogAccessForm({ org, modules, selected }: { org: Organization; modules: { id: string; title: string; status: string }[]; selected: string[] }) {
  const [mode, setMode] = useState(org.catalog_mode);
  const [state, action] = useActionState(saveOrganizationCatalogAction.bind(null, org.id), null);
  useActionToast(state);
  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Accès au catalogue">
        {[
          { v: "all", t: "Tout le catalogue", d: "Tous les modules publiés, y compris les futurs." },
          { v: "custom", t: "Catalogue personnalisé", d: "Uniquement les modules cochés ci-dessous." },
        ].map((o) => (
          <label key={o.v} className={cn("cursor-pointer rounded-2xl border-2 p-4 transition", mode === o.v ? "border-violet-500 bg-violet-50" : "border-ligne hover:border-violet-200")}>
            <input type="radio" name="catalog_mode" value={o.v} checked={mode === o.v} onChange={() => setMode(o.v as "all" | "custom")} className="sr-only" />
            <span className="block font-semibold">{o.t}</span>
            <span className="text-[13px] text-ink-muted">{o.d}</span>
          </label>
        ))}
      </div>
      {mode === "custom" && (
        <fieldset className="grid gap-2 rounded-2xl bg-violet-50 p-4 animate-fade-in">
          <legend className="sr-only">Modules accessibles</legend>
          {modules.map((m) => (
            <label key={m.id} className="flex cursor-pointer items-center gap-3 rounded-xl bg-white px-3 py-2.5 text-[14px] font-medium shadow-sm">
              <input type="checkbox" name="modules" value={m.id} defaultChecked={selected.includes(m.id)} className="size-4 accent-violet-500" />
              <span className="flex-1">{m.title}</span>
              {m.status === "draft" && <span className="text-[12px] text-ink-faint">brouillon</span>}
            </label>
          ))}
        </fieldset>
      )}
      <SubmitButton size="sm" icon={<Save className="size-4" />}>Enregistrer l&apos;accès</SubmitButton>
    </form>
  );
}

export function NotesForm({ orgId, notes }: { orgId: string; notes: string }) {
  const [state, action] = useActionState(saveOrganizationNotesAction.bind(null, orgId), null);
  useActionToast(state);
  return (
    <form action={action} className="space-y-3">
      <TextArea label="Notes internes" name="notes" defaultValue={notes} rows={5} placeholder="Contexte du partenariat, interlocuteurs, prochaines étapes…"
        hint="Visibles uniquement par l'équipe Yoovi, jamais par le partenaire." />
      <SubmitButton size="sm" variant="secondary" icon={<Save className="size-4" />}>Enregistrer les notes</SubmitButton>
    </form>
  );
}

export function OrganizationStatusButton({ org }: { org: Organization }) {
  return org.status === "active" ? (
    <ConfirmButton size="md" icon={<Power className="size-4" />} title={`Désactiver ${org.name} ?`}
      description="Tous les utilisateurs de cet organisme perdront l'accès à la plateforme. Leur progression est conservée et l'accès peut être rétabli à tout moment."
      confirmLabel="Désactiver" action={() => setOrganizationStatusAction(org.id, "inactive")}>
      Désactiver
    </ConfirmButton>
  ) : (
    <ConfirmButton size="md" variant="soft" tone="primary" icon={<Power className="size-4" />} title={`Réactiver ${org.name} ?`}
      description="Les utilisateurs actifs de cet organisme retrouveront l'accès à leur espace de formation." confirmLabel="Réactiver"
      action={() => setOrganizationStatusAction(org.id, "active")}>
      Réactiver
    </ConfirmButton>
  );
}

export function DeleteOrganizationButton({ org }: { org: Organization }) {
  return (
    <ConfirmButton icon={<Trash className="size-4" />} title={`Supprimer ${org.name} ?`}
      description="L'organisme est supprimé définitivement. Ses utilisateurs sont désactivés et détachés. Cette action est irréversible."
      confirmLabel="Supprimer définitivement" action={() => deleteOrganizationAction(org.id)}>
      Supprimer le partenaire
    </ConfirmButton>
  );
}
