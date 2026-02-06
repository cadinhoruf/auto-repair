import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

const typeEnum = z.enum(["IN", "OUT"]);

export const cashFlowRouter = createTRPCRouter({
	list: protectedProcedure
		.input(z.object({ type: typeEnum.optional() }).optional())
		.query(async ({ ctx, input }) => {
			return ctx.db.cashFlow.findMany({
				where: {
					deletedAt: null,
					...(input?.type ? { type: input.type } : {}),
				},
				select: {
					id: true,
					type: true,
					description: true,
					amount: true,
					date: true,
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
			}),
		)
		.mutation(async ({ ctx, input }) => {
			// Se vinculado a OS, valida que a OS existe e está FINISHED
			if (input.serviceOrderId) {
				const order = await ctx.db.serviceOrder.findFirstOrThrow({
					where: { id: input.serviceOrderId, deletedAt: null },
				});

				if (order.status !== "FINISHED") {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message:
							"Só é possível vincular um lançamento a uma OS finalizada.",
					});
				}
			}

			return ctx.db.cashFlow.create({
				data: {
					type: input.type,
					description: input.description,
					amount: input.value,
					date: input.date ?? new Date(),
					serviceOrderId: input.serviceOrderId,
				},
			});
		}),
});
