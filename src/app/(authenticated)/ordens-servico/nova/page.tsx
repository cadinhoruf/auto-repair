"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { Button } from "@/app/_components/ui/button";
import { FormField, TextareaField, SelectField } from "@/app/_components/ui/form-field";
import { PageHeader } from "@/app/_components/ui/page-header";
import { api } from "@/trpc/react";

export default function NovaOSPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const utils = api.useUtils();

	const preselectedClientId = searchParams.get("clientId") ?? "";

	const { data: clients } = api.clients.list.useQuery();

	const [clientId, setClientId] = useState(preselectedClientId);
	const [problemDescription, setProblemDescription] = useState("");
	const [estimatedValue, setEstimatedValue] = useState("");

	const create = api.serviceOrder.create.useMutation({
		onSuccess: async () => {
			await utils.serviceOrder.list.invalidate();
			router.push("/ordens-servico");
		},
	});

	const clientOptions = [
		{ value: "", label: "Selecione um cliente" },
		...(clients?.map((c) => ({ value: c.id, label: c.name })) ?? []),
	];

	return (
		<div className="flex flex-col gap-6">
			<PageHeader title="Nova Ordem de Serviço" />

			<form
				className="max-w-lg space-y-4"
				onSubmit={(e) => {
					e.preventDefault();
					create.mutate({
						clientId,
						problemDescription,
						estimatedValue: estimatedValue ? Number(estimatedValue) : undefined,
					});
				}}
			>
				<SelectField label="Cliente *" id="clientId" options={clientOptions} value={clientId} onChange={(e) => setClientId(e.target.value)} required />
				<TextareaField label="Descrição do problema *" id="problemDescription" value={problemDescription} onChange={(e) => setProblemDescription(e.target.value)} required />
				<FormField label="Valor estimado (R$)" id="estimatedValue" type="number" step="0.01" min="0" value={estimatedValue} onChange={(e) => setEstimatedValue(e.target.value)} />

				{create.error ? <p className="text-sm text-red-600">{create.error.message}</p> : null}

				<div className="flex gap-3 pt-2">
					<Button type="submit" disabled={create.isPending}>
						{create.isPending ? "Criando..." : "Criar OS"}
					</Button>
					<Button type="button" variant="secondary" onClick={() => router.push("/ordens-servico")}>
						Cancelar
					</Button>
				</div>
			</form>
		</div>
	);
}
