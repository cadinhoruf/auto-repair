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
				itemsDescription: z.string().min(1, "Descrição dos itens é obrigatória"),
				totalValue: z.number().nonnegative(),
				serviceOrderId: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			// Garante que o cliente existe
			await ctx.db.client.findFirstOrThrow({
				where: { id: input.clientId, deletedAt: null },
			});

			const number = await generateBudgetNumber(ctx.db);

			return ctx.db.budget.create({
				data: {
					number,
					clientId: input.clientId,
					totalAmount: input.totalValue,
					notes: input.itemsDescription,
					serviceOrderId: input.serviceOrderId,
				},
			});
		}),
});
