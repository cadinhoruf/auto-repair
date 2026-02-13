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

const MONTH_NAMES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

function formatMonthLabel(ym: string): string {
	const [y, m] = ym.split("-").map(Number);
	if (!y || !m) return ym;
	return `${MONTH_NAMES[m - 1] ?? m}/${String(y).slice(-2)}`;
}

function formatBrl(n: number) {
	return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);
}

function formatPivotValue(n: number): string {
	if (n === 0) return "—";
	return new Intl.NumberFormat("pt-BR", {
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	}).format(n);
}

function toISO(date: Date | string): string {
	const d = typeof date === "string" ? new Date(date) : date;
	return d.toISOString().slice(0, 10);
}

function getDefaultPivotRange() {
	const d = new Date();
	const from = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
	const toDate = new Date(d.getFullYear(), d.getMonth() + 5, 1);
	const to = `${toDate.getFullYear()}-${String(toDate.getMonth() + 1).padStart(2, "0")}`;
	return { from, to };
}

const PIVOT_LIST_TABS = [
	{ value: "receivable" as const, label: "Contas a receber" },
	{ value: "payable" as const, label: "Contas a pagar" },
	{ value: "received" as const, label: "Contas recebidas" },
	{ value: "paid" as const, label: "Contas pagas" },
];

type CashFlowEntry = RouterOutputs["cashFlow"]["list"][number];
type PivotListTab = (typeof PIVOT_LIST_TABS)[number]["value"];

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

