import Image from "next/image";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin-auth";
import LoginForm from "./LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await isAdmin()) redirect("/admin");

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-sm ring-1 ring-latte">
        <div className="flex justify-center">
          <Image src="/logo.png" alt="VareqonTech" width={150} height={75} priority />
        </div>
        <h1 className="mt-4 text-center font-display text-2xl text-espresso">
          Admin sign in
        </h1>
        <LoginForm />
      </div>
    </main>
  );
}