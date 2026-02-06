"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/app/_components/ui/button";
import { FormField, TextareaField } from "@/app/_components/ui/form-field";
import { PageHeader } from "@/app/_components/ui/page-header";
import { type ServiceItemFormData, serviceItemSchema } from "@/lib/schemas";
import { api } from "@/trpc/react";

export default function NovoCatalogoItemPage() {
	const router = useRouter();
	const utils = api.useUtils();

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<ServiceItemFormData>({
		resolver: zodResolver(serviceItemSchema),
		defaultValues: { name: "", description: "", defaultPrice: "" },
	});

	const create = api.serviceItem.create.useMutation({
		onSuccess: async () => {
			await utils.serviceItem.listAll.invalidate();
			await utils.serviceItem.list.invalidate();
			router.push("/catalogo");
		},
	});

	const onSubmit = (data: ServiceItemFormData) => {
		create.mutate({
			name: data.name,
			description: data.description || undefined,
			defaultPrice: Number(data.defaultPrice) || 0,
		});
	};

	return (
		<div className="flex flex-col gap-6">
			<PageHeader title="Novo Item / Serviço" />

			<form className="max-w-lg space-y-4" onSubmit={handleSubmit(onSubmit)}>
				<FormField
					label="Nome *"
					id="name"
					placeholder="Ex: Troca de óleo"
					registration={register("name")}
					error={errors.name?.message}
				/>
				<TextareaField
					label="Descrição (opcional)"
					id="description"
					placeholder="Detalhes adicionais sobre o item ou serviço"
					registration={register("description")}
					error={errors.description?.message}
				/>
				<FormField
					label="Preço padrão (R$)"
					id="defaultPrice"
					type="number"
					step="0.01"
					min="0"
					placeholder="0.00"
					registration={register("defaultPrice")}
					error={errors.defaultPrice?.message}
				/>

				{create.error ? <p className="text-sm text-red-600">{create.error.message}</p> : null}

				<div className="flex gap-3 pt-2">
					<Button type="submit" disabled={create.isPending}>
						{create.isPending ? "Salvando..." : "Salvar"}
					</Button>
					<Button type="button" variant="secondary" onClick={() => router.push("/catalogo")}>
						Cancelar
					</Button>
				</div>
			</form>
		</div>
	);
}
