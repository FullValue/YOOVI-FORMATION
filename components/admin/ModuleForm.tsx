"use client";
/* eslint-disable @next/next/no-img-element */
import { useActionState, useState } from "react";
import { ImageIcon, Plus, Save, X } from "lucide-react";
import { createModuleAction, updateModuleAction } from "@/app/admin/actions";
import type { Module } from "@/lib/types";
import { slugify } from "@/lib/format";
import { cn } from "@/lib/cn";
import { MODULE_COLORS, MODULE_ICONS } from "@/components/learning/icons";
import { ModuleCover } from "@/components/learning/ModuleCover";
import { SelectField, TextArea, TextField } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { useActionToast } from "@/components/ui/Toast";

export function ModuleForm({ module }: { module?: Module }) {
  const [state, action] = useActionState(module ? updateModuleAction.bind(null, module.id) : createModuleAction, null);
  useActionToast(state);
  const errors = state && !state.ok ? state.fieldErrors : undefined;
  const [title, setTitle] = useState(module?.title ?? "");
  const [slug, setSlug] = useState(module?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(module));
  const [icon, setIcon] = useState(module?.icon ?? "sparkles");
  const [color, setColor] = useState(module?.color ?? "violet");
  const [thumb, setThumb] = useState<string | null>(module?.thumbnail_url ?? null);
  const [removeThumb, setRemoveThumb] = useState(false);

  return (
    <form action={action} className="grid gap-8 lg:grid-cols-[1fr_300px]">
      <div className="space-y-5">
        <TextField label="Titre du module" name="title" required value={title} error={errors?.title}
          onChange={(e) => { setTitle(e.target.value); if (!slugTouched) setSlug(slugify(e.target.value)); }} />
        <TextField label="Adresse (slug)" name="slug" value={slug} error={errors?.slug}
          onChange={(e) => { setSlug(e.target.value); setSlugTouched(true); }}
          hint={<>formation.yoovi.fr/formations/<strong>{slugify(slug || title) || "…"}</strong></>} />
        <TextArea label="Courte description" name="summary" rows={2} maxLength={300} defaultValue={module?.summary} error={errors?.summary}
          hint="Affichée sur la carte du module (300 caractères max.)." />
        <TextArea label="Objectif pédagogique" name="objective" rows={2} maxLength={400} defaultValue={module?.objective} optional />
        <SelectField label="Statut" name="status" defaultValue={module?.status ?? "draft"}
          hint="Un brouillon n'est visible que par l'équipe Yoovi.">
          <option value="draft">Brouillon</option>
          <option value="published">Publié</option>
        </SelectField>
        <SubmitButton icon={module ? <Save className="size-4" /> : <Plus className="size-4" />} pendingLabel="Enregistrement…">
          {module ? "Enregistrer le module" : "Créer le module"}
        </SubmitButton>
      </div>

      <div className="space-y-5">
        <div>
          <p className="label">Aperçu de la carte</p>
          <div className="overflow-hidden rounded-3xl shadow-card">
            <ModuleCover module={{ title, icon, color, thumbnail_url: removeThumb ? null : thumb }} index={module?.position ?? 0} className="aspect-[16/9]" />
            <div className="bg-white p-4"><p className="truncate font-display font-bold">{title || "Titre du module"}</p></div>
          </div>
        </div>
        <fieldset>
          <legend className="label">Icône</legend>
          <input type="hidden" name="icon" value={icon} />
          <div className="grid grid-cols-8 gap-1.5">
            {Object.entries(MODULE_ICONS).map(([key, { icon: Icon, label }]) => (
              <button key={key} type="button" onClick={() => setIcon(key)} title={label} aria-label={label} aria-pressed={icon === key}
                className={cn("grid aspect-square place-items-center rounded-xl transition", icon === key ? "bg-violet-500 text-white shadow-button" : "bg-violet-50 text-violet-600 hover:bg-violet-100")}>
                <Icon className="size-4" />
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="label">Couleur</legend>
          <input type="hidden" name="color" value={color} />
          <div className="flex flex-wrap gap-2">
            {Object.entries(MODULE_COLORS).map(([key, c]) => (
              <button key={key} type="button" onClick={() => setColor(key)} title={c.label} aria-label={c.label} aria-pressed={color === key}
                className={cn("size-9 rounded-full ring-offset-2 transition", color === key ? "ring-2 ring-ink" : "hover:scale-110")}
                style={{ background: `linear-gradient(135deg, ${c.from}, ${c.to})` }} />
            ))}
          </div>
        </fieldset>
        <div>
          <p className="label">Miniature <span className="font-normal text-ink-faint">(facultatif)</span></p>
          <label className="flex cursor-pointer items-center gap-3 rounded-2xl border-2 border-dashed border-violet-200 p-3 text-[13.5px] text-ink-muted hover:border-violet-400 hover:bg-violet-50">
            <ImageIcon className="size-5 text-violet-500" />
            <span className="flex-1">Importer une image (PNG, JPG, WebP · 5 Mo)</span>
            <input type="file" name="thumbnail_file" accept="image/png,image/jpeg,image/webp" className="sr-only"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) { setThumb(URL.createObjectURL(f)); setRemoveThumb(false); } }} />
          </label>
          <input type="hidden" name="thumbnail_url" value={module?.thumbnail_url && !removeThumb ? module.thumbnail_url : ""} />
          {(thumb && !removeThumb) && (
            <button type="button" onClick={() => setRemoveThumb(true)} className="mt-2 inline-flex items-center gap-1 text-[13px] font-semibold text-corail-700 hover:underline">
              <X className="size-3.5" /> Retirer la miniature
            </button>
          )}
          <input type="hidden" name="remove_thumbnail" value={removeThumb ? "1" : ""} />
        </div>
      </div>
    </form>
  );
}

export function NewModuleButton({ defaultOpen = false }: { defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <>
      <Button icon={<Plus className="size-4" />} onClick={() => setOpen(true)}>Nouveau module</Button>
      <Dialog open={open} onClose={() => setOpen(false)} title="Nouveau module" description="Le module est créé en brouillon : ajoutez ses vidéos, puis publiez-le." size="lg">
        <ModuleForm />
      </Dialog>
    </>
  );
}
