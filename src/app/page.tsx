import { redirect } from "next/navigation";

import { getSession } from "@/server/better-auth/server";
import { LoginForm } from "./_components/login-form";


export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect("/dashboard");

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-sky-50 to-blue-50 px-4 py-16">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="text-sm font-semibold tracking-wide text-sky-700">
            Mecânica Fácil
          </div>
          <div className="mt-1 text-sm text-gray-500">
            Sistema de gestão para oficinas
          </div>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
