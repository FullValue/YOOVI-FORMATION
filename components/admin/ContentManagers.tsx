"use client";
/* eslint-disable @next/next/no-img-element */
import { useActionState, useMemo, useState } from "react";
import { CircleAlert, CircleCheck, ExternalLink, FileText, Link as LinkIcon, Pencil, PlayCircle, Plus, Save, Trash, Upload } from "lucide-react";
import {
  createLessonAction, createResourceAction, deleteLessonAction, deleteResourceAction, reorderLessonsAction, reorderResourcesAction, updateLessonAction,
} from "@/app/admin/actions";
import type { Lesson, Resource } from "@/lib/types";
import { formatDuration } from "@/lib/format";
import { parseVideoInput, PROVIDER_LABELS, videoInputValue } from "@/lib/video";
import { cn } from "@/lib/cn";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { SelectField, TextArea, TextField } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { EmptyState } from "@/components/ui/EmptyState";
import { useActionToast } from "@/components/ui/Toast";
import { ReorderList } from "./Reorder";

const toMmss = (s: number | null) => (s == null ? "" : `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`);

function VideoField({ initial, error }: { initial: string; error?: string }) {
  const [value, setValue] = useState(initial);
  const parsed = useMemo(() => parseVideoInput(value), [value]);
  return (
    <div>
      <TextField label="Lien de la vidéo" name="video" value={value} onChange={(e) => setValue(e.target.value)} optional error={error}
        placeholder="https://youtu.be/… · https://vimeo.com/… · https://…/video.mp4"
        hint="YouTube (non répertorié), Vimeo (y compris privé avec son lien) ou fichier MP4 hébergé en https. Laissez vide si la vidéo n'est pas prête." />
      {value.trim() && (
        <div className={cn("mt-2 flex items-center gap-3 rounded-2xl p-3 text-[13px] font-semibold", parsed && parsed.provider !== "none" ? "bg-menthe-100 text-menthe-700" : "bg-corail-100 text-corail-700")}>
          {parsed && parsed.provider !== "none" ? (
            <>
              {parsed.provider === "youtube" && <img src={`https://i.ytimg.com/vi/${parsed.ref}/mqdefault.jpg`} alt="" className="h-12 w-20 rounded-lg object-cover" />}
              <CircleCheck className="size-4 shrink-0" /> {PROVIDER_LABELS[parsed.provider]} reconnu
            </>
          ) : (<><CircleAlert className="size-4 shrink-0" /> Lien non reconnu</>)}
        </div>
      )}
    </div>
  );
}

function LessonDialog({ moduleId, lesson, open, onClose }: { moduleId: string; lesson?: Lesson; open: boolean; onClose: () => void }) {
  const [state, action] = useActionState(lesson ? updateLessonAction.bind(null, lesson.id) : createLessonAction.bind(null, moduleId), null);
  useActionToast(state, onClose);
  const errors = state && !state.ok ? state.fieldErrors : undefined;
  return (
    <Dialog open={open} onClose={onClose} title={lesson ? "Modifier la vidéo" : "Ajouter une vidéo"} size="lg">
      <form action={action} className="space-y-5">
        <TextField label="Titre" name="title" required defaultValue={lesson?.title} error={errors?.title} />
        <VideoField initial={lesson ? videoInputValue(lesson.video_provider, lesson.video_ref) : ""} error={errors?.video} />
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField label="Durée" name="duration" optional placeholder="4:30" defaultValue={toMmss(lesson?.duration_seconds ?? null)} error={errors?.duration}
            hint="Format mm:ss. Affichée aux partenaires." />
          <SelectField label="Statut" name="status" defaultValue={lesson?.status ?? "published"}>
            <option value="published">Visible dans le module</option>
            <option value="draft">Masquée (brouillon)</option>
          </SelectField>
        </div>
        <TextArea label="Description" name="description" optional rows={4} defaultValue={lesson?.description} placeholder="Ce que le partenaire va apprendre dans cette vidéo…" />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>Annuler</Button>
          <SubmitButton icon={<Save className="size-4" />}>{lesson ? "Enregistrer" : "Ajouter la vidéo"}</SubmitButton>
        </div>
      </form>
    </Dialog>
  );
}

