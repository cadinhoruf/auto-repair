import { redirect } from "next/navigation";

import { getSession } from "@/server/better-auth/server";
import { LoginForm } from "./_components/login-form";


export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect("/dashboard");

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c] px-4 py-16 text-white">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="text-sm font-semibold tracking-wide text-white/80">
            Auto Repair
          </div>
          <div className="mt-1 text-xs text-white/60">
            Sistema de gestão da oficina
          </div>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
