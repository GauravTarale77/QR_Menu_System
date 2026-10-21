import Image from "next/image";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin-auth";
import { logout } from "../actions";
import AdminNav from "@/components/admin/AdminNav";

export const metadata = { title: "Admin" };

export const dynamic = "force-dynamic";

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!(await isAdmin())) redirect("/admin/login");

  return (
    <div className="min-h-screen">
      <header className="border-b border-latte bg-white print:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="VareqonTech" width={90} height={45} />
            <span className="rounded-full bg-espresso px-3 py-1 text-xs font-medium text-cream">
              Admin
            </span>
          </div>
          <form action={logout}>
            <button className="rounded-full bg-latte px-4 py-2 text-sm font-medium text-mocha">
              Log out
            </button>
          </form>
        </div>
        <AdminNav />
      </header>
      <div className="mx-auto max-w-6xl p-4">{children}</div>
    </div>
  );
}