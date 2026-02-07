"use client";

import Link from "next/link";

import { EmptyState } from "@/app/_components/ui/empty-state";
import { PageHeader } from "@/app/_components/ui/page-header";
import { formatDateBR } from "@/lib/date-br";
import { api } from "@/trpc/react";

export default function OrcamentosPage() {
	const { data: budgets, isLoading } = api.budget.list.useQuery();

	return (
		<div className="flex flex-col gap-6">
			<PageHeader title="Orçamentos" actionLabel="Novo Orçamento" actionHref="/orcamentos/novo" />

			{isLoading ? (
				<p className="text-sm text-gray-500">Carregando...</p>
			) : !budgets?.length ? (
				<EmptyState message="Nenhum orçamento cadastrado." />
			) : (
				<div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
					<table className="w-full text-left text-sm">
						<thead className="border-b border-gray-200 bg-gray-50">
							<tr>
								<th className="px-4 py-3 font-medium text-gray-600">Número</th>
								<th className="px-4 py-3 font-medium text-gray-600">Cliente</th>
								<th className="px-4 py-3 font-medium text-gray-600">Valor Total</th>
								<th className="px-4 py-3 font-medium text-gray-600">Data</th>
								<th className="px-4 py-3" />
							</tr>
						</thead>
						<tbody className="divide-y divide-gray-100">
							{budgets.map((b) => (
								<tr key={b.id} className="hover:bg-gray-50">
									<td className="px-4 py-3 font-medium text-gray-900">{b.number}</td>
									<td className="px-4 py-3 text-gray-600">{b.client.name}</td>
									<td className="px-4 py-3 text-gray-600">R$ {Number(b.totalAmount).toFixed(2)}</td>
									<td className="px-4 py-3 text-gray-600">{formatDateBR(b.issuedAt)}</td>
									<td className="px-4 py-3 text-right">
										<Link href={`/orcamentos/${b.id}`} className="text-sm font-medium text-blue-600 hover:text-blue-800">Ver</Link>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
		</div>
	);
}
