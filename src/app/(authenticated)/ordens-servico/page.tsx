"use client";

import Link from "next/link";
import { useState } from "react";

import { EmptyState } from "@/app/_components/ui/empty-state";
import { PageHeader } from "@/app/_components/ui/page-header";
import { StatusBadge } from "@/app/_components/ui/status-badge";
import { api } from "@/trpc/react";

const statusOptions = [
	{ value: "", label: "Todos" },
	{ value: "OPEN", label: "Aberta" },
	{ value: "IN_PROGRESS", label: "Em andamento" },
	{ value: "FINISHED", label: "Finalizada" },
];

export default function OrdensServicoPage() {
	const [statusFilter, setStatusFilter] = useState("");

	const { data: orders, isLoading } = api.serviceOrder.list.useQuery(
		statusFilter ? { status: statusFilter as "OPEN" | "IN_PROGRESS" | "FINISHED" } : undefined,
	);

	return (
		<div className="flex flex-col gap-6">
			<PageHeader title="Ordens de Serviço" actionLabel="Nova OS" actionHref="/ordens-servico/nova" />

			<div className="flex items-center gap-2">
				<span className="text-sm text-gray-500">Filtrar:</span>
				{statusOptions.map((opt) => (
					<button
						key={opt.value}
						type="button"
						onClick={() => setStatusFilter(opt.value)}
						className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
							statusFilter === opt.value
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
			) : !orders?.length ? (
				<EmptyState message="Nenhuma ordem de serviço encontrada." />
			) : (
				<div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
					<table className="w-full text-left text-sm">
						<thead className="border-b border-gray-200 bg-gray-50">
							<tr>
								<th className="px-4 py-3 font-medium text-gray-600">Cliente</th>
								<th className="px-4 py-3 font-medium text-gray-600">Status</th>
								<th className="px-4 py-3 font-medium text-gray-600">Abertura</th>
								<th className="px-4 py-3 font-medium text-gray-600">Valor Final</th>
								<th className="px-4 py-3" />
							</tr>
						</thead>
						<tbody className="divide-y divide-gray-100">
							{orders.map((o) => (
								<tr key={o.id} className="hover:bg-gray-50">
									<td className="px-4 py-3 font-medium text-gray-900">{o.client.name}</td>
									<td className="px-4 py-3"><StatusBadge status={o.status} /></td>
									<td className="px-4 py-3 text-gray-600">{new Date(o.openedAt).toLocaleDateString("pt-BR")}</td>
									<td className="px-4 py-3 text-gray-600">{o.finalValue ? `R$ ${Number(o.finalValue).toFixed(2)}` : "—"}</td>
									<td className="px-4 py-3 text-right">
										<Link href={`/ordens-servico/${o.id}`} className="text-sm font-medium text-blue-600 hover:text-blue-800">Ver</Link>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
		</div>
	);
}
