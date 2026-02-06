import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

export const serviceItemRouter = createTRPCRouter({
	/** Lista todos os itens/serviços ativos (não deletados). */
	list: protectedProcedure.query(async ({ ctx }) => {
		return ctx.db.serviceItem.findMany({
			where: { deletedAt: null, active: true },
			orderBy: { name: "asc" },
		});
	}),

	/** Lista todos (incluindo inativos) para a tela de gestão. */
	listAll: protectedProcedure.query(async ({ ctx }) => {
		return ctx.db.serviceItem.findMany({
			where: { deletedAt: null },
			orderBy: { name: "asc" },
		});
	}),

	/** Busca um item por ID. */
	getById: protectedProcedure
		.input(z.object({ id: z.string() }))
		.query(async ({ ctx, input }) => {
			return ctx.db.serviceItem.findFirstOrThrow({
				where: { id: input.id, deletedAt: null },
			});
		}),

	/** Cria um novo item/serviço no catálogo. */
	create: protectedProcedure
		.input(
			z.object({
				name: z.string().min(1, "Nome é obrigatório"),
				description: z.string().optional(),
				defaultPrice: z.number().nonnegative("Preço deve ser >= 0"),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			return ctx.db.serviceItem.create({
				data: {
					name: input.name,
					description: input.description,
					defaultPrice: input.defaultPrice,
				},
			});
		}),

	/** Atualiza um item/serviço existente. */
	update: protectedProcedure
		.input(
			z.object({
				id: z.string(),
				name: z.string().min(1, "Nome é obrigatório").optional(),
				description: z.string().optional(),
				defaultPrice: z.number().nonnegative("Preço deve ser >= 0").optional(),
				active: z.boolean().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { id, ...data } = input;
			return ctx.db.serviceItem.update({
				where: { id },
				data,
			});
		}),

	/** Soft-delete de um item/serviço. */
	delete: protectedProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			return ctx.db.serviceItem.update({
				where: { id: input.id },
				data: { deletedAt: new Date() },
			});
		}),
});
