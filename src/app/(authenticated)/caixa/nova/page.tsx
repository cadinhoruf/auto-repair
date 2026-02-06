"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { Button } from "@/app/_components/ui/button";
import { FormField, SelectField } from "@/app/_components/ui/form-field";
import { PageHeader } from "@/app/_components/ui/page-header";
import { api } from "@/trpc/react";

export default function NovaMovimentacaoPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const utils = api.useUtils();

	const preselectedOSId = searchParams.get("serviceOrderId") ?? "";

	const [type, setType] = useState<"IN" | "OUT">("IN");
	const [description, setDescription] = useState("");
	const [value, setValue] = useState("");
	const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
	const [serviceOrderId, setServiceOrderId] = useState(preselectedOSId);

	const { data: orders } = api.serviceOrder.list.useQuery({ status: "FINISHED" });

	const create = api.cashFlow.create.useMutation({
		onSuccess: async () => {
			await utils.cashFlow.list.invalidate();
			router.push("/caixa");
		},
	});

	const osOptions = [
		{ value: "", label: "Nenhuma (avulso)" },
		...(orders?.map((o) => ({ value: o.id, label: `${o.client.name} — ${new Date(o.openedAt).toLocaleDateString("pt-BR")}` })) ?? []),
	];

	return (
		<div className="flex flex-col gap-6">
			<PageHeader title="Nova Movimentação" />

			<form
				className="max-w-lg space-y-4"
				onSubmit={(e) => {
					e.preventDefault();
					create.mutate({
						type,
						description,
						value: Number(value),
						date: new Date(date),
						serviceOrderId: serviceOrderId || undefined,
					});
				}}
			>
				<SelectField
					label="Tipo *"
					id="type"
					options={[
						{ value: "IN", label: "Entrada" },
						{ value: "OUT", label: "Saída" },
					]}
					value={type}
					onChange={(e) => setType(e.target.value as "IN" | "OUT")}
				/>
				<FormField label="Descrição *" id="description" value={description} onChange={(e) => setDescription(e.target.value)} required />
				<FormField label="Valor (R$) *" id="value" type="number" step="0.01" min="0.01" value={value} onChange={(e) => setValue(e.target.value)} required />
				<FormField label="Data" id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
				<SelectField label="Ordem de Serviço (opcional)" id="serviceOrderId" options={osOptions} value={serviceOrderId} onChange={(e) => setServiceOrderId(e.target.value)} />

				{create.error ? <p className="text-sm text-red-600">{create.error.message}</p> : null}

				<div className="flex gap-3 pt-2">
					<Button type="submit" disabled={create.isPending}>
						{create.isPending ? "Salvando..." : "Salvar"}
					</Button>
					<Button type="button" variant="secondary" onClick={() => router.push("/caixa")}>
						Cancelar
					</Button>
				</div>
			</form>
		</div>
	);
}
