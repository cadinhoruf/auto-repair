"use client";

import Link from "next/link";

import { Button, LinkButton } from "@/app/_components/ui/button";
import { EmptyState } from "@/app/_components/ui/empty-state";
import { PageHeader } from "@/app/_components/ui/page-header";
import { formatDateBR } from "@/lib/date-br";
import { api } from "@/trpc/react";
import { authClient } from "@/lib/auth-client";

export default function UsuariosPage() {
	const { data: users, isLoading, error } = api.user.list.useQuery();
	const { data: session } = authClient.useSession();
	const utils = api.useUtils();

	const banMutation = api.user.ban.useMutation({
		onSuccess: () => utils.user.list.invalidate(),
	});

	const unbanMutation = api.user.unban.useMutation({
		onSuccess: () => utils.user.list.invalidate(),
	});

	const removeMutation = api.user.remove.useMutation({
		onSuccess: () => utils.user.list.invalidate(),
	});

	if (isLoading) return <p className="text-sm text-gray-500">Carregando...</p>;

	if (error) {
		return (
			<div className="flex flex-col gap-6">
				<PageHeader title="Usuários" />
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
				title="Usuários"
				action={<LinkButton href="/usuarios/novo">Novo Usuário</LinkButton>}
			/>
			{!users || users.length === 0 ? (
				<EmptyState message="Nenhum usuário encontrado." />
			) : (
				<div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
					<table className="w-full text-left text-sm">
						<thead className="border-b border-gray-200 bg-gray-50">
							<tr>
								<th className="px-4 py-3 font-medium text-gray-600">Nome</th>
								<th className="px-4 py-3 font-medium text-gray-600">Email</th>
								<th className="px-4 py-3 font-medium text-gray-600">Organização</th>
								<th className="px-4 py-3 font-medium text-gray-600">Perfil</th>
								<th className="px-4 py-3 font-medium text-gray-600">Status</th>
								<th className="px-4 py-3 font-medium text-gray-600">Criado em</th>
								<th className="px-4 py-3 font-medium text-gray-600">Ações</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-gray-100">
							{users.map((user) => (
								<tr key={user.id} className={user.banned ? "opacity-50" : ""}>
									<td className="px-4 py-3 font-medium text-gray-900">
										<Link
											href={`/usuarios/${user.id}/editar`}
											className="text-blue-600 hover:underline"
										>
											{user.name}
										</Link>
									</td>
									<td className="px-4 py-3 text-gray-600">{user.email}</td>
									<td className="px-4 py-3 text-gray-600">
										{user.organizations && user.organizations.length > 0 ? (
											<div className="flex flex-wrap gap-1">
												{user.organizations.map((org) => (
													<span
														key={org.organization.id}
														className="inline-block rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700"
													>
														{org.organization.name}
													</span>
												))}
											</div>
										) : (
											<span className="text-xs text-gray-400">Nenhuma</span>
										)}
									</td>
									<td className="px-4 py-3">
										<div className="flex flex-wrap items-center gap-1">
											<span
												className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
													user.role === "admin"
														? "bg-blue-100 text-blue-700"
														: "bg-gray-100 text-gray-600"
												}`}
											>
												{user.role === "admin" ? "Administrador" : "Usuário"}
											</span>
											{(user as { roles?: string[] }).roles?.includes(
												"gerente",
											) && (
												<span className="inline-block rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
													Gerente
												</span>
											)}
											{(user as { roles?: string[] }).roles?.includes(
												"financeiro",
											) && (
												<span className="inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
													Financeiro
												</span>
											)}
										</div>
									</td>
									<td className="px-4 py-3">
										{user.banned ? (
											<span className="inline-block rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
												Bloqueado
											</span>
										) : (
											<span className="inline-block rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
												Ativo
											</span>
										)}
									</td>
									<td className="px-4 py-3 text-gray-500">
										{formatDateBR(user.createdAt)}
									</td>
									<td className="px-4 py-3">
										<div className="flex gap-2">
											{user.banned ? (
												<Button
													variant="secondary"
													onClick={() => unbanMutation.mutate({ userId: user.id })}
													disabled={unbanMutation.isPending}
												>
													Desbloquear
												</Button>
											) : (
												<Button
													variant="secondary"
													onClick={() => {
														if (confirm("Deseja bloquear este usuário?")) {
															banMutation.mutate({ userId: user.id });
														}
													}}
													disabled={banMutation.isPending}
												>
													Bloquear
												</Button>
											)}
											<Button
												variant="secondary"
												onClick={() => {
													if (
														confirm(
															"Deseja EXCLUIR permanentemente este usuário? Esta ação não pode ser desfeita.",
														)
													) {
														removeMutation.mutate({ userId: user.id });
													}
												}}
												disabled={removeMutation.isPending}
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
		</div>
	);
}
