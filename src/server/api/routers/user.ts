import { z } from "zod";
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
	/** Lista todos os usuários com suas organizações e roles (somente admin). */
	list: protectedProcedure.query(async ({ ctx }) => {
		assertAdmin(ctx.session.user.role);
		const result = await auth.api.listUsers({
			query: { limit: 100, sortBy: "createdAt", sortDirection: "desc" },
			headers: ctx.headers,
		});

		const userIds = result.users.map((u) => u.id);

		const memberships = await ctx.db.member.findMany({
			where: { userId: { in: userIds } },
			select: {
				userId: true,
				role: true,
				organization: { select: { id: true, name: true } },
			},
		});

		const membershipsByUser = new Map<
			string,
			{ role: string; organization: { id: string; name: string } }[]
		>();
		for (const m of memberships) {
			const list = membershipsByUser.get(m.userId) ?? [];
			list.push({ role: m.role, organization: m.organization });
			membershipsByUser.set(m.userId, list);
		}

		return result.users.map((user) => ({
			...user,
			organizations: membershipsByUser.get(user.id) ?? [],
		}));
	}),

	/** Cria um novo usuário e adiciona como membro da org ativa (somente admin). */
	create: protectedProcedure
		.input(
			z.object({
				name: z.string().min(1, "Nome é obrigatório"),
				username: z
					.string()
					.min(3, "Usuário deve ter pelo menos 3 caracteres")
					.max(30, "Usuário deve ter no máximo 30 caracteres"),
				email: z.string().email("Email inválido"),
				password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
				role: z.enum(["user", "admin"]).default("user"),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			assertAdmin(ctx.session.user.role);
			const newUser = await auth.api.signUpEmail({
				body: {
					name: input.name,
					username: input.username,
					email: input.email,
					password: input.password,
				},
				headers: ctx.headers,
			});

			const createdUserId =
				typeof newUser === "object" && newUser !== null && "user" in newUser
					? (newUser as { user: { id: string } }).user.id
					: (newUser as { id: string }).id;

			if (input.role !== "user") {
				await auth.api.setRole({
					body: { userId: createdUserId, role: input.role },
					headers: ctx.headers,
				});
			}

			const alreadyMember = await ctx.db.member.findFirst({
				where: {
					userId: createdUserId,
					organizationId: ctx.organizationId,
				},
			});

			if (!alreadyMember) {
				await ctx.db.member.create({
					data: {
						id: crypto.randomUUID(),
						userId: createdUserId,
						organizationId: ctx.organizationId,
						role: input.role === "admin" ? "admin" : "member",
					},
				});
			}

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

			if (Object.keys(data).length > 0) {
				await auth.api.adminUpdateUser({
					body: { userId, data },
					headers: ctx.headers,
				});
			}

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
