import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CircleCheckBig, ExternalLink, Trash } from "lucide-react";
import { requireStaff } from "@/lib/auth/session";
import { getRepo } from "@/lib/data";
import { AdminHeader, Panel } from "@/components/admin/ui";
import { ModuleForm } from "@/components/admin/ModuleForm";
import { LessonManager, ResourceManager } from "@/components/admin/ContentManagers";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { Badge } from "@/components/ui/Badge";
import { buttonClass } from "@/components/ui/Button";
import { deleteModuleAction } from "@/app/admin/actions";

type Params = { params: Promise<{ id: string }>; searchParams: Promise<{ cree?: string }> };
export const metadata: Metadata = { title: "Module" };

export default async function ModuleEditor({ params, searchParams }: Params) {
  const { id } = await params;
  const sp = await searchParams;
  await requireStaff();
  const mod = (await (await getRepo()).listModules()).find((m) => m.id === id);
  if (!mod) notFound();
  const { lessons, resources, ...module } = mod;

  return (
    <>
      <AdminHeader crumbs={[{ href: "/admin/modules", label: "Formations" }]} title={module.title}
        description={<span className="flex items-center gap-2">{module.status === "published" ? <Badge tone="menthe" dot>Publié</Badge> : <Badge tone="gris" dot>Brouillon — invisible pour les partenaires</Badge>}</span>}
        actions={module.status === "published" && (
          <Link href={`/formations/${module.slug}`} className={buttonClass("secondary", "md")} target="_blank"><ExternalLink className="size-4" />Voir côté partenaire</Link>
        )} />

      {sp.cree && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl bg-menthe-100 p-4 text-[14.5px] font-semibold text-menthe-700 animate-fade-up">
          <CircleCheckBig className="size-5" /> Module créé. Ajoutez maintenant ses vidéos, puis publiez-le.
        </div>
      )}

      <Panel title="Informations du module"><ModuleForm key={module.updated_at} module={module} /></Panel>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Panel title="Vidéos" description="Ordre de lecture du module. Utilisez les flèches pour réorganiser.">
          <LessonManager moduleId={module.id} lessons={lessons} />
        </Panel>
        <Panel title="Ressources" description="Documents PDF et liens affichés sur la page du module.">
          <ResourceManager moduleId={module.id} resources={resources} />
        </Panel>
      </div>

      <Panel className="mt-6 border border-corail-100" title="Zone sensible" description="La suppression efface le module, ses vidéos, ses ressources et la progression associée.">
        <ConfirmButton icon={<Trash className="size-4" />} title="Supprimer ce module ?"
          description={`« ${module.title} » sera supprimé définitivement, avec ${lessons.length} vidéo(s) et la progression des partenaires. Pour le masquer temporairement, dépubliez-le plutôt.`}
          confirmLabel="Supprimer définitivement" action={deleteModuleAction.bind(null, module.id)}>
          Supprimer le module
        </ConfirmButton>
      </Panel>
    </>
  );
}
