"use client";
import { useActionState, useState, useTransition } from "react";
import { Check, Copy, FlaskConical, KeyRound, Pencil, Power, Save, Trash, UserPlus } from "lucide-react";
import { deleteUserAction, inviteUserAction, resetAccessAction, setUserStatusAction, updateUserAction } from "@/app/admin/actions";
import type { Organization, Profile, UserRole } from "@/lib/types";
import { ROLE_LABELS } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { SelectField, TextField } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { useActionToast, useToast } from "@/components/ui/Toast";
import { ConfirmButton } from "@/components/ui/ConfirmButton";

type OrgOption = Pick<Organization, "id" | "name">;

function DemoLink({ link, label }: { link: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="rounded-2xl border border-dashed border-jaune-500/60 bg-jaune-100/60 p-4 text-sm">
      <p className="mb-2 flex items-center gap-2 font-semibold text-jaune-700"><FlaskConical className="size-4" /> Mode démo : aucun e-mail n&apos;est envoyé</p>
      <p className="mb-3 text-ink-muted">{label}</p>
      <div className="flex gap-2">
        <input readOnly value={link} className="field py-2 text-[13px]" onFocus={(e) => e.currentTarget.select()} aria-label="Lien" />
        <Button type="button" size="sm" variant="secondary" className="h-auto" onClick={async () => { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
          icon={copied ? <Check className="size-4" /> : <Copy className="size-4" />}>{copied ? "Copié" : "Copier"}</Button>
      </div>
    </div>
  );
}

export function InviteUserButton({ organizations, fixedOrgId, canManageAdmins, defaultOpen = false, size = "md" }: {
  organizations: OrgOption[]; fixedOrgId?: string; canManageAdmins: boolean; defaultOpen?: boolean; size?: "sm" | "md";
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [role, setRole] = useState<UserRole>("partner");
  const [formKey, setFormKey] = useState(0);
  const [state, action] = useActionState(inviteUserAction, null);
  useActionToast(state);
  const errors = state && !state.ok ? state.fieldErrors : undefined;
  const done = state?.ok ? state.data : null;

  const close = () => { setOpen(false); setFormKey((k) => k + 1); };
  return (
    <>
      <Button size={size} icon={<UserPlus className="size-4" />} onClick={() => setOpen(true)}>Inviter un utilisateur</Button>
      <Dialog open={open} onClose={close} title="Inviter un utilisateur"
        description="La personne reçoit un e-mail pour activer son compte et choisir son mot de passe." size="lg">
        {done && state?.ok ? (
          <div className="space-y-5">
            <div className="flex items-center gap-3 rounded-2xl bg-menthe-100 p-4 text-[15px] font-semibold text-menthe-700">
              <Check className="size-5" /> Compte créé pour {done.email}
            </div>
            {done.demoLink && <DemoLink link={done.demoLink} label="Transmettez ce lien d'activation à la personne invitée (valable 7 jours)." />}
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => { setFormKey((k) => k + 1); }}>Inviter une autre personne</Button>
              <Button onClick={close}>Terminer</Button>
            </div>
          </div>
        ) : (
          <form key={formKey} action={action} className="space-y-5">
            <TextField label="Adresse e-mail" name="email" type="email" required placeholder="prenom.nom@organisme.fr" error={errors?.email} />
            <div className="grid gap-5 sm:grid-cols-2">
              <TextField label="Nom et prénom" name="full_name" optional />
              <TextField label="Fonction" name="job_title" optional placeholder="Ex. : Médiatrice numérique" />
            </div>
            {canManageAdmins && !fixedOrgId && (
              <SelectField label="Rôle" name="role" value={role} onChange={(e) => setRole(e.target.value as UserRole)}>
                <option value="partner">{ROLE_LABELS.partner}</option>
                <option value="admin">{ROLE_LABELS.admin} (équipe Yoovi)</option>
                <option value="super_admin">{ROLE_LABELS.super_admin} (équipe Yoovi)</option>
              </SelectField>
            )}
            {fixedOrgId ? (
              <input type="hidden" name="organization_id" value={fixedOrgId} />
            ) : role === "partner" ? (
              <SelectField label="Organisme partenaire" name="organization_id" required defaultValue="" error={errors?.organization_id}>
                <option value="" disabled>Choisir un organisme…</option>
                {organizations.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
              </SelectField>
            ) : null}
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="secondary" onClick={close}>Annuler</Button>
              <SubmitButton icon={<UserPlus className="size-4" />} pendingLabel="Envoi…">Envoyer l&apos;invitation</SubmitButton>
            </div>
          </form>
        )}
      </Dialog>
    </>
  );
}

export function EditUserButton({ user, organizations, canManageAdmins, isSelf }: {
  user: Profile; organizations: OrgOption[]; canManageAdmins: boolean; isSelf: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<UserRole>(user.role);
  const [state, action] = useActionState(updateUserAction.bind(null, user.id), null);
  useActionToast(state, () => setOpen(false));
  const errors = state && !state.ok ? state.fieldErrors : undefined;
  return (
    <>
      <Button size="sm" variant="secondary" icon={<Pencil className="size-3.5" />} onClick={() => setOpen(true)}>Modifier</Button>
      <Dialog open={open} onClose={() => setOpen(false)} title="Modifier l'utilisateur" description={user.email}>
        <form action={action} className="space-y-5">
          <TextField label="Nom et prénom" name="full_name" defaultValue={user.full_name ?? ""} optional />
          <TextField label="Fonction" name="job_title" defaultValue={user.job_title ?? ""} optional />
          {canManageAdmins && !isSelf ? (
            <SelectField label="Rôle" name="role" value={role} onChange={(e) => setRole(e.target.value as UserRole)}>
              {(["partner", "admin", "super_admin"] as const).map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
            </SelectField>
          ) : <input type="hidden" name="role" value={user.role} />}
          {role === "partner" && (
            <SelectField label="Organisme" name="organization_id" defaultValue={user.organization_id ?? ""} error={errors?.organization_id}>
              <option value="" disabled>Choisir…</option>
              {organizations.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
            </SelectField>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Annuler</Button>
            <SubmitButton icon={<Save className="size-4" />}>Enregistrer</SubmitButton>
          </div>
        </form>
      </Dialog>
    </>
  );
}

export function UserQuickActions({ user, canDelete, isSelf, canEdit }: { user: Profile; canDelete: boolean; isSelf: boolean; canEdit: boolean }) {
  const [link, setLink] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const toast = useToast();
  if (!canEdit) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button size="sm" variant="ghost" loading={pending} icon={<KeyRound className="size-3.5" />}
        onClick={() => start(async () => {
          const r = await resetAccessAction(user.id);
          if (r.ok) { toast("success", r.message ?? "Lien envoyé."); if (r.data?.demoLink) setLink(r.data.demoLink); }
          else toast("error", r.error);
        })}>
        {user.status === "invited" ? "Renvoyer l'invitation" : "Réinitialiser l'accès"}
      </Button>
      {!isSelf && (
        user.status === "disabled" ? (
          <ConfirmButton variant="soft" tone="primary" icon={<Power className="size-3.5" />} title="Réactiver ce compte ?"
            description={`${user.email} pourra de nouveau se connecter.`} confirmLabel="Réactiver" action={() => setUserStatusAction(user.id, "active")}>
            Réactiver
          </ConfirmButton>
        ) : (
          <ConfirmButton icon={<Power className="size-3.5" />} title="Désactiver ce compte ?"
            description={`${user.email} ne pourra plus se connecter. Sa progression est conservée et le compte peut être réactivé à tout moment.`}
            confirmLabel="Désactiver" action={() => setUserStatusAction(user.id, "disabled")}>
            Désactiver
          </ConfirmButton>
        )
      )}
      {canDelete && !isSelf && (
        <ConfirmButton variant="ghost" icon={<Trash className="size-3.5" />} title="Supprimer définitivement ?"
          description="Le compte et toute sa progression seront effacés. Cette action est irréversible : préférez la désactivation si vous avez un doute."
          confirmLabel="Supprimer" action={() => deleteUserAction(user.id)}>
          <span className="sr-only">Supprimer</span>
        </ConfirmButton>
      )}
      <Dialog open={Boolean(link)} onClose={() => setLink(null)} title="Lien d'accès généré">
        {link && <DemoLink link={link} label={`Transmettez ce lien à ${user.email} pour qu'il choisisse un nouveau mot de passe.`} />}
      </Dialog>
    </div>
  );
}

