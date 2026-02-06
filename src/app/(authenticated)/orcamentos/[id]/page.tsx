"use client";

import { useParams } from "next/navigation";

import { Button } from "@/app/_components/ui/button";
import { PageHeader } from "@/app/_components/ui/page-header";
import { api } from "@/trpc/react";

export default function OrcamentoDetalhePage() {
	const { id } = useParams<{ id: string }>();
	const { data: budget, isLoading } = api.budget.getById.useQuery({ budgetId: id });

	if (isLoading) return <p className="text-sm text-gray-500">Carregando...</p>;
	if (!budget) return <p className="text-sm text-red-600">Orçamento não encontrado.</p>;

	return (
		<div className="flex flex-col gap-6">
			<PageHeader title={`Orçamento ${budget.number}`} />

			{/* Preview card */}
			<section className="rounded-xl border border-gray-200 bg-white p-6">
				{/* Header */}
				<div className="mb-6 flex items-start justify-between border-b border-gray-100 pb-4">
					<div>
						<h2 className="font-bold text-lg text-indigo-600">Auto Repair</h2>
						<p className="text-xs text-gray-500">Sistema de gestão da oficina</p>
					</div>
					<div className="text-right text-sm">
						<p className="font-medium text-gray-900">{budget.number}</p>
						<p className="text-gray-500">{new Date(budget.issuedAt).toLocaleDateString("pt-BR")}</p>
					</div>
				</div>

				{/* Cliente */}
				<div className="mb-4">
					<h3 className="mb-1 text-xs font-medium text-gray-500">Cliente</h3>
					<p className="text-sm font-medium text-gray-900">{budget.client.name}</p>
				</div>

				{/* OS vinculada */}
				{budget.serviceOrder ? (
					<div className="mb-4">
						<h3 className="mb-1 text-xs font-medium text-gray-500">Ordem de Serviço</h3>
						<p className="text-sm text-gray-700">{budget.serviceOrder.problemDescription}</p>
					</div>
				) : null}

				{/* Descrição / itens */}
				<div className="mb-4">
					<h3 className="mb-1 text-xs font-medium text-gray-500">Itens / Serviços</h3>
					<p className="whitespace-pre-wrap text-sm text-gray-700">{budget.notes ?? "—"}</p>
				</div>

				{/* Items detalhados (se existir) */}
				{budget.items.length > 0 ? (
					<div className="mb-4 overflow-hidden rounded-lg border border-gray-200">
						<table className="w-full text-left text-sm">
							<thead className="bg-gray-50">
								<tr>
									<th className="px-3 py-2 font-medium text-gray-600">Descrição</th>
									<th className="px-3 py-2 font-medium text-gray-600">Qtd</th>
									<th className="px-3 py-2 font-medium text-gray-600">Unit.</th>
									<th className="px-3 py-2 font-medium text-gray-600">Total</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-gray-100">
								{budget.items.map((item) => (
									<tr key={item.id}>
										<td className="px-3 py-2 text-gray-900">{item.description}</td>
										<td className="px-3 py-2 text-gray-600">{item.quantity}</td>
										<td className="px-3 py-2 text-gray-600">R$ {Number(item.unitPrice).toFixed(2)}</td>
										<td className="px-3 py-2 font-medium text-gray-900">R$ {Number(item.totalPrice).toFixed(2)}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				) : null}

				{/* Total */}
				<div className="flex justify-end border-t border-gray-100 pt-4">
					<div className="text-right">
						<p className="text-xs text-gray-500">Valor Total</p>
						<p className="font-bold text-lg text-gray-900">R$ {Number(budget.totalAmount).toFixed(2)}</p>
					</div>
				</div>
			</section>

			<div>
				<Button onClick={() => window.print()}>Gerar PDF (Imprimir)</Button>
			</div>
		</div>
	);
}
