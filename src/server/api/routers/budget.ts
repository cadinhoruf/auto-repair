import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import type { PrismaClient } from "../../../../generated/prisma/client";

/**
 * Gera um número de orçamento sequencial no formato ORC-YYYYMMDD-XXXX.
 */
async function generateBudgetNumber(db: PrismaClient, organizationId: string) {
	const today = new Date();
	const prefix = `ORC-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}`;
	const count = await db.budget.count({
		where: { number: { startsWith: prefix }, organizationId },
	});
	return `${prefix}-${String(count + 1).padStart(4, "0")}`;
}

const budgetStatusEnum = z.enum(["PENDING", "APPROVED", "REJECTED"]);

const budgetItemSchema = z.object({
	serviceItemId: z.string().optional(),
	description: z.string().min(1, "Descrição é obrigatória"),
	quantity: z.number().int().positive("Quantidade deve ser positiva"),
	unitPrice: z.number().nonnegative("Preço unitário deve ser >= 0"),
});

export const budgetRouter = createTRPCRouter({
	list: protectedProcedure
		.input(z.object({ status: budgetStatusEnum.optional() }).optional())
		.query(async ({ ctx, input }) => {
			return ctx.db.budget.findMany({
				where: {
					deletedAt: null,
					organizationId: ctx.organizationId,
					...(input?.status ? { status: input.status } : {}),
				},
				select: {
					id: true,
					number: true,
					totalAmount: true,
					issuedAt: true,
					status: true,
					client: { select: { id: true, name: true } },
				},
				orderBy: { issuedAt: "desc" },
			});
		}),

	getById: protectedProcedure
		.input(z.object({ budgetId: z.string() }))
		.query(async ({ ctx, input }) => {
			return ctx.db.budget.findFirstOrThrow({
				where: { id: input.budgetId, deletedAt: null, organizationId: ctx.organizationId },
				include: {
					client: { select: { id: true, name: true, phone: true, email: true, document: true } },
					serviceOrder: { select: { id: true, problemDescription: true } },
					organization: { select: { name: true } },
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
				problemDescription: z.string().optional(),
				serviceOrderId: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			// Garante que o cliente existe e pertence à org
			await ctx.db.client.findFirstOrThrow({
				where: { id: input.clientId, deletedAt: null, organizationId: ctx.organizationId },
			});

			const number = await generateBudgetNumber(ctx.db, ctx.organizationId);

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
					problemDescription: input.problemDescription,
					serviceOrderId: input.serviceOrderId,
					organizationId: ctx.organizationId,
					items: {
						create: itemsWithTotals,
					},
				},
				include: { items: true },
			});
		}),

	updateStatus: protectedProcedure
		.input(
			z.object({
				budgetId: z.string(),
				status: z.enum(["APPROVED", "REJECTED"]),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			await ctx.db.budget.findFirstOrThrow({
				where: { id: input.budgetId, deletedAt: null, organizationId: ctx.organizationId },
			});
			return ctx.db.budget.update({
				where: { id: input.budgetId },
				data: { status: input.status },
			});
		}),
});
