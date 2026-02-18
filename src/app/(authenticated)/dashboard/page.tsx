import type { Metadata } from "next";
import Link from "next/link";

import { canAccessCashFlow } from "@/lib/permissions";
import { getSession } from "@/server/better-auth/server";
import { db } from "@/server/db";

export const metadata: Metadata = {
	title: "Painel",
	description: "Visão geral e acesso rápido às funcionalidades do sistema.",
};

const cards = [
	{ href: "/clientes", label: "Clientes", description: "Gerenciar clientes da oficina" },
	{ href: "/ordens-servico", label: "Ordens de Serviço", description: "Acompanhar serviços" },
	{ href: "/caixa", label: "Fluxo de Caixa", description: "Entradas e saídas", cashFlowOnly: true },
	{ href: "/orcamentos", label: "Orçamentos", description: "Gerar orçamentos em PDF" },
	{ href: "/catalogo", label: "Catálogo", description: "Itens e serviços cadastrados" },
	{ href: "/usuarios", label: "Usuários", description: "Gerenciar usuários do sistema", adminOnly: true },
	{ href: "/organizacoes", label: "Organizações", description: "Gerenciar oficinas e membros", adminOnly: true },
];

export default async function DashboardPage() {
	const session = await getSession();
	const isAdmin = session?.user.role === "admin";
	const canAccessCaixa =
		session && (await canAccessCashFlow(db, session.user.id, session.user.role));

	const visibleCards = cards.filter(
		(c) =>
			(!c.adminOnly || isAdmin) &&
			(!(c as { cashFlowOnly?: boolean }).cashFlowOnly || canAccessCaixa),
	);

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
						className="flex flex-col gap-1 rounded-xl border border-gray-200 bg-white p-5 transition hover:border-blue-300 hover:shadow-sm"
					>
						<span className="font-medium text-sm text-gray-900">{c.label}</span>
						<span className="text-xs text-gray-500">{c.description}</span>
					</Link>
				))}
			</div>
		</div>
	);
}
