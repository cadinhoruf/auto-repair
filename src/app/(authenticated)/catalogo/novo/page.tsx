"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/app/_components/ui/button";
import { FormField, TextareaField } from "@/app/_components/ui/form-field";
import { PageHeader } from "@/app/_components/ui/page-header";
import { api } from "@/trpc/react";

export default function NovoCatalogoItemPage() {
	const router = useRouter();
	const utils = api.useUtils();

	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [defaultPrice, setDefaultPrice] = useState("");

	const create = api.serviceItem.create.useMutation({
		onSuccess: async () => {
			await utils.serviceItem.listAll.invalidate();
			await utils.serviceItem.list.invalidate();
			router.push("/catalogo");
		},
	});

	return (
		<div className="flex flex-col gap-6">
			<PageHeader title="Novo Item / Serviço" />

			<form
				className="max-w-lg space-y-4"
				onSubmit={(e) => {
					e.preventDefault();
					create.mutate({
						name,
						description: description || undefined,
						defaultPrice: Number(defaultPrice) || 0,
					});
				}}
			>
				<FormField
					label="Nome *"
					id="name"
					placeholder="Ex: Troca de óleo"
					value={name}
					onChange={(e) => setName(e.target.value)}
					required
				/>
				<TextareaField
					label="Descrição (opcional)"
					id="description"
					placeholder="Detalhes adicionais sobre o item ou serviço"
					value={description}
					onChange={(e) => setDescription(e.target.value)}
				/>
				<FormField
					label="Preço padrão (R$)"
					id="defaultPrice"
					type="number"
					step="0.01"
					min="0"
					placeholder="0.00"
					value={defaultPrice}
					onChange={(e) => setDefaultPrice(e.target.value)}
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