function TableFilter({
	column,
}: {
	column: {
		getFilterValue: () => unknown;
		setFilterValue: (updater: (v: unknown) => unknown) => void;
		getCanFilter: () => boolean;
	};
}) {
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
	const { from: defaultFrom, to: defaultTo } = getDefaultPivotRange();
	const [pivotMonthFrom, setPivotMonthFrom] = useState(defaultFrom);
	const [pivotMonthTo, setPivotMonthTo] = useState(defaultTo);
	const [pivotMode, setPivotMode] = useState<"previsao" | "realizado">("previsao");
	const [listTab, setListTab] = useState<PivotListTab>("receivable");
	const [dateFrom, setDateFrom] = useState("");
	const [dateTo, setDateTo] = useState("");
	const [clientId, setClientId] = useState("");
	const [sorting, setSorting] = useState<SortingState>([{ id: "date", desc: true }]);
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

	const utils = api.useUtils();
	const { data: clients } = api.clients.list.useQuery();

	const listDateFrom = dateFrom || `${pivotMonthFrom}-01`;
	const listDateTo =
		dateTo ||
		(() => {
			const [y, m] = pivotMonthTo.split("-").map(Number);
			if (!y || !m) return pivotMonthTo + "-28";
			const lastDay = new Date(y, m, 0);
			return lastDay.toISOString().slice(0, 10);
		})();

	const { data: summary } = api.cashFlow.summaryByMonth.useQuery({
		dateFrom: pivotMonthFrom,
		dateTo: pivotMonthTo,
		mode: pivotMode,
	});

	const { data: entries, isLoading } = api.cashFlow.list.useQuery({
		tab: listTab,
		dateFrom: listDateFrom,
		dateTo: listDateTo,
		clientId: clientId || undefined,
	});

	const setPaidAt = api.cashFlow.setPaidAt.useMutation({
		onSuccess: async () => {
			toast.success("Data de pagamento atualizada.");
			await utils.cashFlow.list.invalidate();
			await utils.cashFlow.summaryByMonth.invalidate();
		},
	});

	const mutatePaidAtRef = useRef(setPaidAt.mutate);
	mutatePaidAtRef.current = setPaidAt.mutate;

	const handlePaidAtCommit = useCallback((cashFlowId: string, value: string) => {
		mutatePaidAtRef.current({ cashFlowId, paidAt: value });
	}, []);

	const { months, pivotRows } = useMemo(() => {
		const months: string[] = [];
		let y = Number.parseInt(pivotMonthFrom.slice(0, 4), 10);
		let m = Number.parseInt(pivotMonthFrom.slice(5, 7), 10);
		const [toY, toM] = pivotMonthTo.split("-").map(Number);

		while (y < toY! || (y === toY && m! <= toM!)) {
			months.push(`${y}-${String(m).padStart(2, "0")}`);
			m!++;
			if (m! > 12) {
				m = 1;
				y++;
			}
		}

		const recebimentos = months.map((mm) => (summary?.[mm]?.recebimentos ?? 0));
		const pagamentos = months.map((mm) => (summary?.[mm]?.pagamentos ?? 0));
		const geracao = months.map((_, i) => recebimentos[i]! - pagamentos[i]!);
		let saldo = 0;
		const saldoInicial: number[] = [];
		const saldoFinal: number[] = [];
		for (let i = 0; i < months.length; i++) {
			saldoInicial.push(saldo);
			saldo += geracao[i]!;
			saldoFinal.push(saldo);
		}

		const pivotRows = [
			{ label: "Recebimentos", values: recebimentos, color: "text-blue-600" },
			{ label: "Pagamentos", values: pagamentos, color: "text-red-600" },
			{ label: "Geração de Caixa", values: geracao, color: "" },
			{ label: "Saldo Inicial", values: saldoInicial, color: "" },
			{ label: "Saldo Final", values: saldoFinal, color: "" },
		];

		return { months, pivotRows };
	}, [summary, pivotMonthFrom, pivotMonthTo]);

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
				cell: ({ getValue }) => (
					<span className="text-gray-600">{(getValue() as string) || "—"}</span>
				),
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
				cell: ({ getValue }) => (
					<span className="font-medium text-gray-900">{formatBrl(Number(getValue()))}</span>
				),
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
				cell: ({ getValue }) => (
					<span className="text-gray-600">{formatDateBR(getValue() as Date)}</span>
				),
				sortingFn: "datetime",
				enableColumnFilter: false,
			},
			{
				accessorKey: "paidAt",
				header:
					listTab === "received" || listTab === "paid"
						? "Data receb./pag."
						: "Data de pagamento",
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
		[handlePaidAtCommit, listTab],
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

	useEffect(() => {
		const sortByDateOrPaidAt = listTab === "received" || listTab === "paid" ? "paidAt" : "date";
		setSorting([{ id: sortByDateOrPaidAt, desc: true }]);
	}, [listTab]);

	return (
		<div className="flex flex-col gap-6">
			<PageHeader
				title="Fluxo de Caixa"
				actionLabel="Nova Movimentação"
				actionHref="/caixa/nova"
			/>

			{/* Seção 1: Tabela Pivot */}
			<div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
				<div className="border-b border-gray-200 bg-gray-50/80 px-4 py-3">
					<div className="flex flex-wrap items-center gap-4">
						<h2 className="font-semibold text-gray-900">Resumo mensal</h2>
						<div className="flex items-center gap-2">
							<label className="text-sm text-gray-600">Período:</label>
							<input
								type="month"
								value={pivotMonthFrom}
								onChange={(e) => setPivotMonthFrom(e.target.value)}
								className="rounded-lg border border-gray-200 px-2 py-1.5 text-sm"
							/>
							<span className="text-gray-500">até</span>
							<input
								type="month"
								value={pivotMonthTo}
								onChange={(e) => setPivotMonthTo(e.target.value)}
								className="rounded-lg border border-gray-200 px-2 py-1.5 text-sm"
							/>
						</div>
						<div className="flex rounded-lg border border-gray-200 p-0.5 bg-white">
							<button
								type="button"
								onClick={() => setPivotMode("previsao")}
								className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
									pivotMode === "previsao"
										? "bg-gray-200 text-gray-900"
										: "text-gray-600 hover:text-gray-900"
								}`}
							>
								Previsão
							</button>
							<button
								type="button"
								onClick={() => setPivotMode("realizado")}
								className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
									pivotMode === "realizado"
										? "bg-gray-200 text-gray-900"
										: "text-gray-600 hover:text-gray-900"
								}`}
							>
								Realizado
							</button>
						</div>
					</div>
				</div>
				<div className="overflow-x-auto">
					<table className="w-full text-sm">
						<thead>
							<tr className="border-b border-gray-200 bg-gray-50">
								<th className="px-4 py-3 text-left font-medium text-gray-600 min-w-[140px]">
									{pivotMode === "previsao" ? "Previsão" : "Realizado"}
								</th>
								{months.map((mm) => (
									<th
										key={mm}
										className="px-4 py-3 text-right font-medium text-gray-600 whitespace-nowrap"
									>
										{formatMonthLabel(mm)}
									</th>
								))}
							</tr>
						</thead>
						<tbody className="divide-y divide-gray-100">
							{pivotRows.map((row, ri) => (
								<tr
									key={row.label}
									className={ri === 0 || ri === 1 ? "bg-gray-50/50" : ""}
								>
									<td className="px-4 py-2.5 font-medium text-gray-700">
										{row.label}
									</td>
									{row.values.map((val, i) => (
										<td
											key={months[i]}
											className={`px-4 py-2.5 text-right ${row.color} ${
												(row.label === "Geração de Caixa" ||
													row.label === "Saldo Inicial" ||
													row.label === "Saldo Final") &&
												val < 0
													? "text-red-600"
													: ""
											}`}
										>
											{formatPivotValue(val)}
										</td>
									))}
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>

			{/* Seção 2: 4 listas de detalhes */}
			<div className="flex flex-col gap-4">
				<div className="flex flex-wrap gap-1 rounded-xl border border-gray-200 bg-gray-50/80 p-1">
					{PIVOT_LIST_TABS.map((t) => (
						<button
							key={t.value}
							type="button"
							onClick={() => setListTab(t.value)}
							className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
								listTab === t.value
									? "bg-white text-gray-900 shadow-sm"
									: "text-gray-600 hover:text-gray-900"
							}`}
						>
							{t.label}
						</button>
					))}
				</div>

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
						<label className="mb-1 block text-xs font-medium text-gray-500">Cliente</label>
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
					<EmptyState
						message={`Nenhum item em ${PIVOT_LIST_TABS.find((t) => t.value === listTab)?.label ?? "esta lista"}.`}
					/>
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
															: flexRender(
																	header.column.columnDef.header,
																	header.getContext(),
																)}
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
												{flexRender(
													cell.column.columnDef.cell,
													cell.getContext(),
												)}
											</td>
										))}
									</tr>
								))}
							</tbody>
						</table>
						{table.getFilteredRowModel().rows.length === 0 &&
							table.getState().columnFilters.length > 0 && (
								<div className="px-4 py-6 text-center text-sm text-gray-500">
									Nenhum resultado para os filtros aplicados.
								</div>
							)}
					</div>
				)}
			</div>
		</div>
	);
}
