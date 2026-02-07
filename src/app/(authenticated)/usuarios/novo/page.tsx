"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/app/_components/ui/button";
import { FormField, SelectField } from "@/app/_components/ui/form-field";
import { PageHeader } from "@/app/_components/ui/page-header";
import { type CreateUserFormData, createUserSchema } from "@/lib/schemas";
import { api } from "@/trpc/react";

export default function NovoUsuarioPage() {
	const router = useRouter();
	const utils = api.useUtils();

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<CreateUserFormData>({
		resolver: zodResolver(createUserSchema),
		defaultValues: { name: "", username: "", email: "", password: "", role: "user" },
	});

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

	const onSubmit = (data: CreateUserFormData) => {
		create.mutate(data);
	};

	return (
		<div className="flex flex-col gap-6">
			<PageHeader title="Novo Usuário" />

			<form className="max-w-lg space-y-4" onSubmit={handleSubmit(onSubmit)}>
				<FormField
					label="Nome *"
					id="name"
					placeholder="Nome completo"
					registration={register("name")}
					error={errors.name?.message}
				/>
				<FormField
					label="Usuário *"
					id="username"
					placeholder="nome.sobrenome"
					registration={register("username")}
					error={errors.username?.message}
				/>
				<FormField
					label="Email *"
					id="email"
					type="email"
					placeholder="email@exemplo.com"
					registration={register("email")}
					error={errors.email?.message}
				/>
				<FormField
					label="Senha *"
					id="password"
					type="password"
					placeholder="Mínimo 6 caracteres"
					registration={register("password")}
					error={errors.password?.message}
				/>
				<SelectField
					label="Perfil"
					id="role"
					options={roleOptions}
					registration={register("role")}
					error={errors.role?.message}
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
