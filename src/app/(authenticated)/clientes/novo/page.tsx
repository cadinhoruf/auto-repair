"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/app/_components/ui/button";
import { FormField, TextareaField } from "@/app/_components/ui/form-field";
import { PageHeader } from "@/app/_components/ui/page-header";
import { api } from "@/trpc/react";

export default function NovoClientePage() {
	const router = useRouter();
	const utils = api.useUtils();

	const [name, setName] = useState("");
	const [phone, setPhone] = useState("");
	const [email, setEmail] = useState("");
	const [document, setDocument] = useState("");
	const [notes, setNotes] = useState("");

	const create = api.clients.create.useMutation({
		onSuccess: async () => {
			await utils.clients.list.invalidate();
			router.push("/clientes");
		},
	});

	return (
		<div className="flex flex-col gap-6">
			<PageHeader title="Novo Cliente" />

			<form
				className="max-w-lg space-y-4"
				onSubmit={(e) => {
					e.preventDefault();
					create.mutate({
						name,
						phone,
						email: email || undefined,
						document: document || undefined,
						notes: notes || undefined,
					});
				}}
			>
				<FormField label="Nome *" id="name" value={name} onChange={(e) => setName(e.target.value)} required />
				<FormField label="Telefone *" id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} required />
				<FormField label="Email" id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
				<FormField label="Documento (CPF/CNPJ)" id="document" value={document} onChange={(e) => setDocument(e.target.value)} />
				<TextareaField label="Observações" id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />

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
