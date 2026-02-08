import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import type { Prisma } from "../../../../generated/prisma/client";

const typeEnum = z.enum(["IN", "OUT"]);
const tabEnum = z.enum(["all", "IN", "OUT", "receivable", "payable", "pending"]);

function startOfDay(d: Date) {
	const x = new Date(d);
	x.setHours(0, 0, 0, 0);
	return x;
}

export const cashFlowRouter = createTRPCRouter({
	list: protectedProcedure
		.input(
			z.object({
				type: typeEnum.optional(),
				tab: tabEnum.optional(),
				dateFrom: z.string().optional(),
				dateTo: z.string().optional(),
				clientId: z.string().optional(),
			}).optional(),
		)
		.query(async ({ ctx, input }) => {
			const today = startOfDay(new Date());
			const where: Prisma.CashFlowWhereInput = {
				deletedAt: null,
				organizationId: ctx.organizationId,
			};

			if (input?.tab && input.tab !== "all") {
				if (input.tab === "receivable") {
					where.type = "IN";
					where.date = { gte: today };
				} else if (input.tab === "payable") {
					where.type = "OUT";
					where.date = { gte: today };
				} else if (input.tab === "pending") {
					where.date = { gte: today };
				} else {
					where.type = input.tab as "IN" | "OUT";
				}
			} else if (input?.type) {
				where.type = input.type;
			}

			const dateCond: { gte?: Date; lte?: Date } = {};
			if (
				input?.tab === "receivable" ||
				input?.tab === "payable" ||
				input?.tab === "pending"
			) {
				dateCond.gte = today;
			}
			if (input?.dateFrom) {
				const from = new Date(input.dateFrom + "T00:00:00");
				dateCond.gte = dateCond.gte
					? (from > dateCond.gte ? from : dateCond.gte)
					: from;
			}
			if (input?.dateTo) {
				dateCond.lte = new Date(input.dateTo + "T23:59:59.999");
			}
			if (Object.keys(dateCond).length > 0) {
				where.date = dateCond;
			}

			if (input?.clientId) {
				where.serviceOrder = { clientId: input.clientId };
			}

			return ctx.db.cashFlow.findMany({
				where,
				select: {
					id: true,
					type: true,
					description: true,
					amount: true,
					date: true,
					paidAt: true,
					cashFlowGroupId: true,
					installmentIndex: true,
					serviceOrderId: true,
					serviceOrder: {
						select: {
							id: true,
							client: { select: { id: true, name: true } },
						},
					},
				},
				orderBy: { date: "desc" },
			});
		}),

	create: protectedProcedure
		.input(
			z.object({
				type: typeEnum,
				description: z.string().min(1, "Descrição é obrigatória"),
				value: z.number().positive("Valor deve ser positivo"),
				date: z.date().optional(),
				serviceOrderId: z.string().optional(),
				installmentsCount: z.number().int().min(1).max(24).optional(),
				firstDueDate: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			if (input.serviceOrderId) {
				const order = await ctx.db.serviceOrder.findFirstOrThrow({
					where: {
						id: input.serviceOrderId,
						deletedAt: null,
						organizationId: ctx.organizationId,
					},
				});
				if (order.status !== "FINISHED") {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "Só é possível vincular um lançamento a uma OS finalizada.",
					});
				}
			}

			const count = input.installmentsCount ?? 1;
			const firstDate = input.firstDueDate
				? new Date(input.firstDueDate + "T12:00:00")
				: input.date ?? new Date();
			const amountPerInstallment = Math.round((input.value / count) * 100) / 100;

			if (count === 1) {
				return ctx.db.cashFlow.create({
					data: {
						type: input.type,
						description: input.description,
						amount: amountPerInstallment,
						date: firstDate,
						serviceOrderId: input.serviceOrderId,
						organizationId: ctx.organizationId,
					},
				});
			}

			const groupId = crypto.randomUUID();
			const records = Array.from({ length: count }, (_, i) => {
				const due = new Date(firstDate);
				due.setMonth(due.getMonth() + i);
				return {
					type: input.type as "IN" | "OUT",
					description: `${input.description} (${i + 1}/${count})`,
					amount: amountPerInstallment,
					date: due,
					serviceOrderId: input.serviceOrderId,
					organizationId: ctx.organizationId,
					cashFlowGroupId: groupId,
					installmentIndex: i + 1,
				};
			});

			await ctx.db.cashFlow.createMany({ data: records });
			return ctx.db.cashFlow.findFirst({
				where: { cashFlowGroupId: groupId },
				orderBy: { installmentIndex: "asc" },
			});
		}),

	/** Define a data de pagamento (quando foi pago). Envie string vazia para limpar. */
	setPaidAt: protectedProcedure
		.input(
			z.object({
				cashFlowId: z.string().min(1, "ID é obrigatório"),
				paidAt: z.string(), // YYYY-MM-DD ou "" para limpar
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const existing = await ctx.db.cashFlow.findFirst({
				where: {
					id: input.cashFlowId,
					deletedAt: null,
					organizationId: ctx.organizationId,
				},
			});
			if (!existing) {
				throw new TRPCError({ code: "NOT_FOUND", message: "Movimentação não encontrada." });
			}

			const paidAt =
				input.paidAt.trim().length >= 10
					? (() => {
							const [y, m, d] = input.paidAt.slice(0, 10).split("-").map(Number);
							if (!y || !m || !d) return null;
							return new Date(y, m - 1, d);
						})()
					: null;

			await ctx.db.cashFlow.update({
				where: { id: input.cashFlowId },
				data: { paidAt },
			});
			return { ok: true };
		}),
});
