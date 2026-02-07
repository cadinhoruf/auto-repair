"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/app/_components/ui/button";
import { FormField } from "@/app/_components/ui/form-field";
import { PageHeader } from "@/app/_components/ui/page-header";
import { type OrganizationFormData, organizationSchema } from "@/lib/schemas";
import { api } from "@/trpc/react";

function slugify(text: string): string {
	return text
		.toLowerCase()
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

export default function NovaOrganizacaoPage() {
	const router = useRouter();
	const utils = api.useUtils();

	const {
		register,
		handleSubmit,
		setValue,
		formState: { errors },
	} = useForm<OrganizationFormData>({
		resolver: zodResolver(organizationSchema),
		defaultValues: { name: "", slug: "" },
	});

	const create = api.organization.create.useMutation({
		onSuccess: async () => {
			await utils.organization.list.invalidate();
			router.push("/organizacoes");
		},
	});

	const onSubmit = (data: OrganizationFormData) => {
		create.mutate(data);
	};

	return (
		<div className="flex flex-col gap-6">
			<PageHeader title="Nova Organização" />

			<form className="max-w-lg space-y-4" onSubmit={handleSubmit(onSubmit)}>
				<FormField
					label="Nome *"
					id="name"
					placeholder="Nome da oficina"
					registration={register("name", {
						onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
							setValue("slug", slugify(e.target.value), {
								shouldValidate: true,
							});
						},
					})}
					error={errors.name?.message}
				/>
				<FormField
					label="Slug *"
					id="slug"
					placeholder="nome-da-oficina"
					registration={register("slug")}
					error={errors.slug?.message}
				/>
				<p className="text-xs text-gray-500">
					Identificador único da organização. Gerado automaticamente a partir do
					nome.
				</p>

				{create.error ? (
					<p className="text-sm text-red-600">{create.error.message}</p>
				) : null}

				<div className="flex gap-3 pt-2">
					<Button type="submit" disabled={create.isPending}>
						{create.isPending ? "Criando..." : "Criar Organização"}
					</Button>
					<Button
						type="button"
						variant="secondary"
						onClick={() => router.push("/organizacoes")}
					>
						Cancelar
					</Button>
				</div>
			</form>
		</div>
	);
}
