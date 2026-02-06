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
				where: { id: input.serviceOrderId, deletedAt: null },
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
			// Garante que o cliente existe
			await ctx.db.client.findFirstOrThrow({
				where: { id: input.clientId, deletedAt: null },
			});

			return ctx.db.serviceOrder.create({
				data: {
					clientId: input.clientId,
					problemDescription: input.problemDescription,
					servicesPerformed: "",
					partsUsed: "",
					estimatedValue: input.estimatedValue,
					status: "OPEN",
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
				where: { id: serviceOrderId, deletedAt: null },
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
});
