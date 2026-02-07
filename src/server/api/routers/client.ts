import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

export const clientRouter = createTRPCRouter({
	list: protectedProcedure.query(async ({ ctx }) => {
		return ctx.db.client.findMany({
			where: { deletedAt: null, organizationId: ctx.organizationId },
			select: {
				id: true,
				name: true,
				phone: true,
				email: true,
				document: true,
			},
			orderBy: { name: "asc" },
		});
	}),

	getById: protectedProcedure
		.input(z.object({ clientId: z.string() }))
		.query(async ({ ctx, input }) => {
			return ctx.db.client.findFirstOrThrow({
				where: { id: input.clientId, deletedAt: null, organizationId: ctx.organizationId },
				select: {
					id: true,
					name: true,
					phone: true,
					email: true,
					document: true,
					notes: true,
					createdAt: true,
				},
			});
		}),

	create: protectedProcedure
		.input(
			z.object({
				name: z.string().min(1, "Nome é obrigatório"),
				phone: z.string().min(1, "Telefone é obrigatório"),
				email: z.string().email().optional(),
				document: z.string().optional(),
				notes: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			return ctx.db.client.create({
				data: {
					...input,
					organizationId: ctx.organizationId,
				},
			});
		}),

	update: protectedProcedure
		.input(
			z.object({
				clientId: z.string(),
				name: z.string().min(1).optional(),
				phone: z.string().min(1).optional(),
				email: z.string().email().nullish(),
				document: z.string().nullish(),
				notes: z.string().nullish(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { clientId, ...data } = input;

			// Garante que o client pertence à org
			await ctx.db.client.findFirstOrThrow({
				where: { id: clientId, organizationId: ctx.organizationId },
			});

			return ctx.db.client.update({
				where: { id: clientId },
				data,
			});
		}),
});
