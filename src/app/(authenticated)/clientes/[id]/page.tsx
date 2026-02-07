"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

import { EmptyState } from "@/app/_components/ui/empty-state";
import { LinkButton } from "@/app/_components/ui/button";
import { PageHeader } from "@/app/_components/ui/page-header";
import { StatusBadge } from "@/app/_components/ui/status-badge";
import { api } from "@/trpc/react";

export default function ClienteDetalhePage() {
	const { id } = useParams<{ id: string }>();
	const { data: client, isLoading } = api.clients.getById.useQuery({ clientId: id });
	const { data: orders } = api.serviceOrder.list.useQuery();
	const { data: budgets } = api.budget.list.useQuery();

	if (isLoading) return <p className="text-sm text-gray-500">Carregando...</p>;
	if (!client) return <p className="text-sm text-red-600">Cliente não encontrado.</p>;

	const clientOrders = orders?.filter((o) => o.client.id === id) ?? [];
	const clientBudgets = budgets?.filter((b) => b.client.id === id) ?? [];

	return (
		<div className="flex flex-col gap-8">
			<PageHeader title={client.name} actionLabel="Editar" actionHref={`/clientes/${id}/editar`} />

			{/* Dados */}
			<section className="rounded-xl border border-gray-200 bg-white p-5">
				<h2 className="mb-3 font-medium text-sm text-gray-500">Dados do Cliente</h2>
				<dl className="grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
					<div><dt className="text-gray-500">Telefone</dt><dd className="font-medium text-gray-900">{client.phone}</dd></div>
					<div><dt className="text-gray-500">Email</dt><dd className="font-medium text-gray-900">{client.email ?? "—"}</dd></div>
					<div><dt className="text-gray-500">Documento</dt><dd className="font-medium text-gray-900">{client.document ?? "—"}</dd></div>
					<div><dt className="text-gray-500">Cadastrado em</dt><dd className="font-medium text-gray-900">{new Date(client.createdAt).toLocaleDateString("pt-BR")}</dd></div>
				</dl>
				{client.notes ? <p className="mt-3 text-sm text-gray-600">{client.notes}</p> : null}
			</section>

			{/* OS do cliente */}
			<section>
				<div className="mb-3 flex items-center justify-between">
					<h2 className="font-medium text-sm text-gray-500">Ordens de Serviço</h2>
					<LinkButton href={`/ordens-servico/nova?clientId=${id}`} variant="secondary">Nova OS</LinkButton>
				</div>
				{!clientOrders.length ? (
					<EmptyState message="Nenhuma OS para este cliente." />
				) : (
					<div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
						<table className="w-full text-left text-sm">
							<thead className="border-b border-gray-200 bg-gray-50">
								<tr>
									<th className="px-4 py-3 font-medium text-gray-600">Status</th>
									<th className="px-4 py-3 font-medium text-gray-600">Data</th>
									<th className="px-4 py-3 font-medium text-gray-600">Valor Final</th>
									<th className="px-4 py-3" />
								</tr>
							</thead>
							<tbody className="divide-y divide-gray-100">
								{clientOrders.map((o) => (
									<tr key={o.id} className="hover:bg-gray-50">
										<td className="px-4 py-3"><StatusBadge status={o.status} /></td>
										<td className="px-4 py-3 text-gray-600">{new Date(o.openedAt).toLocaleDateString("pt-BR")}</td>
										<td className="px-4 py-3 text-gray-600">{o.finalValue ? `R$ ${Number(o.finalValue).toFixed(2)}` : "—"}</td>
										<td className="px-4 py-3 text-right">
											<Link href={`/ordens-servico/${o.id}`} className="text-sm font-medium text-blue-600 hover:text-blue-800">Ver</Link>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</section>

			{/* Orçamentos do cliente */}
			<section>
				<div className="mb-3 flex items-center justify-between">
					<h2 className="font-medium text-sm text-gray-500">Orçamentos</h2>
					<LinkButton href={`/orcamentos/novo?clientId=${id}`} variant="secondary">Novo Orçamento</LinkButton>
				</div>
				{!clientBudgets.length ? (
					<EmptyState message="Nenhum orçamento para este cliente." />
				) : (
					<div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
						<table className="w-full text-left text-sm">
							<thead className="border-b border-gray-200 bg-gray-50">
								<tr>
									<th className="px-4 py-3 font-medium text-gray-600">Número</th>
									<th className="px-4 py-3 font-medium text-gray-600">Valor</th>
									<th className="px-4 py-3 font-medium text-gray-600">Data</th>
									<th className="px-4 py-3" />
								</tr>
							</thead>
							<tbody className="divide-y divide-gray-100">
								{clientBudgets.map((b) => (
									<tr key={b.id} className="hover:bg-gray-50">
										<td className="px-4 py-3 font-medium text-gray-900">{b.number}</td>
										<td className="px-4 py-3 text-gray-600">R$ {Number(b.totalAmount).toFixed(2)}</td>
										<td className="px-4 py-3 text-gray-600">{new Date(b.issuedAt).toLocaleDateString("pt-BR")}</td>
										<td className="px-4 py-3 text-right">
											<Link href={`/orcamentos/${b.id}`} className="text-sm font-medium text-blue-600 hover:text-blue-800">Ver</Link>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</section>
		</div>
	);
}
