import { z } from "zod";
import { headers } from "next/headers";
import { TRPCError } from "@trpc/server";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { auth } from "@/server/better-auth";

/**
 * Middleware que garante que o usuário logado é admin.
 */
function assertAdmin(role: string | null | undefined) {
	if (role !== "admin") {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "Apenas administradores podem realizar esta ação.",
		});
	}
}

export const userRouter = createTRPCRouter({
	/** Lista todos os usuários (somente admin). */
	list: protectedProcedure.query(async ({ ctx }) => {
		assertAdmin(ctx.session.user.role);
		const result = await auth.api.listUsers({
			query: { limit: 100, sortBy: "createdAt", sortDirection: "desc" },
			headers: ctx.headers,
		});
		return result.users;
	}),

	/** Cria um novo usuário (somente admin). */
	create: protectedProcedure
		.input(
			z.object({
				name: z.string().min(1, "Nome é obrigatório"),
				email: z.string().email("Email inválido"),
				password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
				role: z.enum(["user", "admin"]).default("user"),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			assertAdmin(ctx.session.user.role);
			const newUser = await auth.api.createUser({
				body: {
					name: input.name,
					email: input.email,
					password: input.password,
					role: input.role,
				},
				headers: ctx.headers,
			});
			return newUser;
		}),

	/** Atualiza dados de um usuário (somente admin). */
	update: protectedProcedure
		.input(
			z.object({
				userId: z.string(),
				name: z.string().min(1).optional(),
				email: z.string().email().optional(),
				role: z.enum(["user", "admin"]).optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			assertAdmin(ctx.session.user.role);
			const { userId, role, ...data } = input;

			// Atualiza dados do usuário
			if (Object.keys(data).length > 0) {
				await auth.api.adminUpdateUser({
					body: { userId, data },
					headers: ctx.headers,
				});
			}

			// Atualiza role separadamente se informado
			if (role) {
				await auth.api.setRole({
					body: { userId, role },
					headers: ctx.headers,
				});
			}

			return { success: true };
		}),

	/** Altera a senha de um usuário (somente admin). */
	setPassword: protectedProcedure
		.input(
			z.object({
				userId: z.string(),
				newPassword: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			assertAdmin(ctx.session.user.role);
			await auth.api.setUserPassword({
				body: { userId: input.userId, newPassword: input.newPassword },
				headers: ctx.headers,
			});
			return { success: true };
		}),

	/** Banir um usuário (somente admin). */
	ban: protectedProcedure
		.input(
			z.object({
				userId: z.string(),
				banReason: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			assertAdmin(ctx.session.user.role);
			await auth.api.banUser({
				body: {
					userId: input.userId,
					banReason: input.banReason ?? "Bloqueado pelo administrador",
				},
				headers: ctx.headers,
			});
			return { success: true };
		}),

	/** Desbanir um usuário (somente admin). */
	unban: protectedProcedure
		.input(z.object({ userId: z.string() }))
		.mutation(async ({ ctx, input }) => {
			assertAdmin(ctx.session.user.role);
			await auth.api.unbanUser({
				body: { userId: input.userId },
				headers: ctx.headers,
			});
			return { success: true };
		}),

	/** Remover um usuário permanentemente (somente admin). */
	remove: protectedProcedure
		.input(z.object({ userId: z.string() }))
		.mutation(async ({ ctx, input }) => {
			assertAdmin(ctx.session.user.role);

			// Impedir que admin exclua a si mesmo
			if (input.userId === ctx.session.user.id) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Você não pode excluir sua própria conta.",
				});
			}

			await auth.api.removeUser({
				body: { userId: input.userId },
				headers: ctx.headers,
			});
			return { success: true };
		}),
});
