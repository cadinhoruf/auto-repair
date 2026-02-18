import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { SidebarNav } from "@/app/(authenticated)/_components/sidebar-nav";
import { auth } from "@/server/better-auth";
import { getSession } from "@/server/better-auth/server";
import { db } from "@/server/db";

export const metadata: Metadata = {
  title: "Painel",
  description: "Área restrita do sistema de gestão para oficinas.",
  robots: { index: false, follow: false },
};

type NavLinkItem = { href: string; label: string; adminOnly?: boolean };

const navGroups: { group: string; links: NavLinkItem[] }[] = [
  {
    group: "Operacional",
    links: [
      { href: "/dashboard", label: "Painel" },
      { href: "/clientes", label: "Clientes" },
      { href: "/catalogo", label: "Catálogo" },
      { href: "/ordens-servico", label: "Ordens de Serviço" },
      { href: "/orcamentos", label: "Orçamentos" },
    ],
  },
  {
    group: "Financeiro",
    links: [
      { href: "/caixa", label: "Fluxo de caixa" },
    ],
  },
  {
    group: "Administração",
    links: [
      { href: "/organizacoes", label: "Organizações", adminOnly: true },
      { href: "/usuarios", label: "Usuários", adminOnly: true },
    ],
  },
];

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/");

  const isAdmin = session.user.role === "admin";
  const visibleGroups = navGroups
    .map(({ group, links }) => ({
      group,
      links: links.filter((link) => !link.adminOnly || isAdmin),
    }))
    .filter((g) => g.links.length > 0);

  // Busca o nome da organização ativa
  const activeOrgId = (session.session as Record<string, unknown>)
    .activeOrganizationId as string | null | undefined;
  const activeOrg = activeOrgId
    ? await db.organization.findUnique({
      where: { id: activeOrgId },
      select: { name: true },
    })
    : null;

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="flex w-56 shrink-0 flex-col border-r border-gray-200 bg-white">
        <div className="flex h-14 items-center border-b border-gray-200 px-4">
          <span className="font-semibold text-sm text-blue-600 truncate">
            {activeOrg?.name ?? "Mecânica Fácil"}
          </span>
        </div>

        <SidebarNav groups={visibleGroups} />

        <div className="border-t border-gray-200 p-3">
          <div className="mb-2 truncate px-3 text-xs text-gray-500">
            {session.user.name ?? session.user.email}
          </div>
          <form>
            <button
              type="submit"
              className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-gray-600 transition hover:bg-gray-100"
              formAction={async () => {
                "use server";
                await auth.api.signOut({ headers: await headers() });
                redirect("/");
              }}
            >
              Sair
            </button>
          </form>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden p-6">{children}</main>
    </div>
  );
}
