import { redirect } from "next/navigation";
import { accessState, getSessionUser, isStaff } from "@/lib/auth/session";

export default async function Home() {
  const user = await getSessionUser();
  if (!user) redirect("/connexion");
  if (accessState(user) !== "ok") redirect(`/acces-suspendu?raison=${accessState(user)}`);
  redirect(isStaff(user) ? "/admin" : "/tableau-de-bord");
}
