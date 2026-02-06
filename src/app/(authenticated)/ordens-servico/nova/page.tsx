"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/app/_components/ui/button";
import { FormField, TextareaField, SelectField } from "@/app/_components/ui/form-field";
import { PageHeader } from "@/app/_components/ui/page-header";
import { type ServiceOrderFormData, serviceOrderSchema } from "@/lib/schemas";
import { api } from "@/trpc/react";

export default function NovaOSPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const utils = api.useUtils();

	const preselectedClientId = searchParams.get("clientId") ?? "";

	const { data: clients } = api.clients.list.useQuery();

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<ServiceOrderFormData>({
		resolver: zodResolver(serviceOrderSchema),
		defaultValues: {
			clientId: preselectedClientId,
			problemDescription: "",
			estimatedValue: "",
		},
	});

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

	const onSubmit = (data: ServiceOrderFormData) => {
		create.mutate({
			clientId: data.clientId,
			problemDescription: data.problemDescription,
			estimatedValue: data.estimatedValue ? Number(data.estimatedValue) : undefined,
		});
	};

	return (
		<div className="flex flex-col gap-6">
			<PageHeader title="Nova Ordem de Serviço" />

			<form className="max-w-lg space-y-4" onSubmit={handleSubmit(onSubmit)}>
				<SelectField label="Cliente *" id="clientId" options={clientOptions} registration={register("clientId")} error={errors.clientId?.message} />
				<TextareaField label="Descrição do problema *" id="problemDescription" registration={register("problemDescription")} error={errors.problemDescription?.message} />
				<FormField label="Valor estimado (R$)" id="estimatedValue" type="number" step="0.01" min="0" registration={register("estimatedValue")} error={errors.estimatedValue?.message} />

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
