"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { Button } from "@/app/_components/ui/button";
import { TextareaField, SelectField } from "@/app/_components/ui/form-field";
import { PageHeader } from "@/app/_components/ui/page-header";
import { api } from "@/trpc/react";

interface BudgetItemDraft {
	serviceItemId?: string;
	description: string;
	quantity: number;
	unitPrice: number;
}

function emptyItem(): BudgetItemDraft {
	return { description: "", quantity: 1, unitPrice: 0 };
}

export default function NovoOrcamentoPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const utils = api.useUtils();

	const preClientId = searchParams.get("clientId") ?? "";
	const preOSId = searchParams.get("serviceOrderId") ?? "";

	const { data: clients } = api.clients.list.useQuery();
	const { data: catalogItems } = api.serviceItem.list.useQuery();

	const [clientId, setClientId] = useState(preClientId);
	const [notes, setNotes] = useState("");
	const [serviceOrderId] = useState(preOSId);
	const [items, setItems] = useState<BudgetItemDraft[]>([emptyItem()]);

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

	function updateItem(index: number, field: keyof BudgetItemDraft, value: string | number) {
		setItems((prev) =>
			prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
		);
	}

	function selectCatalogItem(index: number, serviceItemId: string) {
		if (!serviceItemId) {
			// "Manual" selecionado — limpar referência ao catálogo
			setItems((prev) =>
				prev.map((item, i) =>
					i === index ? { ...item, serviceItemId: undefined } : item,
				),
			);
			return;
		}
		const catalogItem = catalogItems?.find((c) => c.id === serviceItemId);
		if (!catalogItem) return;

		setItems((prev) =>
			prev.map((item, i) =>
				i === index
					? {
							...item,
							serviceItemId: catalogItem.id,
							description: catalogItem.name,
							unitPrice: Number(catalogItem.defaultPrice),
						}
					: item,
			),
		);
	}

	function addItem() {
		setItems((prev) => [...prev, emptyItem()]);
	}

	function removeItem(index: number) {
		setItems((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
	}

	const totalAmount = items.reduce(
		(sum, item) => sum + item.quantity * item.unitPrice,
		0,
	);

	return (
		<div className="flex flex-col gap-6">
			<PageHeader title="Novo Orçamento" />

			<form
				className="space-y-6"
				onSubmit={(e) => {
					e.preventDefault();
					create.mutate({
						clientId,
						items: items.map((item) => ({
							serviceItemId: item.serviceItemId || undefined,
							description: item.description,
							quantity: item.quantity,
							unitPrice: item.unitPrice,
						})),
						notes: notes || undefined,
						serviceOrderId: serviceOrderId || undefined,
					});
				}}
			>
				<div className="max-w-lg space-y-4">
					<SelectField
						label="Cliente *"
						id="clientId"
						options={clientOptions}
						value={clientId}
						onChange={(e) => setClientId(e.target.value)}
						required
					/>

					{serviceOrderId ? (
						<p className="text-xs text-gray-500">Vinculado à OS: {serviceOrderId}</p>
					) : null}
				</div>

				{/* Tabela de itens */}
				<section>
					<div className="mb-3 flex items-center justify-between">
						<h2 className="font-medium text-sm text-gray-700">Itens / Serviços</h2>
						<Button type="button" variant="secondary" onClick={addItem}>
							+ Adicionar Item
						</Button>
					</div>

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
								{items.map((item, index) => (
									<tr key={index}>
										{/* Seletor do catálogo */}
										<td className="px-4 py-2">
											<select
												className="w-full rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
												value={item.serviceItemId ?? ""}
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
												value={item.description}
												onChange={(e) => updateItem(index, "description", e.target.value)}
												required
											/>
										</td>

										{/* Quantidade */}
										<td className="px-4 py-2">
											<input
												type="number"
												min="1"
												className="w-full rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
												value={item.quantity}
												onChange={(e) => updateItem(index, "quantity", Math.max(1, Number(e.target.value)))}
												required
											/>
										</td>

										{/* Preço unitário */}
										<td className="px-4 py-2">
											<input
												type="number"
												min="0"
												step="0.01"
												className="w-full rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
												value={item.unitPrice}
												onChange={(e) => updateItem(index, "unitPrice", Math.max(0, Number(e.target.value)))}
												required
											/>
										</td>

										{/* Total da linha */}
										<td className="px-4 py-2 text-right font-medium text-gray-900">
											R$ {(item.quantity * item.unitPrice).toFixed(2)}
										</td>

										{/* Remover */}
										<td className="px-4 py-2 text-center">
											{items.length > 1 ? (
												<button
													type="button"
													onClick={() => removeItem(index)}
													className="text-red-500 transition hover:text-red-700"
													title="Remover item"
												>
													&times;
												</button>
											) : null}
										</td>
									</tr>
								))}
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
						value={notes}
						onChange={(e) => setNotes(e.target.value)}
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
