"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/app/_components/ui/button";
import { FormField, SelectField } from "@/app/_components/ui/form-field";
import { PageHeader } from "@/app/_components/ui/page-header";
import { api } from "@/trpc/react";

export default function NovoUsuarioPage() {
	const router = useRouter();
	const utils = api.useUtils();

	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [role, setRole] = useState("user");

	const create = api.user.create.useMutation({
		onSuccess: async () => {
			await utils.user.list.invalidate();
			router.push("/usuarios");
		},
	});

	const roleOptions = [
		{ value: "user", label: "Usuário" },
		{ value: "admin", label: "Administrador" },
	];

	return (
		<div className="flex flex-col gap-6">
			<PageHeader title="Novo Usuário" />

			<form
				className="max-w-lg space-y-4"
				onSubmit={(e) => {
					e.preventDefault();
					create.mutate({
						name,
						email,
						password,
						role: role as "user" | "admin",
					});
				}}
			>
				<FormField
					label="Nome *"
					id="name"
					placeholder="Nome completo"
					value={name}
					onChange={(e) => setName(e.target.value)}
					required
				/>
				<FormField
					label="Email *"
					id="email"
					type="email"
					placeholder="email@exemplo.com"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					required
				/>
				<FormField
					label="Senha *"
					id="password"
					type="password"
					placeholder="Mínimo 6 caracteres"
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					required
					min={6}
				/>
				<SelectField
					label="Perfil"
					id="role"
					options={roleOptions}
					value={role}
					onChange={(e) => setRole(e.target.value)}
				/>

				{create.error ? (
					<p className="text-sm text-red-600">{create.error.message}</p>
				) : null}

				<div className="flex gap-3 pt-2">
					<Button type="submit" disabled={create.isPending}>
						{create.isPending ? "Criando..." : "Criar Usuário"}
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
		</div>
	);
}
