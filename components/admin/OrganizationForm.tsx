"use client";
import { useRouter } from "next/navigation";
import { useActionState, useState } from "react";
import { Building, Plus, Save } from "lucide-react";
import { createOrganizationAction, updateOrganizationAction } from "@/app/admin/actions";
import { ORG_KINDS, type Organization } from "@/lib/types";
import { SelectField, TextField } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { useActionToast } from "@/components/ui/Toast";

function Fields({ org, errors }: { org?: Organization; errors?: Record<string, string> }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <TextField className="sm:col-span-2" label="Nom de l'organisme" name="name" required defaultValue={org?.name} placeholder="Ex. : Mairie de …" error={errors?.name} />
      <SelectField label="Type" name="kind" defaultValue={org?.kind ?? "CCAS"}>
        {ORG_KINDS.map((k) => <option key={k}>{k}</option>)}
      </SelectField>
      <TextField label="Ville" name="city" optional defaultValue={org?.city ?? ""} error={errors?.city} />
      <TextField label="Référent" name="contact_name" optional defaultValue={org?.contact_name ?? ""} placeholder="Nom du contact" />
      <TextField label="E-mail du référent" name="contact_email" type="email" optional defaultValue={org?.contact_email ?? ""} error={errors?.contact_email} />
      <input type="hidden" name="status" value={org?.status ?? "active"} />
    </div>
  );
}

export function NewOrganizationButton({ defaultOpen = false }: { defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const router = useRouter();
  const [state, action] = useActionState(createOrganizationAction, null);
  useActionToast(state, () => {
    setOpen(false);
    if (state?.ok && state.data) router.push(`/admin/partenaires/${state.data.id}?cree=1`);
  });
  return (
    <>
      <Button icon={<Plus className="size-4" />} onClick={() => setOpen(true)}>Nouveau partenaire</Button>
      <Dialog open={open} onClose={() => setOpen(false)} title="Nouveau partenaire" description="Créez l'organisme, puis invitez ses utilisateurs." size="lg">
        <form action={action} className="space-y-6">
          <Fields errors={state && !state.ok ? state.fieldErrors : undefined} />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Annuler</Button>
            <SubmitButton icon={<Building className="size-4" />} pendingLabel="Création…">Créer le partenaire</SubmitButton>
          </div>
        </form>
      </Dialog>
    </>
  );
}

export function EditOrganizationForm({ org }: { org: Organization }) {
  const [state, action] = useActionState(updateOrganizationAction.bind(null, org.id), null);
  useActionToast(state);
  return (
    <form action={action} className="space-y-6">
      <Fields org={org} errors={state && !state.ok ? state.fieldErrors : undefined} />
      <SubmitButton icon={<Save className="size-4" />} pendingLabel="Enregistrement…">Enregistrer</SubmitButton>
    </form>
  );
}
