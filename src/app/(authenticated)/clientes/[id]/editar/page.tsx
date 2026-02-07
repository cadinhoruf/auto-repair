"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/app/_components/ui/button";
import { FormField, TextareaField } from "@/app/_components/ui/form-field";
import { PageHeader } from "@/app/_components/ui/page-header";
import { formatPhone } from "@/lib/masks";
import { type ClientFormData, clientSchema } from "@/lib/schemas";
import { api } from "@/trpc/react";

export default function EditarClientePage() {
	const { id } = useParams<{ id: string }>();
	const router = useRouter();
	const utils = api.useUtils();

	const { data: client, isLoading } = api.clients.getById.useQuery({ clientId: id });

	const {
		register,
		handleSubmit,
		reset,
		formState: { errors },
	} = useForm<ClientFormData>({
		resolver: zodResolver(clientSchema),
		defaultValues: { name: "", phone: "", email: "", document: "", notes: "" },
	});

	useEffect(() => {
		if (client) {
			reset({
				name: client.name,
				phone: client.phone,
				email: client.email ?? "",
				document: client.document ?? "",
				notes: client.notes ?? "",
			});
		}
	}, [client, reset]);

	const update = api.clients.update.useMutation({
		onSuccess: async () => {
			await utils.clients.invalidate();
			router.push(`/clientes/${id}`);
		},
	});

	const onSubmit = (data: ClientFormData) => {
		update.mutate({
			clientId: id,
			name: data.name,
			phone: data.phone,
			email: data.email || null,
			document: data.document || null,
			notes: data.notes || null,
		});
	};

	if (isLoading) return <p className="text-sm text-gray-500">Carregando...</p>;

	return (
		<div className="flex flex-col gap-6">
			<PageHeader title="Editar Cliente" />

			<form className="max-w-lg space-y-4" onSubmit={handleSubmit(onSubmit)}>
				<FormField label="Nome *" id="name" registration={register("name")} error={errors.name?.message} />
				<FormField label="Telefone *" id="phone" placeholder="(00) 00000-0000" registration={register("phone", { onChange: (e: React.ChangeEvent<HTMLInputElement>) => { e.target.value = formatPhone(e.target.value); } })} error={errors.phone?.message} />
				<FormField label="Email" id="email" type="email" registration={register("email")} error={errors.email?.message} />
				<FormField label="Documento (CPF/CNPJ)" id="document" registration={register("document")} error={errors.document?.message} />
				<TextareaField label="Observações" id="notes" registration={register("notes")} error={errors.notes?.message} />

				{update.error ? <p className="text-sm text-red-600">{update.error.message}</p> : null}

				<div className="flex gap-3 pt-2">
					<Button type="submit" disabled={update.isPending}>
						{update.isPending ? "Salvando..." : "Salvar"}
					</Button>
					<Button type="button" variant="secondary" onClick={() => router.push(`/clientes/${id}`)}>
						Cancelar
					</Button>
				</div>
			</form>
		</div>
	);
}
