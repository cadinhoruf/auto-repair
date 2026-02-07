"use client";

import { useState } from "react";

import { DateInputBR } from "@/app/_components/ui/date-input-br";
import { EmptyState } from "@/app/_components/ui/empty-state";
import { PageHeader } from "@/app/_components/ui/page-header";
import { StatusBadge } from "@/app/_components/ui/status-badge";
import { formatDateBR } from "@/lib/date-br";
import { api } from "@/trpc/react";

const TABS = [
	{ value: "all" as const, label: "Tudo" },
	{ value: "IN" as const, label: "Entradas" },
	{ value: "OUT" as const, label: "Saídas" },
	{ value: "pending" as const, label: "Pendentes (a receber e a pagar)" },
];

function formatBrl(n: number) {
	return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);
}

export default function CaixaPage() {
	const [tab, setTab] = useState<typeof TABS[number]["value"]>("all");
	const [dateFrom, setDateFrom] = useState("");
	const [dateTo, setDateTo] = useState("");
	const [clientId, setClientId] = useState("");

	const { data: clients } = api.clients.list.useQuery();
	const { data: entries, isLoading } = api.cashFlow.list.useQuery({
		tab: tab === "all" ? undefined : tab,
		dateFrom: dateFrom || undefined,
		dateTo: dateTo || undefined,
		clientId: clientId || undefined,
	});

	return (
		<div className="flex flex-col gap-6">
			<PageHeader
				title="Fluxo de Caixa"
				actionLabel="Nova Movimentação"
				actionHref="/caixa/nova"
			/>

			{/* Abas */}
			<div className="flex flex-wrap gap-1 rounded-xl border border-gray-200 bg-gray-50/80 p-1">
				{TABS.map((t) => (
					<button
						key={t.value}
						type="button"
						onClick={() => setTab(t.value)}
						className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
							tab === t.value
								? "bg-white text-gray-900 shadow-sm"
								: "text-gray-600 hover:text-gray-900"
						}`}
					>
						{t.label}
					</button>
				))}
			</div>

			{/* Filtros: data e cliente */}
			<div className="flex flex-wrap items-end gap-4 rounded-xl border border-gray-200 bg-white p-4">
				<DateInputBR
					label="Data de"
					value={dateFrom}
					onChange={setDateFrom}
				/>
				<DateInputBR
					label="Data até"
					value={dateTo}
					onChange={setDateTo}
				/>
				<div className="min-w-[200px]">
					<label className="mb-1 block text-xs font-medium text-gray-500">
						Cliente
					</label>
					<select
						value={clientId}
						onChange={(e) => setClientId(e.target.value)}
						className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
					>
						<option value="">Todos</option>
						{clients?.map((c) => (
							<option key={c.id} value={c.id}>
								{c.name}
							</option>
						))}
					</select>
				</div>
				{(dateFrom || dateTo || clientId) && (
					<button
						type="button"
						onClick={() => {
							setDateFrom("");
							setDateTo("");
							setClientId("");
						}}
						className="text-sm text-gray-500 underline hover:text-gray-700"
					>
						Limpar filtros
					</button>
				)}
			</div>

			{isLoading ? (
				<p className="text-sm text-gray-500">Carregando...</p>
			) : !entries?.length ? (
				<EmptyState message="Nenhuma movimentação encontrada." />
			) : (
				<div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
					<table className="w-full text-left text-sm">
						<thead className="border-b border-gray-200 bg-gray-50">
							<tr>
								<th className="px-4 py-3 font-medium text-gray-600">Tipo</th>
								<th className="px-4 py-3 font-medium text-gray-600">Descrição</th>
								<th className="px-4 py-3 font-medium text-gray-600">Cliente</th>
								<th className="px-4 py-3 font-medium text-gray-600">Valor</th>
								<th className="px-4 py-3 font-medium text-gray-600">Data</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-gray-100">
							{entries.map((e) => (
								<tr key={e.id} className="hover:bg-gray-50">
									<td className="px-4 py-3">
										<StatusBadge status={e.type} />
									</td>
									<td className="px-4 py-3 text-gray-900">
										{e.description}
									</td>
									<td className="px-4 py-3 text-gray-600">
										{e.serviceOrder?.client?.name ?? "—"}
									</td>
									<td className="px-4 py-3 font-medium text-gray-900">
										{formatBrl(Number(e.amount))}
									</td>
									<td className="px-4 py-3 text-gray-600">
										{formatDateBR(e.date)}
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
