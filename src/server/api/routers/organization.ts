import { z } from "zod";
import { TRPCError } from "@trpc/server";

import { createTRPCRouter, protectedProcedure, publicProcedure } from "@/server/api/trpc";
import { env } from "@/env";
import { isOrgOwner } from "@/lib/permissions";
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

/**
 * Garante que o usuário é admin global OU proprietário da organização.
 */
async function assertOrgOwnerOrAdmin(
	db: Parameters<typeof isOrgOwner>[0],
	userId: string,
	userRole: string | null | undefined,
	organizationId: string,
) {
	if (userRole === "admin") return;
	const owner = await isOrgOwner(db, userId, organizationId);
	if (!owner) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "Apenas o proprietário da organização ou um administrador pode realizar esta ação.",
		});
	}
}

export const organizationRouter = createTRPCRouter({
	/** Lista organizações: admin vê todas; proprietário vê apenas as suas. */
	list: protectedProcedure.query(async ({ ctx }) => {
		if (ctx.session.user.role === "admin") {
			return ctx.db.organization.findMany({
				orderBy: { createdAt: "desc" },
				include: {
					_count: { select: { members: true } },
				},
			});
		}
		// Proprietário vê apenas orgs onde é owner
		const memberships = await ctx.db.member.findMany({
			where: { userId: ctx.session.user.id, role: "owner" },
			select: { organizationId: true },
		});
		const orgIds = memberships.map((m) => m.organizationId);
		if (orgIds.length === 0) return [];
		return ctx.db.organization.findMany({
			where: { id: { in: orgIds } },
			orderBy: { createdAt: "desc" },
			include: {
				_count: { select: { members: true } },
			},
		});
	}),

	/** Busca uma organização por ID (admin ou proprietário dessa org). */
	getById: protectedProcedure
		.input(z.object({ id: z.string() }))
		.query(async ({ ctx, input }) => {
			await assertOrgOwnerOrAdmin(
				ctx.db,
				ctx.session.user.id,
				ctx.session.user.role,
				input.id,
			);
			return ctx.db.organization.findUniqueOrThrow({
				where: { id: input.id },
				include: {
					members: {
						include: {
							user: {
								select: { id: true, name: true, email: true, role: true },
							},
							memberRoles: { select: { role: true } },
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

	/** Atualiza uma organização (admin ou proprietário dessa org). */
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
			await assertOrgOwnerOrAdmin(
				ctx.db,
				ctx.session.user.id,
				ctx.session.user.role,
				input.id,
			);

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

	/** Lista membros de uma organização (admin ou proprietário dessa org). */
	listMembers: protectedProcedure
		.input(z.object({ organizationId: z.string() }))
		.query(async ({ ctx, input }) => {
			await assertOrgOwnerOrAdmin(
				ctx.db,
				ctx.session.user.id,
				ctx.session.user.role,
				input.organizationId,
			);
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

	/** Adiciona um membro a uma organização (admin ou proprietário dessa org). */
	addMember: protectedProcedure
		.input(
			z.object({
				organizationId: z.string(),
				userId: z.string(),
				role: z.enum(["owner", "admin", "member"]).default("member"),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			await assertOrgOwnerOrAdmin(
				ctx.db,
				ctx.session.user.id,
				ctx.session.user.role,
				input.organizationId,
			);

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

	/** Atualiza o papel e roles extras de um membro (admin ou proprietário dessa org). */
	updateMemberRole: protectedProcedure
		.input(
			z.object({
				memberId: z.string(),
				role: z.enum(["owner", "admin", "member"]),
				extraRoles: z.array(z.enum(["financeiro"])).optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const member = await ctx.db.member.findUniqueOrThrow({
				where: { id: input.memberId },
			});
			await assertOrgOwnerOrAdmin(
				ctx.db,
				ctx.session.user.id,
				ctx.session.user.role,
				member.organizationId,
			);

			await ctx.db.$transaction(async (tx) => {
				await tx.member.update({
					where: { id: input.memberId },
					data: { role: input.role },
				});
				await tx.memberRole.deleteMany({
					where: { memberId: input.memberId },
				});
				if (input.extraRoles?.length) {
					await tx.memberRole.createMany({
						data: input.extraRoles.map((role) => ({
							memberId: input.memberId,
							role,
						})),
					});
				}
			});

			return { success: true };
		}),

	/** Remove um membro de uma organização (admin ou proprietário dessa org). */
	removeMember: protectedProcedure
		.input(z.object({ memberId: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const member = await ctx.db.member.findUniqueOrThrow({
				where: { id: input.memberId },
			});

			await assertOrgOwnerOrAdmin(
				ctx.db,
				ctx.session.user.id,
				ctx.session.user.role,
				member.organizationId,
			);

			// Impedir que proprietário se remova da própria organização
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

	/** Lista todos os usuários disponíveis para adicionar (admin ou proprietário dessa org). */
	availableUsers: protectedProcedure
		.input(z.object({ organizationId: z.string() }))
		.query(async ({ ctx, input }) => {
			await assertOrgOwnerOrAdmin(
				ctx.db,
				ctx.session.user.id,
				ctx.session.user.role,
				input.organizationId,
			);

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

	/** Envia convite por email para uma organização (admin ou proprietário dessa org). */
	inviteMember: protectedProcedure
		.input(
			z.object({
				organizationId: z.string(),
				email: z.string().email("Email inválido"),
				role: z.enum(["owner", "admin", "member"]).default("member"),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			await assertOrgOwnerOrAdmin(
				ctx.db,
				ctx.session.user.id,
				ctx.session.user.role,
				input.organizationId,
			);

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

	/** Lista convites pendentes de uma organização (admin ou proprietário dessa org). */
	listInvitations: protectedProcedure
		.input(z.object({ organizationId: z.string() }))
		.query(async ({ ctx, input }) => {
			await assertOrgOwnerOrAdmin(
				ctx.db,
				ctx.session.user.id,
				ctx.session.user.role,
				input.organizationId,
			);

			return ctx.db.invitation.findMany({
				where: {
					organizationId: input.organizationId,
					status: "pending",
				},
				orderBy: { createdAt: "desc" },
			});
		}),

	/** Cancela um convite pendente (admin ou proprietário dessa org). */
	cancelInvitation: protectedProcedure
		.input(z.object({ invitationId: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const invitation = await ctx.db.invitation.findUnique({
				where: { id: input.invitationId },
			});

			if (!invitation || invitation.status !== "pending") {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Convite não encontrado ou já processado.",
				});
			}

			await assertOrgOwnerOrAdmin(
				ctx.db,
				ctx.session.user.id,
				ctx.session.user.role,
				invitation.organizationId,
			);

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

			// Se convidado como owner, transferir propriedade do atual owner
			if (invitation.role === "owner") {
				const currentOwner = await ctx.db.member.findFirst({
					where: {
						organizationId: invitation.organizationId,
						role: "owner",
					},
				});

				await ctx.db.$transaction(async (tx) => {
					if (currentOwner) {
						await tx.member.update({
							where: { id: currentOwner.id },
							data: { role: "admin" },
						});
					}
					await tx.member.create({
						data: {
							id: crypto.randomUUID(),
							userId: session.user.id,
							organizationId: invitation.organizationId,
							role: "owner",
						},
					});
					await tx.invitation.update({
						where: { id: input.invitationId },
						data: { status: "accepted" },
					});
				});
			} else {
				// Adiciona como membro (admin ou member) e marca convite como aceito
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
			}

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
