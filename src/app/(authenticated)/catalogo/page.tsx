"use client";

import Link from "next/link";

import { Button, LinkButton } from "@/app/_components/ui/button";
import { EmptyState } from "@/app/_components/ui/empty-state";
import { PageHeader } from "@/app/_components/ui/page-header";
import { api } from "@/trpc/react";

export default function CatalogoPage() {
	const { data: items, isLoading } = api.serviceItem.listAll.useQuery();
	const utils = api.useUtils();

	const deleteMutation = api.serviceItem.delete.useMutation({
		onSuccess: async () => {
			await utils.serviceItem.listAll.invalidate();
			await utils.serviceItem.list.invalidate();
		},
	});

	const toggleActive = api.serviceItem.update.useMutation({
		onSuccess: async () => {
			await utils.serviceItem.listAll.invalidate();
			await utils.serviceItem.list.invalidate();
		},
	});

	if (isLoading) return <p className="text-sm text-gray-500">Carregando...</p>;

	return (
		<div className="flex flex-col gap-6">
			<PageHeader
				title="Catálogo de Itens / Serviços"
				action={<LinkButton href="/catalogo/novo">Novo Item</LinkButton>}
			/>

			{!items || items.length === 0 ? (
				<EmptyState message="Nenhum item cadastrado no catálogo." />
			) : (
				<div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
					<table className="w-full text-left text-sm">
						<thead className="border-b border-gray-200 bg-gray-50">
							<tr>
								<th className="px-4 py-3 font-medium text-gray-600">Nome</th>
								<th className="px-4 py-3 font-medium text-gray-600">Descrição</th>
								<th className="px-4 py-3 font-medium text-gray-600">Preço Padrão</th>
								<th className="px-4 py-3 font-medium text-gray-600">Status</th>
								<th className="px-4 py-3 font-medium text-gray-600">Ações</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-gray-100">
							{items.map((item) => (
								<tr key={item.id} className={!item.active ? "opacity-50" : ""}>
									<td className="px-4 py-3 font-medium text-gray-900">
										<Link href={`/catalogo/${item.id}/editar`} className="text-indigo-600 hover:underline">
											{item.name}
										</Link>
									</td>
									<td className="px-4 py-3 text-gray-600">{item.description ?? "—"}</td>
									<td className="px-4 py-3 text-gray-700">
										R$ {Number(item.defaultPrice).toFixed(2)}
									</td>
									<td className="px-4 py-3">
										<span
											className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
												item.active
													? "bg-green-100 text-green-700"
													: "bg-gray-100 text-gray-500"
											}`}
										>
											{item.active ? "Ativo" : "Inativo"}
										</span>
									</td>
									<td className="flex gap-2 px-4 py-3">
										<Button
											variant="secondary"
											onClick={() =>
												toggleActive.mutate({ id: item.id, active: !item.active })
											}
										>
											{item.active ? "Desativar" : "Ativar"}
										</Button>
										<Button
											variant="secondary"
											onClick={() => {
												if (confirm("Deseja realmente excluir este item?")) {
													deleteMutation.mutate({ id: item.id });
												}
											}}
										>
											Excluir
										</Button>
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
