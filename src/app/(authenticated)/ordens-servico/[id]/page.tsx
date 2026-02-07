"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button, LinkButton } from "@/app/_components/ui/button";
import { FormField, TextareaField } from "@/app/_components/ui/form-field";
import { PageHeader } from "@/app/_components/ui/page-header";
import { StatusBadge } from "@/app/_components/ui/status-badge";
import { formatDateBR } from "@/lib/date-br";
import { api } from "@/trpc/react";

export default function OSDetalhePage() {
	const { id } = useParams<{ id: string }>();
	const router = useRouter();
	const utils = api.useUtils();

	const { data: os, isLoading } = api.serviceOrder.getById.useQuery({ serviceOrderId: id });

	const [servicesPerformed, setServicesPerformed] = useState("");
	const [partsUsed, setPartsUsed] = useState("");
	const [estimatedValue, setEstimatedValue] = useState("");
	const [finalValue, setFinalValue] = useState("");

	useEffect(() => {
		if (os) {
			setServicesPerformed(os.servicesPerformed);
			setPartsUsed(os.partsUsed);
			setEstimatedValue(os.estimatedValue ? String(os.estimatedValue) : "");
			setFinalValue(os.finalValue ? String(os.finalValue) : "");
		}
	}, [os]);

	const update = api.serviceOrder.update.useMutation({
		onSuccess: async () => {
			await utils.serviceOrder.invalidate();
		},
	});

	if (isLoading) return <p className="text-sm text-gray-500">Carregando...</p>;
	if (!os) return <p className="text-sm text-red-600">OS não encontrada.</p>;

	function handleSave() {
		update.mutate({
			serviceOrderId: id,
			servicesPerformed,
			partsUsed,
			estimatedValue: estimatedValue ? Number(estimatedValue) : null,
			finalValue: finalValue ? Number(finalValue) : null,
		});
	}

	function handleChangeStatus(status: "IN_PROGRESS" | "FINISHED") {
		update.mutate({ serviceOrderId: id, status });
	}

	return (
		<div className="flex flex-col gap-6">
			<PageHeader title={`OS — ${os.client.name}`} />

			{/* Info card */}
			<section className="rounded-xl border border-gray-200 bg-white p-5">
				<div className="mb-4 flex items-center gap-3">
					<StatusBadge status={os.status} />
					<span className="text-xs text-gray-500">
						Aberta em {formatDateBR(os.openedAt)}
						{os.closedAt ? ` · Finalizada em ${formatDateBR(os.closedAt)}` : ""}
					</span>
				</div>

				<dl className="grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
					<div><dt className="text-gray-500">Problema</dt><dd className="font-medium text-gray-900">{os.problemDescription}</dd></div>
					<div><dt className="text-gray-500">Cliente</dt><dd className="font-medium text-gray-900">{os.client.name}</dd></div>
				</dl>
			</section>

			{/* Editable fields */}
			{os.status !== "FINISHED" ? (
				<section className="max-w-lg space-y-4">
					<TextareaField label="Serviços realizados" id="servicesPerformed" value={servicesPerformed} onChange={(e) => setServicesPerformed(e.target.value)} />
					<TextareaField label="Peças utilizadas" id="partsUsed" value={partsUsed} onChange={(e) => setPartsUsed(e.target.value)} />
					<div className="grid gap-4 sm:grid-cols-2">
						<FormField label="Valor estimado (R$)" id="estimatedValue" type="number" step="0.01" min="0" value={estimatedValue} onChange={(e) => setEstimatedValue(e.target.value)} />
						<FormField label="Valor final (R$)" id="finalValue" type="number" step="0.01" min="0" value={finalValue} onChange={(e) => setFinalValue(e.target.value)} />
					</div>

					{update.error ? <p className="text-sm text-red-600">{update.error.message}</p> : null}

					<div className="flex flex-wrap gap-3 pt-2">
						<Button onClick={handleSave} disabled={update.isPending}>Salvar</Button>
						{os.status === "OPEN" ? (
							<Button variant="secondary" onClick={() => handleChangeStatus("IN_PROGRESS")} disabled={update.isPending}>
								Iniciar Serviço
							</Button>
						) : null}
						{os.status === "OPEN" || os.status === "IN_PROGRESS" ? (
							<Button variant="secondary" onClick={() => handleChangeStatus("FINISHED")} disabled={update.isPending}>
								Finalizar Serviço
							</Button>
						) : null}
					</div>
				</section>
			) : (
				<section className="rounded-xl border border-gray-200 bg-white p-5">
					<h2 className="mb-3 font-medium text-sm text-gray-500">Detalhes Finais</h2>
					<dl className="grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
						<div><dt className="text-gray-500">Serviços realizados</dt><dd className="font-medium text-gray-900">{os.servicesPerformed || "—"}</dd></div>
						<div><dt className="text-gray-500">Peças utilizadas</dt><dd className="font-medium text-gray-900">{os.partsUsed || "—"}</dd></div>
						<div><dt className="text-gray-500">Valor estimado</dt><dd className="font-medium text-gray-900">{os.estimatedValue ? `R$ ${Number(os.estimatedValue).toFixed(2)}` : "—"}</dd></div>
						<div><dt className="text-gray-500">Valor final</dt><dd className="font-medium text-gray-900">{os.finalValue ? `R$ ${Number(os.finalValue).toFixed(2)}` : "—"}</dd></div>
					</dl>

					<div className="mt-4 flex gap-3">
						<LinkButton href={`/orcamentos/novo?clientId=${os.client.id}&serviceOrderId=${id}`} variant="secondary">
							Gerar Orçamento
						</LinkButton>
						<LinkButton href={`/caixa/nova?serviceOrderId=${id}`} variant="secondary">
							Registrar Entrada no Caixa
						</LinkButton>
					</div>
				</section>
			)}
		</div>
	);
}
