import { z } from "zod";

// ── Login ──────────────────────────────────────────────
export const loginSchema = z.object({
	email: z.string().min(1, "E-mail é obrigatório").email("E-mail inválido"),
	password: z.string().min(1, "Senha é obrigatória"),
	rememberMe: z.boolean(),
});
export type LoginFormData = z.infer<typeof loginSchema>;

// ── Cliente ────────────────────────────────────────────
export const clientSchema = z.object({
	name: z.string().min(1, "Nome é obrigatório"),
	phone: z.string().min(1, "Telefone é obrigatório"),
	email: z.string().email("E-mail inválido").or(z.literal("")).optional(),
	document: z.string().optional(),
	notes: z.string().optional(),
});
export type ClientFormData = z.infer<typeof clientSchema>;

// ── Ordem de Serviço ───────────────────────────────────
export const serviceOrderSchema = z.object({
	clientId: z.string().min(1, "Selecione um cliente"),
	problemDescription: z.string().min(1, "Descrição do problema é obrigatória"),
	estimatedValue: z.string().optional(),
});
export type ServiceOrderFormData = z.infer<typeof serviceOrderSchema>;

// ── Usuário (criar) ───────────────────────────────────
export const createUserSchema = z.object({
	name: z.string().min(1, "Nome é obrigatório"),
	email: z.string().min(1, "E-mail é obrigatório").email("E-mail inválido"),
	password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
	role: z.enum(["user", "admin"]),
});
export type CreateUserFormData = z.infer<typeof createUserSchema>;

// ── Usuário (editar) ──────────────────────────────────
export const editUserSchema = z.object({
	name: z.string().min(1, "Nome é obrigatório"),
	email: z.string().min(1, "E-mail é obrigatório").email("E-mail inválido"),
	role: z.enum(["user", "admin"]),
});
export type EditUserFormData = z.infer<typeof editUserSchema>;

// ── Usuário (alterar senha) ───────────────────────────
export const changePasswordSchema = z.object({
	newPassword: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
});
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

// ── Catálogo (item / serviço) ─────────────────────────
export const serviceItemSchema = z.object({
	name: z.string().min(1, "Nome é obrigatório"),
	description: z.string().optional(),
	defaultPrice: z.string().optional(),
});
export type ServiceItemFormData = z.infer<typeof serviceItemSchema>;

// ── Caixa (movimentação) ──────────────────────────────
export const cashFlowSchema = z.object({
	type: z.enum(["IN", "OUT"]),
	description: z.string().min(1, "Descrição é obrigatória"),
	value: z.string().min(1, "Valor é obrigatório"),
	date: z.string().min(1, "Data é obrigatória"),
	serviceOrderId: z.string().optional(),
});
export type CashFlowFormData = z.infer<typeof cashFlowSchema>;

// ── Orçamento ─────────────────────────────────────────
export const budgetItemDraftSchema = z.object({
	serviceItemId: z.string().optional(),
	description: z.string().min(1, "Descrição é obrigatória"),
	quantity: z.coerce.number().int().positive("Quantidade deve ser positiva"),
	unitPrice: z.coerce.number().nonnegative("Preço deve ser >= 0"),
});

export const budgetSchema = z.object({
	clientId: z.string().min(1, "Selecione um cliente"),
	notes: z.string().optional(),
	serviceOrderId: z.string().optional(),
	items: z.array(budgetItemDraftSchema).min(1, "Adicione pelo menos um item"),
});
export type BudgetFormData = z.infer<typeof budgetSchema>;
export type BudgetItemDraft = z.infer<typeof budgetItemDraftSchema>;

// ── Organização ───────────────────────────────────────
export const organizationSchema = z.object({
	name: z.string().min(1, "Nome é obrigatório"),
	slug: z
		.string()
		.min(1, "Slug é obrigatório")
		.regex(
			/^[a-z0-9]+(?:-[a-z0-9]+)*$/,
			"Slug deve conter apenas letras minúsculas, números e hífens",
		),
});
export type OrganizationFormData = z.infer<typeof organizationSchema>;
