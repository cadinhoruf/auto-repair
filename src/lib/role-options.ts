/**
 * Opções de roles padronizadas para o sistema.
 * Usuário fora da org: user | admin
 * Usuário dentro da org: proprietário, gestor, colaborador, financeiro
 */

/** Perfil global (fora da org) */
export const USER_ROLE_OPTIONS: { value: string; label: string }[] = [
	{ value: "user", label: "Usuário" },
	{ value: "admin", label: "Administrador" },
];

/** Roles na organização (Better Auth: owner, admin, member) */
export const ORG_MEMBER_ROLE_OPTIONS: { value: string; label: string }[] = [
	{ value: "owner", label: "Proprietário" },
	{ value: "admin", label: "Gestor" },
	{ value: "member", label: "Colaborador" },
];

/** Roles adicionais na org (MemberRole - múltiplos) */
export const ORG_EXTRA_ROLE_OPTIONS: { value: string; label: string }[] = [
	{ value: "financeiro", label: "Financeiro" },
];
