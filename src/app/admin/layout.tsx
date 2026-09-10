import { redirect } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import { currentUser } from "@/lib/auth";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";
export const metadata = { title: "لوحة التحكم" };

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();
  if (!user) redirect("/login");

  const settings = await getSettings();

  return (
    <AdminShell user={user} workshopName={settings.workshop_name}>
      {children}
    </AdminShell>
  );
}
