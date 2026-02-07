import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/server/better-auth";
import { getSession } from "@/server/better-auth/server";

const navLinks = [
	{ href: "/dashboard", label: "Painel" },
	{ href: "/clientes", label: "Clientes" },
	{ href: "/ordens-servico", label: "Ordens de Serviço" },
	{ href: "/caixa", label: "Caixa" },
	{ href: "/orcamentos", label: "Orçamentos" },
	{ href: "/catalogo", label: "Catálogo" },
	{ href: "/usuarios", label: "Usuários", adminOnly: true },
	{ href: "/organizacoes", label: "Organizações", adminOnly: true },
];

export default async function AuthenticatedLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const session = await getSession();
	if (!session) redirect("/");

	const isAdmin = session.user.role === "admin";
	const visibleLinks = navLinks.filter((link) => !link.adminOnly || isAdmin);

	return (
		<div className="flex min-h-screen bg-gray-50">
			{/* Sidebar */}
			<aside className="flex w-56 shrink-0 flex-col border-r border-gray-200 bg-white">
				<div className="flex h-14 items-center border-b border-gray-200 px-4">
					<span className="font-semibold text-sm text-blue-600">
						Auto Repair
					</span>
				</div>

				<nav className="flex flex-1 flex-col gap-1 p-3">
					{visibleLinks.map((link) => (
						<Link
							key={link.href}
							href={link.href}
							className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
						>
							{link.label}
						</Link>
					))}
				</nav>

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
			<main className="flex-1 overflow-y-auto p-6">{children}</main>
		</div>
	);
}
