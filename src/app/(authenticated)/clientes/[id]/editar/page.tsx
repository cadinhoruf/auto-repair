"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/app/_components/ui/button";
import { FormField, TextareaField } from "@/app/_components/ui/form-field";
import { PageHeader } from "@/app/_components/ui/page-header";
import { api } from "@/trpc/react";

export default function EditarClientePage() {
	const { id } = useParams<{ id: string }>();
	const router = useRouter();
	const utils = api.useUtils();

	const { data: client, isLoading } = api.clients.getById.useQuery({ clientId: id });

	const [name, setName] = useState("");
	const [phone, setPhone] = useState("");
	const [email, setEmail] = useState("");
	const [document, setDocument] = useState("");
	const [notes, setNotes] = useState("");

	useEffect(() => {
		if (client) {
			setName(client.name);
			setPhone(client.phone);
			setEmail(client.email ?? "");
			setDocument(client.document ?? "");
			setNotes(client.notes ?? "");
		}
	}, [client]);

	const update = api.clients.update.useMutation({
		onSuccess: async () => {
			await utils.clients.invalidate();
			router.push(`/clientes/${id}`);
		},
	});

	if (isLoading) return <p className="text-sm text-gray-500">Carregando...</p>;

	return (
		<div className="flex flex-col gap-6">
			<PageHeader title="Editar Cliente" />

			<form
				className="max-w-lg space-y-4"
				onSubmit={(e) => {
					e.preventDefault();
					update.mutate({
						clientId: id,
						name,
						phone,
						email: email || null,
						document: document || null,
						notes: notes || null,
					});
				}}
			>
				<FormField label="Nome *" id="name" value={name} onChange={(e) => setName(e.target.value)} required />
				<FormField label="Telefone *" id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} required />
				<FormField label="Email" id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
				<FormField label="Documento (CPF/CNPJ)" id="document" value={document} onChange={(e) => setDocument(e.target.value)} />
				<TextareaField label="Observações" id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />

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
