"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/app/_components/ui/button";
import { FormField, SelectField } from "@/app/_components/ui/form-field";
import { PageHeader } from "@/app/_components/ui/page-header";
import { type CashFlowFormData, cashFlowSchema } from "@/lib/schemas";
import { api } from "@/trpc/react";

export default function NovaMovimentacaoPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const utils = api.useUtils();

	const preselectedOSId = searchParams.get("serviceOrderId") ?? "";

	const { data: orders } = api.serviceOrder.list.useQuery({ status: "FINISHED" });

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<CashFlowFormData>({
		resolver: zodResolver(cashFlowSchema),
		defaultValues: {
			type: "IN",
			description: "",
			value: "",
			date: new Date().toISOString().slice(0, 10),
			serviceOrderId: preselectedOSId,
		},
	});

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

	const onSubmit = (data: CashFlowFormData) => {
		create.mutate({
			type: data.type,
			description: data.description,
			value: Number(data.value),
			date: new Date(data.date),
			serviceOrderId: data.serviceOrderId || undefined,
		});
	};

	return (
		<div className="flex flex-col gap-6">
			<PageHeader title="Nova Movimentação" />

			<form className="max-w-lg space-y-4" onSubmit={handleSubmit(onSubmit)}>
				<SelectField
					label="Tipo *"
					id="type"
					options={[
						{ value: "IN", label: "Entrada" },
						{ value: "OUT", label: "Saída" },
					]}
					registration={register("type")}
					error={errors.type?.message}
				/>
				<FormField label="Descrição *" id="description" registration={register("description")} error={errors.description?.message} />
				<FormField label="Valor (R$) *" id="value" type="number" step="0.01" min="0.01" registration={register("value")} error={errors.value?.message} />
				<FormField label="Data" id="date" type="date" registration={register("date")} error={errors.date?.message} />
				<SelectField label="Ordem de Serviço (opcional)" id="serviceOrderId" options={osOptions} registration={register("serviceOrderId")} error={errors.serviceOrderId?.message} />

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
