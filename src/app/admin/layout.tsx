import { AdminShell } from "@/components/admin-shell";
import { user } from "@/server/auth";
import { redirect } from "next/navigation";
export const metadata = { robots: { index: false, follow: false } };
export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const account = await user();
  if (account?.role !== "admin") redirect("/connexion?next=/admin");
  return <AdminShell>{children}</AdminShell>;
}
