"use client";

import { useParams } from "next/navigation";

import { Button } from "@/app/_components/ui/button";
import { PageHeader } from "@/app/_components/ui/page-header";
import { formatDateBR } from "@/lib/date-br";
import { openBudgetPdf } from "@/lib/generate-budget-pdf";
import { buildWhatsAppUrl } from "@/lib/masks";
import { api } from "@/trpc/react";

export default function OrcamentoDetalhePage() {
	const { id } = useParams<{ id: string }>();
	const { data: budget, isLoading } = api.budget.getById.useQuery({
		budgetId: id,
	});

	if (isLoading)
		return <p className="text-sm text-gray-500">Carregando...</p>;
	if (!budget)
		return (
			<p className="text-sm text-red-600">Orçamento não encontrado.</p>
		);

	function getBudgetPdfData() {
		if (!budget) return null;
		return {
			organizationName: budget.organization.name,
			number: budget.number,
			issuedAt: budget.issuedAt,
			clientName: budget.client.name,
			clientPhone: budget.client.phone,
			clientEmail: budget.client.email ?? undefined,
			clientDocument: budget.client.document ?? undefined,
			serviceOrderDescription:
				budget.serviceOrder?.problemDescription ?? undefined,
			notes: budget.notes ?? undefined,
			items: budget.items.map((item) => ({
				description: item.description,
				quantity: item.quantity,
				unitPrice: Number(item.unitPrice),
				totalPrice: Number(item.totalPrice),
			})),
			totalAmount: Number(budget.totalAmount),
		};
	}

	function handleOpenPdf() {
		const data = getBudgetPdfData();
		if (!data) return;
		openBudgetPdf(data);
	}

	function handleSendWhatsApp() {
		if (!budget?.client.phone) return;

		const total = Number(budget.totalAmount).toLocaleString("pt-BR", {
			style: "currency",
			currency: "BRL",
		});

		const message = [
			`Olá, ${budget.client.name}!`,
			"",
			`Segue o orçamento *${budget.number}* da *${budget.organization.name}*:`,
			"",
			...budget.items.map(
				(item) =>
					`• ${item.description} — ${item.quantity}x R$ ${Number(item.unitPrice).toFixed(2)}`,
			),
			"",
			`*Total: ${total}*`,
			budget.notes ? `\nObs: ${budget.notes}` : "",
			"",
			"Aguardamos seu retorno!",
		]
			.filter(Boolean)
			.join("\n");

		const url = buildWhatsAppUrl(budget.client.phone, message);
		if (url) window.open(url, "_blank");
	}

	const whatsAppAvailable = !!budget.client.phone && !!buildWhatsAppUrl(budget.client.phone, "");

	return (
		<div className="flex flex-col gap-6">
			<PageHeader title={`Orçamento ${budget.number}`} />

			{/* Preview card */}
			<section className="rounded-xl border border-gray-200 bg-white p-6">
				{/* Header */}
				<div className="mb-6 flex items-start justify-between border-b border-gray-100 pb-4">
					<div>
						<h2 className="font-bold text-lg text-blue-600">
							{budget.organization.name}
						</h2>
						<p className="text-xs text-gray-500">Orçamento</p>
					</div>
					<div className="text-right text-sm">
						<p className="font-medium text-gray-900">{budget.number}</p>
						<p className="text-gray-500">
							{formatDateBR(budget.issuedAt)}
						</p>
					</div>
				</div>

				{/* Cliente */}
				<div className="mb-4">
					<h3 className="mb-1 text-xs font-medium text-gray-500">Cliente</h3>
					<p className="text-sm font-medium text-gray-900">
						{budget.client.name}
					</p>
					<div className="flex flex-wrap gap-3 text-xs text-gray-500">
						{budget.client.phone ? (
							<span>{budget.client.phone}</span>
						) : null}
						{budget.client.email ? (
							<span>{budget.client.email}</span>
						) : null}
						{budget.client.document ? (
							<span>{budget.client.document}</span>
						) : null}
					</div>
				</div>

				{/* OS vinculada */}
				{budget.serviceOrder ? (
					<div className="mb-4">
						<h3 className="mb-1 text-xs font-medium text-gray-500">
							Ordem de Serviço
						</h3>
						<p className="text-sm text-gray-700">
							{budget.serviceOrder.problemDescription}
						</p>
					</div>
				) : null}

				{/* Items detalhados */}
				{budget.items.length > 0 ? (
					<div className="mb-4 overflow-hidden rounded-lg border border-gray-200">
						<table className="w-full text-left text-sm">
							<thead className="bg-gray-50">
								<tr>
									<th className="w-10 px-3 py-2 text-center font-medium text-gray-600">
										#
									</th>
									<th className="px-3 py-2 font-medium text-gray-600">
										Descrição
									</th>
									<th className="px-3 py-2 font-medium text-gray-600">Qtd</th>
									<th className="px-3 py-2 font-medium text-gray-600">
										Unit.
									</th>
									<th className="px-3 py-2 font-medium text-gray-600">
										Total
									</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-gray-100">
								{budget.items.map((item, index) => (
									<tr key={item.id}>
										<td className="px-3 py-2 text-center text-gray-400">
											{index + 1}
										</td>
										<td className="px-3 py-2 text-gray-900">
											{item.description}
										</td>
										<td className="px-3 py-2 text-gray-600">
											{item.quantity}
										</td>
										<td className="px-3 py-2 text-gray-600">
											R$ {Number(item.unitPrice).toFixed(2)}
										</td>
										<td className="px-3 py-2 font-medium text-gray-900">
											R$ {Number(item.totalPrice).toFixed(2)}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				) : null}

				{/* Observações */}
				{budget.notes ? (
					<div className="mb-4">
						<h3 className="mb-1 text-xs font-medium text-gray-500">
							Observações
						</h3>
						<p className="whitespace-pre-wrap text-sm text-gray-700">
							{budget.notes}
						</p>
					</div>
				) : null}

				{/* Total */}
				<div className="flex justify-end border-t border-gray-100 pt-4">
					<div className="text-right">
						<p className="text-xs text-gray-500">Valor Total</p>
						<p className="font-bold text-lg text-gray-900">
							R$ {Number(budget.totalAmount).toFixed(2)}
						</p>
					</div>
				</div>
			</section>

			<div className="flex flex-wrap gap-3">
				<Button onClick={handleOpenPdf}>Visualizar PDF</Button>
				{whatsAppAvailable ? (
					<Button
						variant="secondary"
						onClick={handleSendWhatsApp}
						className="inline-flex items-center gap-2"
					>
						<svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
							<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
						</svg>
						Enviar via WhatsApp
					</Button>
				) : null}
			</div>
		</div>
	);
}
