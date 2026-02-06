"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/app/_components/ui/button";
import { FormField, SelectField } from "@/app/_components/ui/form-field";
import { PageHeader } from "@/app/_components/ui/page-header";
import { api } from "@/trpc/react";

export default function EditarUsuarioPage() {
	const router = useRouter();
	const { id } = useParams<{ id: string }>();
	const utils = api.useUtils();

	const { data: users } = api.user.list.useQuery();
	const user = users?.find((u) => u.id === id);

	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [role, setRole] = useState("user");
	const [newPassword, setNewPassword] = useState("");
	const [initialized, setInitialized] = useState(false);

	// Preenche os campos quando os dados carregam
	if (user && !initialized) {
		setName(user.name);
		setEmail(user.email);
		setRole(user.role ?? "user");
		setInitialized(true);
	}

	const update = api.user.update.useMutation({
		onSuccess: async () => {
			await utils.user.list.invalidate();
			router.push("/usuarios");
		},
	});

	const setPasswordMutation = api.user.setPassword.useMutation({
		onSuccess: () => {
			setNewPassword("");
			alert("Senha alterada com sucesso!");
		},
	});

	const roleOptions = [
		{ value: "user", label: "Usuário" },
		{ value: "admin", label: "Administrador" },
	];

	if (!users) return <p className="text-sm text-gray-500">Carregando...</p>;
	if (!user) return <p className="text-sm text-red-600">Usuário não encontrado.</p>;

	return (
		<div className="flex flex-col gap-6">
			<PageHeader title="Editar Usuário" />

			{/* Formulário de dados */}
			<form
				className="max-w-lg space-y-4"
				onSubmit={(e) => {
					e.preventDefault();
					update.mutate({
						userId: id,
						name,
						email,
						role: role as "user" | "admin",
					});
				}}
			>
				<FormField
					label="Nome *"
					id="name"
					value={name}
					onChange={(e) => setName(e.target.value)}
					required
				/>
				<FormField
					label="Email *"
					id="email"
					type="email"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					required
				/>
				<SelectField
					label="Perfil"
					id="role"
					options={roleOptions}
					value={role}
					onChange={(e) => setRole(e.target.value)}
				/>

				{update.error ? (
					<p className="text-sm text-red-600">{update.error.message}</p>
				) : null}

				<div className="flex gap-3 pt-2">
					<Button type="submit" disabled={update.isPending}>
						{update.isPending ? "Salvando..." : "Salvar Alterações"}
					</Button>
					<Button
						type="button"
						variant="secondary"
						onClick={() => router.push("/usuarios")}
					>
						Cancelar
					</Button>
				</div>
			</form>

			{/* Alterar senha */}
			<section className="max-w-lg rounded-xl border border-gray-200 bg-white p-5">
				<h2 className="mb-3 font-medium text-sm text-gray-700">Alterar Senha</h2>
				<form
					className="space-y-3"
					onSubmit={(e) => {
						e.preventDefault();
						if (newPassword.length < 6) return;
						setPasswordMutation.mutate({ userId: id, newPassword });
					}}
				>
					<FormField
						label="Nova senha"
						id="newPassword"
						type="password"
						placeholder="Mínimo 6 caracteres"
						value={newPassword}
						onChange={(e) => setNewPassword(e.target.value)}
						required
						min={6}
					/>

					{setPasswordMutation.error ? (
						<p className="text-sm text-red-600">
							{setPasswordMutation.error.message}
						</p>
					) : null}

					<Button
						type="submit"
						disabled={setPasswordMutation.isPending || newPassword.length < 6}
					>
						{setPasswordMutation.isPending ? "Alterando..." : "Alterar Senha"}
					</Button>
				</form>
			</section>

			{/* Info */}
			<section className="max-w-lg rounded-xl border border-gray-200 bg-white p-5">
				<h2 className="mb-3 font-medium text-sm text-gray-700">Informações</h2>
				<div className="space-y-2 text-sm text-gray-600">
					<p>
						<span className="font-medium text-gray-700">ID:</span> {user.id}
					</p>
					<p>
						<span className="font-medium text-gray-700">Criado em:</span>{" "}
						{new Date(user.createdAt).toLocaleDateString("pt-BR")}
					</p>
					<p>
						<span className="font-medium text-gray-700">Status:</span>{" "}
						{user.banned ? (
							<span className="text-red-600">
								Bloqueado{user.banReason ? ` — ${user.banReason}` : ""}
							</span>
						) : (
							<span className="text-green-600">Ativo</span>
						)}
					</p>
				</div>
			</section>
		</div>
	);
}
