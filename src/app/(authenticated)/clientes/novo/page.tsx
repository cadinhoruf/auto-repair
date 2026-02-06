"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/app/_components/ui/button";
import { FormField, TextareaField } from "@/app/_components/ui/form-field";
import { PageHeader } from "@/app/_components/ui/page-header";
import { type ClientFormData, clientSchema } from "@/lib/schemas";
import { api } from "@/trpc/react";

export default function NovoClientePage() {
	const router = useRouter();
	const utils = api.useUtils();

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<ClientFormData>({
		resolver: zodResolver(clientSchema),
		defaultValues: { name: "", phone: "", email: "", document: "", notes: "" },
	});

	const create = api.clients.create.useMutation({
		onSuccess: async () => {
			await utils.clients.list.invalidate();
			router.push("/clientes");
		},
	});

	const onSubmit = (data: ClientFormData) => {
		create.mutate({
			name: data.name,
			phone: data.phone,
			email: data.email || undefined,
			document: data.document || undefined,
			notes: data.notes || undefined,
		});
	};

	return (
		<div className="flex flex-col gap-6">
			<PageHeader title="Novo Cliente" />

			<form className="max-w-lg space-y-4" onSubmit={handleSubmit(onSubmit)}>
				<FormField label="Nome *" id="name" registration={register("name")} error={errors.name?.message} />
				<FormField label="Telefone *" id="phone" registration={register("phone")} error={errors.phone?.message} />
				<FormField label="Email" id="email" type="email" registration={register("email")} error={errors.email?.message} />
				<FormField label="Documento (CPF/CNPJ)" id="document" registration={register("document")} error={errors.document?.message} />
				<TextareaField label="Observações" id="notes" registration={register("notes")} error={errors.notes?.message} />

				{create.error ? (
					<p className="text-sm text-red-600">{create.error.message}</p>
				) : null}

				<div className="flex gap-3 pt-2">
					<Button type="submit" disabled={create.isPending}>
						{create.isPending ? "Salvando..." : "Salvar"}
					</Button>
					<Button type="button" variant="secondary" onClick={() => router.push("/clientes")}>
						Cancelar
					</Button>
				</div>
			</form>
		</div>
	);
}
