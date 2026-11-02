import type { Metadata } from "next";
import { requireStaff } from "@/lib/auth/session";
import { initials } from "@/lib/format";
import { ROLE_LABELS } from "@/lib/types";
import { AdminMobileNav, AdminSidebar } from "@/components/shell/AdminNav";

export const metadata: Metadata = { title: { default: "Back-office", template: "%s · Back-office Yoovi" } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireStaff();
  return (
    <div className="flex min-h-dvh bg-[#F9F7FF]">
      <AdminSidebar name={user.full_name || user.email} email={user.email} initials={initials(user.full_name, user.email)} roleLabel={ROLE_LABELS[user.role]} />
      <div className="min-w-0 flex-1">
        <AdminMobileNav />
        <main id="contenu" className="mx-auto max-w-[1180px] px-4 pb-24 pt-6 sm:px-8 lg:pt-10">{children}</main>
      </div>
    </div>
  );
}
