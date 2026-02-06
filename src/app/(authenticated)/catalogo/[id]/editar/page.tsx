"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/app/_components/ui/button";
import { FormField, TextareaField } from "@/app/_components/ui/form-field";
import { PageHeader } from "@/app/_components/ui/page-header";
import { type ServiceItemFormData, serviceItemSchema } from "@/lib/schemas";
import { api } from "@/trpc/react";

export default function EditarCatalogoItemPage() {
	const router = useRouter();
	const { id } = useParams<{ id: string }>();
	const utils = api.useUtils();

	const { data: item, isLoading } = api.serviceItem.getById.useQuery({ id });

	const {
		register,
		handleSubmit,
		reset,
		formState: { errors },
	} = useForm<ServiceItemFormData>({
		resolver: zodResolver(serviceItemSchema),
		defaultValues: { name: "", description: "", defaultPrice: "" },
	});

	useEffect(() => {
		if (item) {
			reset({
				name: item.name,
				description: item.description ?? "",
				defaultPrice: String(Number(item.defaultPrice)),
			});
		}
	}, [item, reset]);

	const update = api.serviceItem.update.useMutation({
		onSuccess: async () => {
			await utils.serviceItem.listAll.invalidate();
			await utils.serviceItem.list.invalidate();
			router.push("/catalogo");
		},
	});

	const onSubmit = (data: ServiceItemFormData) => {
		update.mutate({
			id,
			name: data.name,
			description: data.description || undefined,
			defaultPrice: Number(data.defaultPrice) || 0,
		});
	};

	if (isLoading) return <p className="text-sm text-gray-500">Carregando...</p>;
	if (!item) return <p className="text-sm text-red-600">Item não encontrado.</p>;

	return (
		<div className="flex flex-col gap-6">
			<PageHeader title="Editar Item / Serviço" />

			<form className="max-w-lg space-y-4" onSubmit={handleSubmit(onSubmit)}>
				<FormField
					label="Nome *"
					id="name"
					registration={register("name")}
					error={errors.name?.message}
				/>
				<TextareaField
					label="Descrição (opcional)"
					id="description"
					registration={register("description")}
					error={errors.description?.message}
				/>
				<FormField
					label="Preço padrão (R$)"
					id="defaultPrice"
					type="number"
					step="0.01"
					min="0"
					registration={register("defaultPrice")}
					error={errors.defaultPrice?.message}
				/>

				{update.error ? <p className="text-sm text-red-600">{update.error.message}</p> : null}

				<div className="flex gap-3 pt-2">
					<Button type="submit" disabled={update.isPending}>
						{update.isPending ? "Salvando..." : "Salvar Alterações"}
					</Button>
					<Button type="button" variant="secondary" onClick={() => router.push("/catalogo")}>
						Cancelar
					</Button>
				</div>
			</form>
		</div>
	);
}