export function LessonManager({ moduleId, lessons }: { moduleId: string; lessons: Lesson[] }) {
  const [editing, setEditing] = useState<Lesson | null>(null);
  const [adding, setAdding] = useState(false);
  const [key, setKey] = useState(0);
  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button size="sm" icon={<Plus className="size-4" />} onClick={() => { setKey((k) => k + 1); setAdding(true); }}>Ajouter une vidéo</Button>
      </div>
      {lessons.length === 0 ? (
        <EmptyState compact icon={<PlayCircle />} title="Aucune vidéo">Ajoutez les chapitres du module. Le lien vidéo peut être renseigné plus tard.</EmptyState>
      ) : (
        <ReorderList items={lessons} onReorder={(ids) => reorderLessonsAction(moduleId, ids)} className="space-y-2"
          render={(l, i, controls) => (
            <div className="flex items-center gap-3 rounded-2xl border border-ligne bg-white p-3 pr-4">
              {controls}
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-violet-50 font-display text-sm font-bold text-violet-600">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{l.title}</p>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  {l.video_ref ? <Badge tone="menthe">{PROVIDER_LABELS[l.video_provider]}</Badge> : <Badge tone="jaune">Vidéo à renseigner</Badge>}
                  {l.duration_seconds != null && <Badge tone="gris">{formatDuration(l.duration_seconds)}</Badge>}
                  {l.status === "draft" && <Badge tone="gris">Masquée</Badge>}
                </div>
              </div>
              <Button size="sm" variant="secondary" icon={<Pencil className="size-3.5" />} onClick={() => setEditing(l)}>
                <span className="hidden sm:inline">Modifier</span>
              </Button>
              <ConfirmButton variant="ghost" icon={<Trash className="size-3.5" />} title="Supprimer cette vidéo ?"
                description={`« ${l.title} » et la progression associée seront supprimées.`} confirmLabel="Supprimer" action={() => deleteLessonAction(l.id)}>
                <span className="sr-only">Supprimer</span>
              </ConfirmButton>
            </div>
          )} />
      )}
      <LessonDialog key={`new-${key}`} moduleId={moduleId} open={adding} onClose={() => setAdding(false)} />
      {editing && <LessonDialog key={editing.id} moduleId={moduleId} lesson={editing} open onClose={() => setEditing(null)} />}
    </>
  );
}

export function ResourceManager({ moduleId, resources }: { moduleId: string; resources: Resource[] }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"file" | "url">("file");
  const [fileName, setFileName] = useState("");
  const [key, setKey] = useState(0);
  const [state, action] = useActionState(createResourceAction.bind(null, moduleId), null);
  useActionToast(state, () => { setOpen(false); setKey((k) => k + 1); setFileName(""); });
  const errors = state && !state.ok ? state.fieldErrors : undefined;
  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button size="sm" variant="secondary" icon={<Plus className="size-4" />} onClick={() => setOpen(true)}>Ajouter une ressource</Button>
      </div>
      {resources.length === 0 ? (
        <EmptyState compact icon={<FileText />} title="Aucune ressource">Guides PDF, fiches pratiques ou liens utiles.</EmptyState>
      ) : (
        <ReorderList items={resources} onReorder={(ids) => reorderResourcesAction(moduleId, ids)} className="space-y-2"
          render={(r, _i, controls) => (
            <div className="flex items-center gap-3 rounded-2xl border border-ligne bg-white p-3 pr-4">
              {controls}
              <span className={cn("grid size-9 shrink-0 place-items-center rounded-xl", r.file_path ? "bg-corail-100 text-corail-700" : "bg-bleu-100 text-bleu-600")}>
                {r.file_path ? <FileText className="size-[18px]" /> : <LinkIcon className="size-[18px]" />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{r.title}</p>
                <p className="truncate text-[12.5px] text-ink-faint">{r.file_path ? "PDF importé" : r.url}</p>
              </div>
              <a href={r.file_path ? `/api/files/resources/${r.file_path}` : r.url!} target="_blank" rel="noopener noreferrer"
                className="grid size-9 place-items-center rounded-xl text-ink-muted hover:bg-violet-100" aria-label="Ouvrir"><ExternalLink className="size-4" /></a>
              <ConfirmButton variant="ghost" icon={<Trash className="size-3.5" />} title="Supprimer cette ressource ?"
                description={`« ${r.title} » ne sera plus accessible aux partenaires.`} confirmLabel="Supprimer" action={() => deleteResourceAction(r.id)}>
                <span className="sr-only">Supprimer</span>
              </ConfirmButton>
            </div>
          )} />
      )}
      <Dialog open={open} onClose={() => setOpen(false)} title="Ajouter une ressource" description="Document PDF ou lien vers une page utile.">
        <form key={key} action={action} className="space-y-5">
          <TextField label="Titre" name="title" required error={errors?.title} placeholder="Ex. : Guide de prise en main" />
          <TextArea label="Description" name="description" optional rows={2} />
          <div className="grid grid-cols-2 gap-2 rounded-2xl bg-violet-50 p-1" role="tablist">
            {(["file", "url"] as const).map((m) => (
              <button key={m} type="button" role="tab" aria-selected={mode === m} onClick={() => setMode(m)}
                className={cn("rounded-xl py-2 text-sm font-semibold transition", mode === m ? "bg-white text-violet-700 shadow-sm" : "text-ink-muted")}>
                {m === "file" ? "Fichier PDF" : "Lien"}
              </button>
            ))}
          </div>
          {mode === "file" ? (
            <label className={cn("flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed p-6 text-center text-sm transition hover:bg-violet-50",
              errors?.file ? "border-corail-500" : "border-violet-200 hover:border-violet-400")}>
              <Upload className="size-6 text-violet-500" />
              <span className="font-semibold">{fileName || "Choisir un PDF"}</span>
              <span className="text-[12.5px] text-ink-faint">25 Mo maximum</span>
              <input type="file" name="file" accept="application/pdf" className="sr-only" onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "")} />
              {errors?.file && <span className="text-corail-700">{errors.file}</span>}
            </label>
          ) : (
            <TextField label="Adresse du lien" name="url" type="url" placeholder="https://…" error={errors?.url} />
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Annuler</Button>
            <SubmitButton icon={<Plus className="size-4" />} pendingLabel="Ajout…">Ajouter</SubmitButton>
          </div>
        </form>
      </Dialog>
    </>
  );
}
