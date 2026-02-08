"use client";

import {
	type ColumnDef,
	type ColumnFiltersState,
	type SortingState,
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getSortedRowModel,
	useReactTable,
} from "@tanstack/react-table";
import Link from "next/link";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { DateInputBR } from "@/app/_components/ui/date-input-br";
import { EmptyState } from "@/app/_components/ui/empty-state";
import { PageHeader } from "@/app/_components/ui/page-header";
import { StatusBadge } from "@/app/_components/ui/status-badge";
import { formatDateBR } from "@/lib/date-br";
import type { RouterOutputs } from "@/trpc/react";
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

function toISO(date: Date | string): string {
	const d = typeof date === "string" ? new Date(date) : date;
	return d.toISOString().slice(0, 10);
}

type CashFlowEntry = RouterOutputs["cashFlow"]["list"][number];

const EMPTY_ENTRIES: CashFlowEntry[] = [];

const PaidAtCell = memo(function PaidAtCell({
	cashFlowId,
	paidAtIso,
	onCommit,
}: {
	cashFlowId: string;
	paidAtIso: string;
	onCommit: (cashFlowId: string, value: string) => void;
}) {
	return (
		<DateInputBR
			label=""
			value={paidAtIso}
			onChange={() => {}}
			onCommit={(value: string) => onCommit(cashFlowId, value)}
			placeholder="dd/mm/aaaa"
			className="min-w-[8rem] gap-0"
		/>
	);
});

