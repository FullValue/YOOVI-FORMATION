"use client";
import Link from "next/link";
import { useTransition } from "react";
import { Eye, EyeOff, Pencil } from "lucide-react";
import { reorderModulesAction, setModuleStatusAction } from "@/app/admin/actions";
import type { Module } from "@/lib/types";
import { ModuleCover } from "@/components/learning/ModuleCover";
import { Badge } from "@/components/ui/Badge";
import { Button, buttonClass } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { ReorderList } from "./Reorder";

export type ModuleRow = Module & { lessonCount: number; videoCount: number; resourceCount: number; views: number; learners: number };

function StatusToggle({ m }: { m: ModuleRow }) {
  const [pending, start] = useTransition();
  const toast = useToast();
  const published = m.status === "published";
  return (
    <Button size="sm" variant={published ? "ghost" : "soft"} loading={pending} icon={published ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
      onClick={() => start(async () => {
        const r = await setModuleStatusAction(m.id, published ? "draft" : "published");
        toast(r.ok ? "success" : "error", r.ok ? r.message ?? "" : r.error);
      })}>
      {published ? "Dépublier" : "Publier"}
    </Button>
  );
}

export function ModuleList({ modules }: { modules: ModuleRow[] }) {
  return (
    <ReorderList items={modules} onReorder={reorderModulesAction} className="space-y-3"
      render={(m, i, controls) => (
        <div className="surface flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            {controls}
            <ModuleCover module={m} size="sm" className="h-16 w-24 shrink-0 rounded-2xl" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[12px] font-bold text-ink-faint">#{i + 1}</span>
                <Link href={`/admin/modules/${m.id}`} className="truncate font-display text-[16.5px] font-bold hover:text-violet-600">{m.title}</Link>
                {m.status === "published" ? <Badge tone="menthe" dot>Publié</Badge> : <Badge tone="gris" dot>Brouillon</Badge>}
              </div>
              <p className="mt-1 text-[13px] text-ink-muted">
                {m.lessonCount} vidéo{m.lessonCount > 1 ? "s" : ""}
                {m.lessonCount > 0 && <> · <span className={m.videoCount < m.lessonCount ? "font-semibold text-jaune-700" : ""}>{m.videoCount}/{m.lessonCount} en ligne</span></>}
                {" · "}{m.resourceCount} ressource{m.resourceCount > 1 ? "s" : ""} · {m.views} vue{m.views > 1 ? "s" : ""} · {m.learners} apprenant{m.learners > 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2 self-end sm:self-center">
            <StatusToggle m={m} />
            <Link href={`/admin/modules/${m.id}`} className={buttonClass("secondary", "sm")}><Pencil className="size-3.5" />Gérer</Link>
          </div>
        </div>
      )} />
  );
}
