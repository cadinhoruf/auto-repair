import type { PrismaClient } from "../../generated/prisma/client";

/** Roles que permitem acesso ao Fluxo de Caixa (Member.role) */
const CASH_FLOW_MEMBER_ROLES = ["owner", "admin"] as const;

/** Roles extras que permitem acesso ao Fluxo de Caixa (MemberRole) */
const CASH_FLOW_EXTRA_ROLES = ["financeiro"] as const;

/**
 * Retorna true se o usuário é proprietário (owner) da organização.
 */
export async function isOrgOwner(
	db: PrismaClient,
	userId: string,
	organizationId: string,
): Promise<boolean> {
	const member = await db.member.findFirst({
		where: { userId, organizationId, role: "owner" },
	});
	return !!member;
}

/**
 * Retorna true se o usuário pode acessar o Fluxo de Caixa.
 * Admin global tem acesso; na org ativa: proprietário, gestor ou financeiro.
 */
export async function canAccessCashFlow(
	db: PrismaClient,
	userId: string,
	userRole: string | null | undefined,
	activeOrganizationId: string | null | undefined,
): Promise<boolean> {
	if (userRole === "admin") return true;
	if (!activeOrganizationId) return false;

	const member = await db.member.findFirst({
		where: { userId, organizationId: activeOrganizationId },
		include: { memberRoles: { select: { role: true } } },
	});

	if (!member) return false;
	if (CASH_FLOW_MEMBER_ROLES.includes(member.role as (typeof CASH_FLOW_MEMBER_ROLES)[number]))
		return true;

	const extraRoles = member.memberRoles.map((r) => r.role);
	return CASH_FLOW_EXTRA_ROLES.some((r) => extraRoles.includes(r));
}