function DebouncedInput({
	value: initialValue,
	onChange,
	debounce = 300,
	...props
}: {
	value: string;
	onChange: (value: string) => void;
	debounce?: number;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) {
	const [value, setValue] = useState(initialValue);

	useEffect(() => {
		setValue(initialValue);
	}, [initialValue]);

	useEffect(() => {
		const t = setTimeout(() => onChange(value), debounce);
		return () => clearTimeout(t);
	}, [value, debounce, onChange]);

	return (
		<input
			{...props}
			value={value}
			onChange={(e) => setValue(e.target.value)}
			className="mt-1 w-full rounded border border-gray-200 px-2 py-1 text-xs"
		/>
	);
}

function TableFilter({ column }: { column: { getFilterValue: () => unknown; setFilterValue: (updater: (v: unknown) => unknown) => void; getCanFilter: () => boolean } }) {
	if (!column.getCanFilter()) return null;
	const value = (column.getFilterValue() ?? "") as string;
	return (
		<DebouncedInput
			value={value}
			onChange={(v) => column.setFilterValue((prev) => (v ? v : undefined))}
			placeholder="Filtrar..."
			className="min-w-0"
		/>
	);
}

const getRowId = (row: CashFlowEntry) => row.id;
const coreRowModel = getCoreRowModel();
const sortedRowModel = getSortedRowModel();
const filteredRowModel = getFilteredRowModel();

export default function CaixaPage() {
	const [tab, setTab] = useState<(typeof TABS)[number]["value"]>("all");
	const [dateFrom, setDateFrom] = useState("");
	const [dateTo, setDateTo] = useState("");
	const [clientId, setClientId] = useState("");
	const [sorting, setSorting] = useState<SortingState>([{ id: "date", desc: true }]);
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

	const utils = api.useUtils();
	const { data: clients } = api.clients.list.useQuery();
	const { data: entries, isLoading } = api.cashFlow.list.useQuery({
		tab: tab === "all" ? undefined : tab,
		dateFrom: dateFrom || undefined,
		dateTo: dateTo || undefined,
		clientId: clientId || undefined,
	});

	const setPaidAt = api.cashFlow.setPaidAt.useMutation({
		onSuccess: async () => {
			toast.success("Data de pagamento atualizada.");
			await utils.cashFlow.list.invalidate();
		},
	});

	const mutatePaidAtRef = useRef(setPaidAt.mutate);
	mutatePaidAtRef.current = setPaidAt.mutate;

	const handlePaidAtCommit = useCallback((cashFlowId: string, value: string) => {
		mutatePaidAtRef.current({ cashFlowId, paidAt: value });
	}, []);

	const columns = useMemo<ColumnDef<CashFlowEntry>[]>(
		() => [
			{
				accessorKey: "type",
				header: "Tipo",
				cell: ({ getValue }) => <StatusBadge status={getValue() as "IN" | "OUT"} />,
				filterFn: "includesString",
			},
			{
				accessorKey: "description",
				header: "Descrição",
				cell: ({ getValue }) => <span className="text-gray-900">{getValue() as string}</span>,
				filterFn: "includesString",
			},
			{
				id: "clientName",
				accessorFn: (row) => row.serviceOrder?.client?.name ?? "",
				header: "Cliente",
				cell: ({ getValue }) => <span className="text-gray-600">{(getValue() as string) || "—"}</span>,
				filterFn: "includesString",
			},
			{
				id: "os",
				accessorFn: (row) => row.serviceOrder?.id ?? "",
				header: "OS",
				cell: ({ row }) => {
					const os = row.original.serviceOrder;
					if (!os) return <span className="text-gray-400">—</span>;
					return (
						<Link
							href={`/ordens-servico/${os.id}`}
							className="text-gray-700 underline hover:text-gray-900"
						>
							{os.id.slice(0, 8)}…
						</Link>
					);
				},
				filterFn: "includesString",
			},
			{
				accessorKey: "amount",
				header: "Valor",
				cell: ({ getValue }) => <span className="font-medium text-gray-900">{formatBrl(Number(getValue()))}</span>,
				sortingFn: "basic",
				filterFn: (row, columnId, filterValue: string) => {
					if (!filterValue?.trim()) return true;
					const num = Number.parseFloat(filterValue.replace(/\D/g, ""));
					if (Number.isNaN(num)) return true;
					return Number(row.getValue(columnId)) >= num;
				},
			},
			{
				accessorKey: "date",
				header: "Vencimento",
				cell: ({ getValue }) => <span className="text-gray-600">{formatDateBR(getValue() as Date)}</span>,
				sortingFn: "datetime",
				enableColumnFilter: false,
			},
			{
				accessorKey: "paidAt",
				header: "Data de pagamento",
				cell: ({ row }) => (
					<PaidAtCell
						cashFlowId={row.original.id}
						paidAtIso={row.original.paidAt ? toISO(row.original.paidAt) : ""}
						onCommit={handlePaidAtCommit}
					/>
				),
				enableSorting: true,
				sortingFn: "datetime",
				sortUndefined: "last",
				enableColumnFilter: false,
			},
		],
		[handlePaidAtCommit],
	);

	const table = useReactTable({
		data: entries ?? EMPTY_ENTRIES,
		columns,
		getRowId,
		state: {
			sorting,
			columnFilters,
		},
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
		getCoreRowModel: coreRowModel,
		getSortedRowModel: sortedRowModel,
		getFilteredRowModel: filteredRowModel,
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
							{table.getHeaderGroups().map((headerGroup) => (
								<tr key={headerGroup.id}>
									{headerGroup.headers.map((header) => (
										<th
											key={header.id}
											className="px-4 py-3 font-medium text-gray-600"
											colSpan={header.colSpan}
										>
											<div className="flex flex-col gap-1">
												<div
													className={
														header.column.getCanSort()
															? "cursor-pointer select-none hover:text-gray-900"
															: ""
													}
													onClick={header.column.getToggleSortingHandler()}
													title={
														header.column.getCanSort()
															? header.column.getNextSortingOrder() === "asc"
																? "Ordenar ascendente"
																: header.column.getNextSortingOrder() === "desc"
																	? "Ordenar descendente"
																	: "Limpar ordenação"
															: undefined
													}
												>
													{header.isPlaceholder
														? null
														: flexRender(header.column.columnDef.header, header.getContext())}
													{header.column.getCanSort() && (
														<span className="ml-1 inline-block text-gray-400">
															{{
																asc: " ↑",
																desc: " ↓",
															}[header.column.getIsSorted() as string] ?? " ⇅"}
														</span>
													)}
												</div>
												{header.column.getCanFilter() ? (
													<TableFilter column={header.column} />
												) : null}
											</div>
										</th>
									))}
								</tr>
							))}
						</thead>
						<tbody className="divide-y divide-gray-100">
							{table.getRowModel().rows.map((row) => (
								<tr key={row.id} className="hover:bg-gray-50">
									{row.getVisibleCells().map((cell) => (
										<td key={cell.id} className="px-4 py-3">
											{flexRender(cell.column.columnDef.cell, cell.getContext())}
										</td>
									))}
								</tr>
							))}
						</tbody>
					</table>
					{table.getFilteredRowModel().rows.length === 0 && table.getState().columnFilters.length > 0 && (
						<div className="px-4 py-6 text-center text-sm text-gray-500">
							Nenhum resultado para os filtros aplicados.
						</div>
					)}
				</div>
			)}
		</div>
	);
}
