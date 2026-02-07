"use client";

import Link from "next/link";

import { EmptyState } from "@/app/_components/ui/empty-state";
import { PageHeader } from "@/app/_components/ui/page-header";
import { api } from "@/trpc/react";

export default function ClientesPage() {
	const { data: clients, isLoading } = api.clients.list.useQuery();

	return (
		<div className="flex flex-col gap-6">
			<PageHeader title="Clientes" actionLabel="Novo Cliente" actionHref="/clientes/novo" />

			{isLoading ? (
				<p className="text-sm text-gray-500">Carregando...</p>
			) : !clients?.length ? (
				<EmptyState message="Nenhum cliente cadastrado." />
			) : (
				<div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
					<table className="w-full text-left text-sm">
						<thead className="border-b border-gray-200 bg-gray-50">
							<tr>
								<th className="px-4 py-3 font-medium text-gray-600">Nome</th>
								<th className="px-4 py-3 font-medium text-gray-600">Telefone</th>
								<th className="px-4 py-3 font-medium text-gray-600">Email</th>
								<th className="px-4 py-3 font-medium text-gray-600" />
							</tr>
						</thead>
						<tbody className="divide-y divide-gray-100">
							{clients.map((c) => (
								<tr key={c.id} className="transition hover:bg-gray-50">
									<td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
									<td className="px-4 py-3 text-gray-600">{c.phone}</td>
									<td className="px-4 py-3 text-gray-600">{c.email ?? "—"}</td>
									<td className="px-4 py-3 text-right">
										<Link
											href={`/clientes/${c.id}`}
											className="text-sm font-medium text-blue-600 hover:text-blue-800"
										>
											Ver
										</Link>
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
