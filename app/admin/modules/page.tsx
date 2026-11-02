import type { Metadata } from "next";
import { MonitorPlay } from "lucide-react";
import { requireStaff } from "@/lib/auth/session";
import { getPlatformStats } from "@/lib/stats";
import { AdminHeader } from "@/components/admin/ui";
import { NewModuleButton } from "@/components/admin/ModuleForm";
import { ModuleList } from "@/components/admin/ModuleList";
import { EmptyState } from "@/components/ui/EmptyState";

export const metadata: Metadata = { title: "Formations" };

export default async function ModulesAdmin({ searchParams }: { searchParams: Promise<{ nouveau?: string }> }) {
  await requireStaff();
  const sp = await searchParams;
  const s = await getPlatformStats();
  const rows = s.moduleStats.map(({ module: m, views, learners }) => ({
    ...m, lessons: undefined, resources: undefined,
    lessonCount: m.lessons.length, videoCount: m.lessons.filter((l) => l.video_ref).length, resourceCount: m.resources.length, views, learners,
  }));
  return (
    <>
      <AdminHeader title="Formations" description="Créez, ordonnez et publiez les modules. L'ordre ci-dessous est celui affiché aux partenaires."
        actions={<NewModuleButton defaultOpen={sp.nouveau === "1"} />} />
      {rows.length === 0 ? (
        <EmptyState icon={<MonitorPlay />} title="Aucun module">Créez un premier module de formation.</EmptyState>
      ) : (
        <ModuleList modules={rows} />
      )}
    </>
  );
}
