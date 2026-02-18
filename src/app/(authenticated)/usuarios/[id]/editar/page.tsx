"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/app/_components/ui/button";
import { FormField, SelectField } from "@/app/_components/ui/form-field";
import { PageHeader } from "@/app/_components/ui/page-header";
import { formatDateBR } from "@/lib/date-br";
import {
	type EditUserFormData,
	editUserSchema,
	type ChangePasswordFormData,
	changePasswordSchema,
} from "@/lib/schemas";
import { api } from "@/trpc/react";

export default function EditarUsuarioPage() {
	const router = useRouter();
	const { id } = useParams<{ id: string }>();
	const utils = api.useUtils();

	const { data: users } = api.user.list.useQuery();
	const user = users?.find((u) => u.id === id);

	// ── Formulário de dados ───────────────────────────────
	const {
		register: registerUser,
		handleSubmit: handleUserSubmit,
		reset: resetUser,
		watch,
		setValue,
		formState: { errors: userErrors },
	} = useForm<EditUserFormData>({
		resolver: zodResolver(editUserSchema),
		defaultValues: { name: "", email: "", role: "user", roles: [] },
	});

	const roles = watch("roles") ?? [];
	const toggleRole = (role: "gerente" | "financeiro") => {
		const next = roles.includes(role)
			? roles.filter((r) => r !== role)
			: [...roles, role];
		setValue("roles", next);
	};

	useEffect(() => {
		if (user) {
			const roles = (user as { roles?: string[] }).roles ?? [];
			resetUser({
				name: user.name,
				email: user.email,
				role: (user.role as "user" | "admin") ?? "user",
				roles: roles.filter(
					(r): r is "gerente" | "financeiro" =>
						r === "gerente" || r === "financeiro",
				),
			});
		}
	}, [user, resetUser]);

	const update = api.user.update.useMutation({
		onSuccess: async () => {
			await utils.user.list.invalidate();
			router.push("/usuarios");
		},
	});

	const onUserSubmit = (data: EditUserFormData) => {
		update.mutate({
			userId: id!,
			name: data.name,
			email: data.email,
			role: data.role,
			roles: data.roles,
		});
	};

	// ── Formulário de senha ───────────────────────────────
	const {
		register: registerPwd,
		handleSubmit: handlePwdSubmit,
		reset: resetPwd,
		formState: { errors: pwdErrors },
	} = useForm<ChangePasswordFormData>({
		resolver: zodResolver(changePasswordSchema),
		defaultValues: { newPassword: "" },
	});

	const setPasswordMutation = api.user.setPassword.useMutation({
		onSuccess: () => {
			resetPwd();
			alert("Senha alterada com sucesso!");
		},
	});

	const onPwdSubmit = (data: ChangePasswordFormData) => {
		setPasswordMutation.mutate({ userId: id, newPassword: data.newPassword });
	};

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
				onSubmit={handleUserSubmit(onUserSubmit)}
			>
				<FormField
					label="Nome *"
					id="name"
					registration={registerUser("name")}
					error={userErrors.name?.message}
				/>
				<FormField
					label="Email *"
					id="email"
					type="email"
					registration={registerUser("email")}
					error={userErrors.email?.message}
				/>
				<SelectField
					label="Perfil"
					id="role"
					options={roleOptions}
					registration={registerUser("role")}
					error={userErrors.role?.message}
				/>

				<div className="space-y-2">
					<div className="text-sm font-medium text-gray-700">Permissões</div>
					<div className="flex flex-wrap gap-4">
						<label className="flex cursor-pointer items-center gap-2">
							<input
								type="checkbox"
								checked={roles.includes("gerente")}
								onChange={() => toggleRole("gerente")}
								className="rounded border-gray-300"
							/>
							<span className="text-sm text-gray-700">Gerente</span>
						</label>
						<label className="flex cursor-pointer items-center gap-2">
							<input
								type="checkbox"
								checked={roles.includes("financeiro")}
								onChange={() => toggleRole("financeiro")}
								className="rounded border-gray-300"
							/>
							<span className="text-sm text-gray-700">Financeiro</span>
						</label>
					</div>
					<p className="text-xs text-gray-500">
						Gerente e Financeiro podem acessar o Fluxo de Caixa.
					</p>
				</div>

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
				<form className="space-y-3" onSubmit={handlePwdSubmit(onPwdSubmit)}>
					<FormField
						label="Nova senha"
						id="newPassword"
						type="password"
						placeholder="Mínimo 6 caracteres"
						registration={registerPwd("newPassword")}
						error={pwdErrors.newPassword?.message}
					/>

					{setPasswordMutation.error ? (
						<p className="text-sm text-red-600">
							{setPasswordMutation.error.message}
						</p>
					) : null}

					<Button
						type="submit"
						disabled={setPasswordMutation.isPending}
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
						{formatDateBR(user.createdAt)}
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
