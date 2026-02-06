"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/app/_components/ui/button";
import { TextareaField, SelectField } from "@/app/_components/ui/form-field";
import { PageHeader } from "@/app/_components/ui/page-header";
import { type BudgetFormData, budgetSchema } from "@/lib/schemas";
import { api } from "@/trpc/react";

export default function NovoOrcamentoPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const utils = api.useUtils();

	const preClientId = searchParams.get("clientId") ?? "";
	const preOSId = searchParams.get("serviceOrderId") ?? "";

	const { data: clients } = api.clients.list.useQuery();
	const { data: catalogItems } = api.serviceItem.list.useQuery();

	const {
		register,
		handleSubmit,
		control,
		setValue,
		watch,
		formState: { errors },
	} = useForm<BudgetFormData>({
		resolver: zodResolver(budgetSchema),
		defaultValues: {
			clientId: preClientId,
			notes: "",
			serviceOrderId: preOSId,
			items: [{ description: "", quantity: 1, unitPrice: 0 }],
		},
	});

	const { fields, append, remove } = useFieldArray({
		control,
		name: "items",
	});

	const watchedItems = watch("items");

	const create = api.budget.create.useMutation({
		onSuccess: async (data) => {
			await utils.budget.list.invalidate();
			router.push(`/orcamentos/${data.id}`);
		},
	});

	const clientOptions = [
		{ value: "", label: "Selecione um cliente" },
		...(clients?.map((c) => ({ value: c.id, label: c.name })) ?? []),
	];

	function selectCatalogItem(index: number, serviceItemId: string) {
		if (!serviceItemId) {
			setValue(`items.${index}.serviceItemId`, undefined);
			return;
		}
		const catalogItem = catalogItems?.find((c) => c.id === serviceItemId);
		if (!catalogItem) return;

		setValue(`items.${index}.serviceItemId`, catalogItem.id);
		setValue(`items.${index}.description`, catalogItem.name);
		setValue(`items.${index}.unitPrice`, Number(catalogItem.defaultPrice));
	}

	const totalAmount = (watchedItems ?? []).reduce(
		(sum, item) => sum + (item.quantity ?? 0) * (item.unitPrice ?? 0),
		0,
	);

	const onSubmit = (data: BudgetFormData) => {
		create.mutate({
			clientId: data.clientId,
			items: data.items.map((item) => ({
				serviceItemId: item.serviceItemId || undefined,
				description: item.description,
				quantity: item.quantity,
				unitPrice: item.unitPrice,
			})),
			notes: data.notes || undefined,
			serviceOrderId: data.serviceOrderId || undefined,
		});
	};

	return (
		<div className="flex flex-col gap-6">
			<PageHeader title="Novo Orçamento" />

			<form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
				<div className="max-w-lg space-y-4">
					<SelectField
						label="Cliente *"
						id="clientId"
						options={clientOptions}
						registration={register("clientId")}
						error={errors.clientId?.message}
					/>

					{preOSId ? (
						<p className="text-xs text-gray-500">Vinculado à OS: {preOSId}</p>
					) : null}
				</div>

				{/* Tabela de itens */}
				<section>
					<div className="mb-3 flex items-center justify-between">
						<h2 className="font-medium text-sm text-gray-700">Itens / Serviços</h2>
						<Button
							type="button"
							variant="secondary"
							onClick={() => append({ description: "", quantity: 1, unitPrice: 0 })}
						>
							+ Adicionar Item
						</Button>
					</div>

					{errors.items?.root?.message ? (
						<p className="mb-2 text-sm text-red-600">{errors.items.root.message}</p>
					) : null}

					<div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
						<table className="w-full text-left text-sm">
							<thead className="border-b border-gray-200 bg-gray-50">
								<tr>
									<th className="w-44 px-4 py-3 font-medium text-gray-600">Catálogo</th>
									<th className="px-4 py-3 font-medium text-gray-600">Descrição</th>
									<th className="w-20 px-4 py-3 font-medium text-gray-600">Qtd</th>
									<th className="w-28 px-4 py-3 font-medium text-gray-600">Preço Unit.</th>
									<th className="w-28 px-4 py-3 font-medium text-gray-600">Total</th>
									<th className="w-12 px-4 py-3" />
								</tr>
							</thead>
							<tbody className="divide-y divide-gray-100">
								{fields.map((field, index) => {
									const item = watchedItems?.[index];
									const lineTotal = (item?.quantity ?? 0) * (item?.unitPrice ?? 0);

									return (
										<tr key={field.id}>
											{/* Seletor do catálogo */}
											<td className="px-4 py-2">
												<select
													className="w-full rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
													value={item?.serviceItemId ?? ""}
													onChange={(e) => selectCatalogItem(index, e.target.value)}
												>
													<option value="">Manual</option>
													{catalogItems?.map((ci) => (
														<option key={ci.id} value={ci.id}>
															{ci.name}
														</option>
													))}
												</select>
											</td>

											{/* Descrição */}
											<td className="px-4 py-2">
												<input
													className="w-full rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
													placeholder="Ex: Troca de óleo"
													{...register(`items.${index}.description`)}
												/>
												{errors.items?.[index]?.description?.message ? (
													<p className="mt-0.5 text-xs text-red-600">{errors.items[index].description.message}</p>
												) : null}
											</td>

											{/* Quantidade */}
											<td className="px-4 py-2">
												<input
													type="number"
													min="1"
													className="w-full rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
													{...register(`items.${index}.quantity`, { valueAsNumber: true })}
												/>
												{errors.items?.[index]?.quantity?.message ? (
													<p className="mt-0.5 text-xs text-red-600">{errors.items[index].quantity.message}</p>
												) : null}
											</td>

											{/* Preço unitário */}
											<td className="px-4 py-2">
												<input
													type="number"
													min="0"
													step="0.01"
													className="w-full rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
													{...register(`items.${index}.unitPrice`, { valueAsNumber: true })}
												/>
												{errors.items?.[index]?.unitPrice?.message ? (
													<p className="mt-0.5 text-xs text-red-600">{errors.items[index].unitPrice.message}</p>
												) : null}
											</td>

											{/* Total da linha */}
											<td className="px-4 py-2 text-right font-medium text-gray-900">
												R$ {lineTotal.toFixed(2)}
											</td>

											{/* Remover */}
											<td className="px-4 py-2 text-center">
												{fields.length > 1 ? (
													<button
														type="button"
														onClick={() => remove(index)}
														className="text-red-500 transition hover:text-red-700"
														title="Remover item"
													>
														&times;
													</button>
												) : null}
											</td>
										</tr>
									);
								})}
							</tbody>
							<tfoot className="border-t border-gray-200 bg-gray-50">
								<tr>
									<td colSpan={4} className="px-4 py-3 text-right font-medium text-gray-600">
										Total
									</td>
									<td className="px-4 py-3 text-right font-bold text-gray-900">
										R$ {totalAmount.toFixed(2)}
									</td>
									<td />
								</tr>
							</tfoot>
						</table>
					</div>

					{catalogItems && catalogItems.length === 0 ? (
						<p className="mt-2 text-xs text-gray-400">
							Nenhum item cadastrado no catálogo.{" "}
							<a href="/catalogo/novo" className="text-indigo-500 hover:underline">
								Cadastrar itens
							</a>
						</p>
					) : null}
				</section>

				<div className="max-w-lg">
					<TextareaField
						label="Observações (opcional)"
						id="notes"
						registration={register("notes")}
						error={errors.notes?.message}
					/>
				</div>

				{create.error ? <p className="text-sm text-red-600">{create.error.message}</p> : null}

				<div className="flex gap-3">
					<Button type="submit" disabled={create.isPending}>
						{create.isPending ? "Gerando..." : "Gerar Orçamento"}
					</Button>
					<Button type="button" variant="secondary" onClick={() => router.push("/orcamentos")}>
						Cancelar
					</Button>
				</div>
			</form>
		</div>
	);
}
