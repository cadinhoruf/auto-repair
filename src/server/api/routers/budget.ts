import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import type { PrismaClient } from "../../../../generated/prisma/client";

/**
 * Gera um número de orçamento sequencial no formato ORC-YYYYMMDD-XXXX.
 */
async function generateBudgetNumber(db: PrismaClient) {
	const today = new Date();
	const prefix = `ORC-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}`;
	const count = await db.budget.count({
		where: { number: { startsWith: prefix } },
	});
	return `${prefix}-${String(count + 1).padStart(4, "0")}`;
}

const budgetItemSchema = z.object({
	serviceItemId: z.string().optional(),
	description: z.string().min(1, "Descrição é obrigatória"),
	quantity: z.number().int().positive("Quantidade deve ser positiva"),
	unitPrice: z.number().nonnegative("Preço unitário deve ser >= 0"),
});

export const budgetRouter = createTRPCRouter({
	list: protectedProcedure.query(async ({ ctx }) => {
		return ctx.db.budget.findMany({
			where: { deletedAt: null },
			select: {
				id: true,
				number: true,
				totalAmount: true,
				issuedAt: true,
				client: { select: { id: true, name: true } },
			},
			orderBy: { issuedAt: "desc" },
		});
	}),

	getById: protectedProcedure
		.input(z.object({ budgetId: z.string() }))
		.query(async ({ ctx, input }) => {
			return ctx.db.budget.findFirstOrThrow({
				where: { id: input.budgetId, deletedAt: null },
				include: {
					client: { select: { id: true, name: true } },
					serviceOrder: { select: { id: true, problemDescription: true } },
					items: { orderBy: { order: "asc" } },
				},
			});
		}),

	create: protectedProcedure
		.input(
			z.object({
				clientId: z.string(),
				items: z.array(budgetItemSchema).min(1, "Adicione pelo menos um item"),
				notes: z.string().optional(),
				serviceOrderId: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			// Garante que o cliente existe
			await ctx.db.client.findFirstOrThrow({
				where: { id: input.clientId, deletedAt: null },
			});

			const number = await generateBudgetNumber(ctx.db);

			// Calcula totais de cada item e o total geral
			const itemsWithTotals = input.items.map((item, index) => ({
				order: index,
				description: item.description,
				quantity: item.quantity,
				unitPrice: item.unitPrice,
				totalPrice: item.quantity * item.unitPrice,
				serviceItemId: item.serviceItemId ?? null,
			}));

			const totalAmount = itemsWithTotals.reduce(
				(sum, item) => sum + item.totalPrice,
				0,
			);

			return ctx.db.budget.create({
				data: {
					number,
					clientId: input.clientId,
					totalAmount,
					notes: input.notes,
					serviceOrderId: input.serviceOrderId,
					items: {
						create: itemsWithTotals,
					},
				},
				include: { items: true },
			});
		}),
});
