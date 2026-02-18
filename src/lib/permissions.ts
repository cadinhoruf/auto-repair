import type { PrismaClient } from "../../generated/prisma/client";

const CASH_FLOW_ROLES = ["gerente", "financeiro"] as const;

/**
 * Retorna true se o usuário pode acessar o Fluxo de Caixa.
 * Admin tem acesso total; gerente e financeiro também.
 */
export async function canAccessCashFlow(
	db: PrismaClient,
	userId: string,
	userRole?: string | null,
): Promise<boolean> {
	if (userRole === "admin") return true;

	const roles = await db.userRole.findMany({
		where: { userId },
		select: { role: true },
	});
	const roleNames = roles.map((r) => r.role);
	return CASH_FLOW_ROLES.some((r) => roleNames.includes(r));
}
