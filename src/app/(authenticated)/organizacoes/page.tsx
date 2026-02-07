"use client";

import Link from "next/link";

import { Button, LinkButton } from "@/app/_components/ui/button";
import { EmptyState } from "@/app/_components/ui/empty-state";
import { PageHeader } from "@/app/_components/ui/page-header";
import { formatDateBR } from "@/lib/date-br";
import { api } from "@/trpc/react";

export default function OrganizacoesPage() {
	const { data: orgs, isLoading, error } = api.organization.list.useQuery();
	const utils = api.useUtils();

	const deleteMutation = api.organization.delete.useMutation({
		onSuccess: () => utils.organization.list.invalidate(),
	});

	if (isLoading) return <p className="text-sm text-gray-500">Carregando...</p>;

	if (error) {
		return (
			<div className="flex flex-col gap-6">
				<PageHeader title="Organizações" />
				<p className="text-sm text-red-600">
					{error.message.includes("FORBIDDEN")
						? "Acesso restrito a administradores."
						: error.message}
				</p>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-6">
			<PageHeader
				title="Organizações"
				action={
					<LinkButton href="/organizacoes/nova">Nova Organização</LinkButton>
				}
			/>

			{!orgs || orgs.length === 0 ? (
				<EmptyState message="Nenhuma organização cadastrada." />
			) : (
				<div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
					<table className="w-full text-left text-sm">
						<thead className="border-b border-gray-200 bg-gray-50">
							<tr>
								<th className="px-4 py-3 font-medium text-gray-600">Nome</th>
								<th className="px-4 py-3 font-medium text-gray-600">Slug</th>
								<th className="px-4 py-3 font-medium text-gray-600">
									Membros
								</th>
								<th className="px-4 py-3 font-medium text-gray-600">
									Criada em
								</th>
								<th className="px-4 py-3 font-medium text-gray-600">Ações</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-gray-100">
							{orgs.map((org) => (
								<tr key={org.id}>
									<td className="px-4 py-3 font-medium text-gray-900">
										<Link
											href={`/organizacoes/${org.id}/editar`}
											className="text-blue-600 hover:underline"
										>
											{org.name}
										</Link>
									</td>
									<td className="px-4 py-3 text-gray-600">
										<code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs">
											{org.slug}
										</code>
									</td>
									<td className="px-4 py-3 text-gray-600">
										{org._count.members}
									</td>
									<td className="px-4 py-3 text-gray-500">
										{formatDateBR(org.createdAt)}
									</td>
									<td className="px-4 py-3">
										<div className="flex gap-2">
											<LinkButton
												href={`/organizacoes/${org.id}/editar`}
												variant="secondary"
											>
												Editar
											</LinkButton>
											<Button
												variant="danger"
												onClick={() => {
													if (
														confirm(
															`Deseja EXCLUIR permanentemente a organização "${org.name}"? Todos os dados associados serão removidos.`,
														)
													) {
														deleteMutation.mutate({ id: org.id });
													}
												}}
												disabled={deleteMutation.isPending}
											>
												Excluir
											</Button>
										</div>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}

			{deleteMutation.error ? (
				<p className="text-sm text-red-600">{deleteMutation.error.message}</p>
			) : null}
		</div>
	);
}
