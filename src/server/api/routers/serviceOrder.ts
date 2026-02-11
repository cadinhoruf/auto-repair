import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

const statusEnum = z.enum(["OPEN", "IN_PROGRESS", "FINISHED"]);

export const serviceOrderRouter = createTRPCRouter({
	list: protectedProcedure
		.input(z.object({ status: statusEnum.optional() }).optional())
		.query(async ({ ctx, input }) => {
			return ctx.db.serviceOrder.findMany({
				where: {
					deletedAt: null,
					organizationId: ctx.organizationId,
					...(input?.status ? { status: input.status } : {}),
				},
				select: {
					id: true,
					status: true,
					openedAt: true,
					finalValue: true,
					client: { select: { id: true, name: true } },
				},
				orderBy: { openedAt: "desc" },
			});
		}),

	getById: protectedProcedure
		.input(z.object({ serviceOrderId: z.string() }))
		.query(async ({ ctx, input }) => {
			return ctx.db.serviceOrder.findFirstOrThrow({
				where: { id: input.serviceOrderId, deletedAt: null, organizationId: ctx.organizationId },
				include: {
					client: { select: { id: true, name: true } },
				},
			});
		}),

	create: protectedProcedure
		.input(
			z.object({
				clientId: z.string(),
				problemDescription: z.string().min(1, "Descrição do problema é obrigatória"),
				estimatedValue: z.number().positive().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			// Garante que o cliente existe e pertence à org
			await ctx.db.client.findFirstOrThrow({
				where: { id: input.clientId, deletedAt: null, organizationId: ctx.organizationId },
			});

			return ctx.db.serviceOrder.create({
				data: {
					clientId: input.clientId,
					problemDescription: input.problemDescription,
					servicesPerformed: "",
					partsUsed: "",
					estimatedValue: input.estimatedValue,
					status: "OPEN",
					organizationId: ctx.organizationId,
				},
			});
		}),

	update: protectedProcedure
		.input(
			z.object({
				serviceOrderId: z.string(),
				servicesPerformed: z.string().optional(),
				partsUsed: z.string().optional(),
				estimatedValue: z.number().positive().nullish(),
				finalValue: z.number().positive().nullish(),
				status: statusEnum.optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { serviceOrderId, status, ...data } = input;

			const current = await ctx.db.serviceOrder.findFirstOrThrow({
				where: { id: serviceOrderId, deletedAt: null, organizationId: ctx.organizationId },
			});

			// Valida transição de status
			if (status && status !== current.status) {
				const allowed: Record<string, string[]> = {
					OPEN: ["IN_PROGRESS"],
					IN_PROGRESS: ["FINISHED"],
					FINISHED: [],
				};

				if (!allowed[current.status]?.includes(status)) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: `Não é possível mudar o status de ${current.status} para ${status}.`,
					});
				}
			}

			return ctx.db.serviceOrder.update({
				where: { id: serviceOrderId },
				data: {
					...data,
					...(status ? { status } : {}),
					...(status === "FINISHED" ? { closedAt: new Date() } : {}),
				},
			});
		}),

	createFromBudget: protectedProcedure
		.input(z.object({ budgetId: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const budget = await ctx.db.budget.findFirst({
				where: {
					id: input.budgetId,
					deletedAt: null,
					organizationId: ctx.organizationId,
				},
			});

			if (!budget) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Orçamento não encontrado.",
				});
			}

			if (budget.status !== "APPROVED") {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Só é possível gerar OS a partir de um orçamento aprovado.",
				});
			}

			if (budget.serviceOrderId) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Este orçamento já possui uma ordem de serviço vinculada.",
				});
			}

			const problemDescription =
				budget.problemDescription ?? budget.notes ?? "Orçamento aprovado";

			const serviceOrder = await ctx.db.serviceOrder.create({
				data: {
					clientId: budget.clientId,
					organizationId: budget.organizationId,
					problemDescription,
					servicesPerformed: "",
					partsUsed: "",
					estimatedValue: budget.totalAmount,
					status: "OPEN",
				},
			});

			await ctx.db.budget.update({
				where: { id: input.budgetId },
				data: { serviceOrderId: serviceOrder.id },
			});

			return serviceOrder;
		}),
});
