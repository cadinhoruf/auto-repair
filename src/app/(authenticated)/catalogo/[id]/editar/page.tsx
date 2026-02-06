"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/app/_components/ui/button";
import { FormField, TextareaField } from "@/app/_components/ui/form-field";
import { PageHeader } from "@/app/_components/ui/page-header";
import { api } from "@/trpc/react";

export default function EditarCatalogoItemPage() {
	const router = useRouter();
	const { id } = useParams<{ id: string }>();
	const utils = api.useUtils();

	const { data: item, isLoading } = api.serviceItem.getById.useQuery({ id });

	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [defaultPrice, setDefaultPrice] = useState("");

	useEffect(() => {
		if (item) {
			setName(item.name);
			setDescription(item.description ?? "");
			setDefaultPrice(String(Number(item.defaultPrice)));
		}
	}, [item]);

	const update = api.serviceItem.update.useMutation({
		onSuccess: async () => {
			await utils.serviceItem.listAll.invalidate();
			await utils.serviceItem.list.invalidate();
			router.push("/catalogo");
		},
	});

	if (isLoading) return <p className="text-sm text-gray-500">Carregando...</p>;
	if (!item) return <p className="text-sm text-red-600">Item não encontrado.</p>;

	return (
		<div className="flex flex-col gap-6">
			<PageHeader title="Editar Item / Serviço" />

			<form
				className="max-w-lg space-y-4"
				onSubmit={(e) => {
					e.preventDefault();
					update.mutate({
						id,
						name,
						description: description || undefined,
						defaultPrice: Number(defaultPrice) || 0,
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
				<TextareaField
					label="Descrição (opcional)"
					id="description"
					value={description}
					onChange={(e) => setDescription(e.target.value)}
				/>
				<FormField
					label="Preço padrão (R$)"
					id="defaultPrice"
					type="number"
					step="0.01"
					min="0"
					value={defaultPrice}
					onChange={(e) => setDefaultPrice(e.target.value)}
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
