"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/app/_components/ui/button";
import { DateInputBR } from "@/app/_components/ui/date-input-br";
import { FormField, SelectField } from "@/app/_components/ui/form-field";
import { PageHeader } from "@/app/_components/ui/page-header";
import { formatDateBR } from "@/lib/date-br";
import { type CashFlowFormData, cashFlowSchema } from "@/lib/schemas";
import { api } from "@/trpc/react";

const INSTALLMENT_OPTIONS = [
	{ value: "1", label: "À vista" },
	...Array.from({ length: 11 }, (_, i) => ({
		value: String(i + 2),
		label: `${i + 2}x`,
	})),
];

function formatBrl(n: number) {
	return new Intl.NumberFormat("pt-BR", {
		style: "currency",
		currency: "BRL",
	}).format(n);
}

export default function NovaMovimentacaoPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const utils = api.useUtils();
	const preselectedOSId = searchParams.get("serviceOrderId") ?? "";

	const { data: orders } = api.serviceOrder.list.useQuery({ status: "FINISHED" });

	const {
		register,
		control,
		watch,
		handleSubmit,
		formState: { errors },
	} = useForm<CashFlowFormData>({
		resolver: zodResolver(cashFlowSchema),
		defaultValues: {
			type: "IN",
			description: "",
			value: "",
			date: new Date().toISOString().slice(0, 10),
			serviceOrderId: preselectedOSId,
			installmentsCount: "1",
			firstDueDate: new Date().toISOString().slice(0, 10),
		},
	});

	const selectedOSId = watch("serviceOrderId") || preselectedOSId;
	const { data: selectedOS } = api.serviceOrder.getById.useQuery(
		{ serviceOrderId: selectedOSId },
		{ enabled: !!selectedOSId },
	);

	const type = watch("type");
	const valueStr = watch("value");
	const installmentsCount = Math.max(1, Math.min(24, Number(watch("installmentsCount")) || 1));
	const firstDueDate = watch("firstDueDate");
	const totalValue = Number(valueStr) || 0;
	const valuePerInstallment = installmentsCount > 0 ? Math.round((totalValue / installmentsCount) * 100) / 100 : 0;
	// Parse YYYY-MM-DD (input date) de forma explícita para evitar MM/DD em locale US
	const parcelas =
		installmentsCount > 1 && firstDueDate
			? (() => {
					const parts = firstDueDate.split("-").map(Number);
					if (parts.length !== 3) return [];
					const [y, m, d] = parts;
					if (!y || !m || !d) return [];
					return Array.from({ length: installmentsCount }, (_, i) => {
						const data = new Date(y, m - 1, d);
						data.setMonth(data.getMonth() + i);
						return { numero: i + 1, data, valor: valuePerInstallment };
					});
				})()
			: [];

	const create = api.cashFlow.create.useMutation({
		onSuccess: async () => {
			await utils.cashFlow.list.invalidate();
			router.push("/caixa");
		},
	});

	const osOptions = [
		{ value: "", label: "Nenhuma (avulso)" },
		...(orders?.map((o) => ({
			value: o.id,
			label: `${o.client.name} — ${formatDateBR(o.openedAt)}`,
		})) ?? []),
	];

	const onSubmit = (data: CashFlowFormData) => {
		const count = Math.max(1, Math.min(24, Number(data.installmentsCount) || 1));
		const dataParaEnvio = count > 1 ? (data.firstDueDate ?? data.date ?? "") : (data.date ?? "");
		create.mutate({
			type: data.type,
			description: data.description,
			value: totalValue,
			date: new Date(dataParaEnvio),
			serviceOrderId: data.serviceOrderId || undefined,
			installmentsCount: count > 1 ? count : undefined,
			firstDueDate: count > 1 ? (data.firstDueDate || data.date) : undefined,
		});
	};

	return (
		<div className="flex flex-col gap-6">
			<PageHeader title="Nova Movimentação" />

			<div className="flex flex-wrap gap-8 lg:flex-nowrap">
				<form
					className="max-w-lg flex-1 space-y-4"
					onSubmit={handleSubmit(onSubmit)}
				>
					<SelectField
						label="Tipo *"
						id="type"
						options={[
							{ value: "IN", label: "Entrada" },
							{ value: "OUT", label: "Saída" },
						]}
						registration={register("type")}
						error={errors.type?.message}
					/>
					<FormField
						label="Descrição *"
						id="description"
						registration={register("description")}
						error={errors.description?.message}
					/>
					<FormField
						label="Valor total (R$) *"
						id="value"
						type="number"
						step="0.01"
						min="0.01"
						registration={register("value")}
						error={errors.value?.message}
					/>
					<SelectField
						label="Ordem de Serviço (opcional)"
						id="serviceOrderId"
						options={osOptions}
						registration={register("serviceOrderId")}
						error={errors.serviceOrderId?.message}
					/>

					{/* Parcelamento */}
					<div className="space-y-3 rounded-xl border border-gray-200 bg-gray-50/50 p-4">
						<div className="font-medium text-sm text-gray-700">Parcelamento</div>
						<div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
							<div>
								<label className="mb-1 block text-xs font-medium text-gray-500">
									Parcelas
								</label>
								<select
									{...register("installmentsCount")}
									className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
								>
									{INSTALLMENT_OPTIONS.map((o) => (
										<option key={o.value} value={o.value}>
											{o.label}
										</option>
									))}
								</select>
							</div>
							{installmentsCount > 1 && (
								<div className="sm:col-span-2">
									<Controller
										name="firstDueDate"
										control={control}
										render={({ field }) => (
											<DateInputBR
												label="Primeiro vencimento"
												value={field.value ?? ""}
												onChange={field.onChange}
												error={errors.firstDueDate?.message}
											/>
										)}
									/>
								</div>
							)}
						</div>
						{installmentsCount > 1 && firstDueDate && totalValue > 0 && (
							<div className="rounded-lg border border-gray-200 bg-white p-3 text-sm">
								<div className="mb-2 font-medium text-gray-700">Resumo</div>
								<ul className="space-y-1">
									{parcelas.map((p) => (
										<li
											key={p.numero}
											className="flex justify-between text-gray-600"
										>
											<span>
												{p.numero}/{installmentsCount} — {formatDateBR(p.data)}
											</span>
											<span className="font-medium">{formatBrl(p.valor)}</span>
										</li>
									))}
								</ul>
								<div className="mt-2 border-t border-gray-100 pt-2 font-medium text-gray-900">
									Total: {formatBrl(totalValue)}
								</div>
							</div>
						)}
					</div>

					<Controller
						name="date"
						control={control}
						render={({ field }) => (
							<DateInputBR
								id="date"
								label={installmentsCount > 1 ? "Data (à vista, opcional)" : "Data (à vista) *"}
								value={field.value ?? ""}
								onChange={field.onChange}
								error={errors.date?.message}
							/>
						)}
					/>
					<p className="text-xs text-gray-500">
						{installmentsCount > 1
							? "Parcelas usam o primeiro vencimento acima."
							: "Usada quando for à vista."}
					</p>

					{create.error ? (
						<p className="text-sm text-red-600">{create.error.message}</p>
					) : null}

					<div className="flex gap-3 pt-2">
						<Button type="submit" disabled={create.isPending}>
							{create.isPending ? "Salvando..." : "Salvar"}
						</Button>
						<Button
							type="button"
							variant="secondary"
							onClick={() => router.push("/caixa")}
						>
							Cancelar
						</Button>
					</div>
				</form>

				{selectedOS && (
					<div className="w-full rounded-xl border border-gray-200 bg-white p-5 lg:max-w-sm">
						<h3 className="mb-3 font-semibold text-gray-900">Ordem de Serviço</h3>
						<dl className="space-y-2 text-sm">
							<div>
								<dt className="text-gray-500">Cliente</dt>
								<dd className="font-medium text-gray-900">{selectedOS.client.name}</dd>
							</div>
							<div>
								<dt className="text-gray-500">Problema / Solicitação</dt>
								<dd className="text-gray-700">{selectedOS.problemDescription}</dd>
							</div>
							{selectedOS.servicesPerformed ? (
								<div>
									<dt className="text-gray-500">Serviços realizados</dt>
									<dd className="text-gray-700 whitespace-pre-wrap">{selectedOS.servicesPerformed}</dd>
								</div>
							) : null}
							{selectedOS.partsUsed ? (
								<div>
									<dt className="text-gray-500">Peças utilizadas</dt>
									<dd className="text-gray-700 whitespace-pre-wrap">{selectedOS.partsUsed}</dd>
								</div>
							) : null}
							<div>
								<dt className="text-gray-500">Valor estimado</dt>
								<dd className="text-gray-700">
									{selectedOS.estimatedValue != null
										? formatBrl(Number(selectedOS.estimatedValue))
										: "—"}
								</dd>
							</div>
							<div>
								<dt className="text-gray-500">Valor final</dt>
								<dd className="font-medium text-gray-900">
									{selectedOS.finalValue != null
										? formatBrl(Number(selectedOS.finalValue))
										: "—"}
								</dd>
							</div>
							<div>
								<dt className="text-gray-500">Abertura</dt>
								<dd className="text-gray-700">{formatDateBR(selectedOS.openedAt)}</dd>
							</div>
							{selectedOS.closedAt ? (
								<div>
									<dt className="text-gray-500">Encerramento</dt>
									<dd className="text-gray-700">{formatDateBR(selectedOS.closedAt)}</dd>
								</div>
							) : null}
						</dl>
					</div>
				)}
			</div>
		</div>
	);
}
