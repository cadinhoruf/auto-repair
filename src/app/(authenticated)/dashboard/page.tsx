import Link from "next/link";

import { getSession } from "@/server/better-auth/server";

const cards = [
	{ href: "/clientes", label: "Clientes", description: "Gerenciar clientes da oficina" },
	{ href: "/ordens-servico", label: "Ordens de Serviço", description: "Acompanhar serviços" },
	{ href: "/caixa", label: "Fluxo de Caixa", description: "Entradas e saídas" },
	{ href: "/orcamentos", label: "Orçamentos", description: "Gerar orçamentos em PDF" },
	{ href: "/catalogo", label: "Catálogo", description: "Itens e serviços cadastrados" },
	{ href: "/usuarios", label: "Usuários", description: "Gerenciar usuários do sistema", adminOnly: true },
];

export default async function DashboardPage() {
	const session = await getSession();
	const isAdmin = session?.user.role === "admin";

	const visibleCards = cards.filter((c) => !c.adminOnly || isAdmin);

	return (
		<div>
			<h1 className="mb-6 font-semibold text-2xl tracking-tight text-gray-900">
				Painel
			</h1>
			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				{visibleCards.map((c) => (
					<Link
						key={c.href}
						href={c.href}
						className="flex flex-col gap-1 rounded-xl border border-gray-200 bg-white p-5 transition hover:border-indigo-300 hover:shadow-sm"
					>
						<span className="font-medium text-sm text-gray-900">{c.label}</span>
						<span className="text-xs text-gray-500">{c.description}</span>
					</Link>
				))}
			</div>
		</div>
	);
}
