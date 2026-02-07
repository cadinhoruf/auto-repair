"use client";

import { useState } from "react";

import { EmptyState } from "@/app/_components/ui/empty-state";
import { PageHeader } from "@/app/_components/ui/page-header";
import { StatusBadge } from "@/app/_components/ui/status-badge";
import { api } from "@/trpc/react";

const typeOptions = [
	{ value: "", label: "Todos" },
	{ value: "IN", label: "Entrada" },
	{ value: "OUT", label: "Saída" },
];

export default function CaixaPage() {
	const [typeFilter, setTypeFilter] = useState("");

	const { data: entries, isLoading } = api.cashFlow.list.useQuery(
		typeFilter ? { type: typeFilter as "IN" | "OUT" } : undefined,
	);

	return (
		<div className="flex flex-col gap-6">
			<PageHeader title="Fluxo de Caixa" actionLabel="Nova Movimentação" actionHref="/caixa/nova" />

			<div className="flex items-center gap-2">
				<span className="text-sm text-gray-500">Filtrar:</span>
				{typeOptions.map((opt) => (
					<button
						key={opt.value}
						type="button"
						onClick={() => setTypeFilter(opt.value)}
						className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
							typeFilter === opt.value
								? "bg-blue-100 text-blue-700"
								: "bg-gray-100 text-gray-600 hover:bg-gray-200"
						}`}
					>
						{opt.label}
					</button>
				))}
			</div>

			{isLoading ? (
				<p className="text-sm text-gray-500">Carregando...</p>
			) : !entries?.length ? (
				<EmptyState message="Nenhuma movimentação registrada." />
			) : (
				<div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
					<table className="w-full text-left text-sm">
						<thead className="border-b border-gray-200 bg-gray-50">
							<tr>
								<th className="px-4 py-3 font-medium text-gray-600">Tipo</th>
								<th className="px-4 py-3 font-medium text-gray-600">Descrição</th>
								<th className="px-4 py-3 font-medium text-gray-600">Valor</th>
								<th className="px-4 py-3 font-medium text-gray-600">Data</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-gray-100">
							{entries.map((e) => (
								<tr key={e.id} className="hover:bg-gray-50">
									<td className="px-4 py-3"><StatusBadge status={e.type} /></td>
									<td className="px-4 py-3 text-gray-900">{e.description}</td>
									<td className="px-4 py-3 font-medium text-gray-900">R$ {Number(e.amount).toFixed(2)}</td>
									<td className="px-4 py-3 text-gray-600">{new Date(e.date).toLocaleDateString("pt-BR")}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
		</div>
	);
}
