import { z } from "zod";
import { TRPCError } from "@trpc/server";

import { createTRPCRouter, protectedProcedure, publicProcedure } from "@/server/api/trpc";
import { env } from "@/env";
import { sendInvitationEmail } from "@/server/email";

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

export const organizationRouter = createTRPCRouter({
	/** Lista todas as organizações (somente admin). */
	list: protectedProcedure.query(async ({ ctx }) => {
		assertAdmin(ctx.session.user.role);
		return ctx.db.organization.findMany({
			orderBy: { createdAt: "desc" },
			include: {
				_count: {
					select: { members: true },
				},
			},
		});
	}),

	/** Busca uma organização por ID (somente admin). */
	getById: protectedProcedure
		.input(z.object({ id: z.string() }))
		.query(async ({ ctx, input }) => {
			assertAdmin(ctx.session.user.role);
			return ctx.db.organization.findUniqueOrThrow({
				where: { id: input.id },
				include: {
					members: {
						include: {
							user: {
								select: { id: true, name: true, email: true, role: true },
							},
						},
						orderBy: { createdAt: "asc" },
					},
				},
			});
		}),

	/** Cria uma nova organização (somente admin). */
	create: protectedProcedure
		.input(
			z.object({
				name: z.string().min(1, "Nome é obrigatório"),
				slug: z.string().min(1, "Slug é obrigatório")
					.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug deve conter apenas letras minúsculas, números e hífens"),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			assertAdmin(ctx.session.user.role);

			const existing = await ctx.db.organization.findUnique({
				where: { slug: input.slug },
			});

			if (existing) {
				throw new TRPCError({
					code: "CONFLICT",
					message: "Já existe uma organização com este slug.",
				});
			}

			return ctx.db.organization.create({
				data: {
					id: crypto.randomUUID(),
					name: input.name,
					slug: input.slug,
				},
			});
		}),

	/** Atualiza uma organização (somente admin). */
	update: protectedProcedure
		.input(
			z.object({
				id: z.string(),
				name: z.string().min(1, "Nome é obrigatório"),
				slug: z.string().min(1, "Slug é obrigatório")
					.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug deve conter apenas letras minúsculas, números e hífens"),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			assertAdmin(ctx.session.user.role);

			const existing = await ctx.db.organization.findUnique({
				where: { slug: input.slug },
			});

			if (existing && existing.id !== input.id) {
				throw new TRPCError({
					code: "CONFLICT",
					message: "Já existe outra organização com este slug.",
				});
			}

			return ctx.db.organization.update({
				where: { id: input.id },
				data: {
					name: input.name,
					slug: input.slug,
				},
			});
		}),

	/** Remove uma organização (somente admin). */
	delete: protectedProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			assertAdmin(ctx.session.user.role);

			// Impedir exclusão da organização ativa
			if (input.id === ctx.organizationId) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Você não pode excluir a organização ativa.",
				});
			}

			await ctx.db.organization.delete({
				where: { id: input.id },
			});

			return { success: true };
		}),

	/** Lista membros de uma organização (somente admin). */
	listMembers: protectedProcedure
		.input(z.object({ organizationId: z.string() }))
		.query(async ({ ctx, input }) => {
			assertAdmin(ctx.session.user.role);
			return ctx.db.member.findMany({
				where: { organizationId: input.organizationId },
				include: {
					user: {
						select: { id: true, name: true, email: true, role: true },
					},
				},
				orderBy: { createdAt: "asc" },
			});
		}),

	/** Adiciona um membro a uma organização (somente admin). */
	addMember: protectedProcedure
		.input(
			z.object({
				organizationId: z.string(),
				userId: z.string(),
				role: z.enum(["owner", "admin", "member"]).default("member"),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			assertAdmin(ctx.session.user.role);

			const existing = await ctx.db.member.findFirst({
				where: {
					userId: input.userId,
					organizationId: input.organizationId,
				},
			});

			if (existing) {
				throw new TRPCError({
					code: "CONFLICT",
					message: "Este usuário já é membro desta organização.",
				});
			}

			return ctx.db.member.create({
				data: {
					id: crypto.randomUUID(),
					userId: input.userId,
					organizationId: input.organizationId,
					role: input.role,
				},
			});
		}),

	/** Atualiza o papel de um membro (somente admin). */
	updateMemberRole: protectedProcedure
		.input(
			z.object({
				memberId: z.string(),
				role: z.enum(["owner", "admin", "member"]),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			assertAdmin(ctx.session.user.role);
			return ctx.db.member.update({
				where: { id: input.memberId },
				data: { role: input.role },
			});
		}),

	/** Remove um membro de uma organização (somente admin). */
	removeMember: protectedProcedure
		.input(z.object({ memberId: z.string() }))
		.mutation(async ({ ctx, input }) => {
			assertAdmin(ctx.session.user.role);

			const member = await ctx.db.member.findUniqueOrThrow({
				where: { id: input.memberId },
			});

			// Impedir que admin se remova da própria organização
			if (member.userId === ctx.session.user.id && member.organizationId === ctx.organizationId) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Você não pode se remover da organização ativa.",
				});
			}

			await ctx.db.member.delete({
				where: { id: input.memberId },
			});

			return { success: true };
		}),

	/** Lista todos os usuários disponíveis para adicionar (somente admin). */
	availableUsers: protectedProcedure
		.input(z.object({ organizationId: z.string() }))
		.query(async ({ ctx, input }) => {
			assertAdmin(ctx.session.user.role);

			const existingMembers = await ctx.db.member.findMany({
				where: { organizationId: input.organizationId },
				select: { userId: true },
			});

			const memberUserIds = existingMembers.map((m) => m.userId);

			return ctx.db.user.findMany({
				where: {
					id: { notIn: memberUserIds },
					banned: false,
				},
				select: { id: true, name: true, email: true, role: true },
				orderBy: { name: "asc" },
			});
		}),

	// ── Convites (Invitations) ─────────────────────────────

	/** Envia convite por email para uma organização (somente admin global). */
	inviteMember: protectedProcedure
		.input(
			z.object({
				organizationId: z.string(),
				email: z.string().email("Email inválido"),
				role: z.enum(["admin", "member"]).default("member"),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			assertAdmin(ctx.session.user.role);

			// Verifica se o email já é membro da organização
			const existingMember = await ctx.db.member.findFirst({
				where: {
					organizationId: input.organizationId,
					user: { email: input.email },
				},
			});

			if (existingMember) {
				throw new TRPCError({
					code: "CONFLICT",
					message: "Este usuário já é membro desta organização.",
				});
			}

			// Verifica se já existe um convite pendente para este email
			const existingInvitation = await ctx.db.invitation.findFirst({
				where: {
					organizationId: input.organizationId,
					email: input.email,
					status: "pending",
				},
			});

			if (existingInvitation) {
				throw new TRPCError({
					code: "CONFLICT",
					message: "Já existe um convite pendente para este email.",
				});
			}

			// Busca nome da organização para o email
			const org = await ctx.db.organization.findUniqueOrThrow({
				where: { id: input.organizationId },
				select: { name: true },
			});

			const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 48); // 48h

			// Cria o convite diretamente (bypass Better Auth membership check)
			const invitation = await ctx.db.invitation.create({
				data: {
					id: crypto.randomUUID(),
					email: input.email,
					role: input.role,
					organizationId: input.organizationId,
					inviterId: ctx.session.user.id,
					status: "pending",
					expiresAt,
				},
			});

			// Envia email de convite via Resend
			const inviteLink = `${env.BETTER_AUTH_BASE_URL}/convite/${invitation.id}`;
			try {
				await sendInvitationEmail({
					to: input.email,
					inviterName: ctx.session.user.name ?? ctx.session.user.email ?? "Admin",
					organizationName: org.name,
					role: input.role,
					inviteLink,
					expiresAt,
				});
			} catch (emailError) {
				console.error("[INVITE] Email não enviado, mas convite criado:", emailError);
				// Não falha a operação — o convite foi criado e o link pode ser copiado
			}

			return invitation;
		}),

	/** Lista convites pendentes de uma organização (somente admin). */
	listInvitations: protectedProcedure
		.input(z.object({ organizationId: z.string() }))
		.query(async ({ ctx, input }) => {
			assertAdmin(ctx.session.user.role);

			return ctx.db.invitation.findMany({
				where: {
					organizationId: input.organizationId,
					status: "pending",
				},
				orderBy: { createdAt: "desc" },
			});
		}),

	/** Cancela um convite pendente (somente admin). */
	cancelInvitation: protectedProcedure
		.input(z.object({ invitationId: z.string() }))
		.mutation(async ({ ctx, input }) => {
			assertAdmin(ctx.session.user.role);

			const invitation = await ctx.db.invitation.findUnique({
				where: { id: input.invitationId },
			});

			if (!invitation || invitation.status !== "pending") {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Convite não encontrado ou já processado.",
				});
			}

			await ctx.db.invitation.update({
				where: { id: input.invitationId },
				data: { status: "canceled" },
			});

			return { success: true };
		}),

	/** Busca dados de um convite (público — para a página de aceite). */
	getInvitation: publicProcedure
		.input(z.object({ id: z.string() }))
		.query(async ({ ctx, input }) => {
			const invitation = await ctx.db.invitation.findUnique({
				where: { id: input.id },
				include: {
					organization: {
						select: { name: true, slug: true },
					},
				},
			});

			if (!invitation) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Convite não encontrado.",
				});
			}

			// Busca o nome do convidante
			const inviter = await ctx.db.user.findUnique({
				where: { id: invitation.inviterId },
				select: { name: true, email: true },
			});

			return {
				id: invitation.id,
				email: invitation.email,
				role: invitation.role,
				status: invitation.status,
				expiresAt: invitation.expiresAt,
				organizationName: invitation.organization.name,
				organizationSlug: invitation.organization.slug,
				inviterName: inviter?.name ?? inviter?.email ?? "Desconhecido",
			};
		}),

	/** Aceita um convite (requer autenticação — qualquer usuário logado). */
	acceptInvitation: publicProcedure
		.input(z.object({ invitationId: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const session = ctx.session;
			if (!session?.user) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "Você precisa estar logado para aceitar um convite.",
				});
			}

			const invitation = await ctx.db.invitation.findUnique({
				where: { id: input.invitationId },
			});

			if (!invitation) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Convite não encontrado.",
				});
			}

			if (invitation.status !== "pending") {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: `Este convite já foi ${invitation.status === "accepted" ? "aceito" : invitation.status === "rejected" ? "rejeitado" : "cancelado"}.`,
				});
			}

			if (new Date(invitation.expiresAt) < new Date()) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Este convite expirou.",
				});
			}

			// Verifica se já é membro
			const existingMember = await ctx.db.member.findFirst({
				where: {
					userId: session.user.id,
					organizationId: invitation.organizationId,
				},
			});

			if (existingMember) {
				// Já é membro, apenas marca convite como aceito
				await ctx.db.invitation.update({
					where: { id: input.invitationId },
					data: { status: "accepted" },
				});
				return { success: true };
			}

			// Adiciona como membro e marca convite como aceito
			await ctx.db.$transaction([
				ctx.db.member.create({
					data: {
						id: crypto.randomUUID(),
						userId: session.user.id,
						organizationId: invitation.organizationId,
						role: invitation.role,
					},
				}),
				ctx.db.invitation.update({
					where: { id: input.invitationId },
					data: { status: "accepted" },
				}),
			]);

			// Se o usuário não tem organização ativa, define esta
			await ctx.db.session.updateMany({
				where: {
					userId: session.user.id,
					activeOrganizationId: null,
				},
				data: {
					activeOrganizationId: invitation.organizationId,
				},
			});

			return { success: true };
		}),
});
