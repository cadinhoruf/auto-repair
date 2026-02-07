/**
 * Seed/utility para criar um usuário admin + organização padrão usando Better Auth.
 *
 * Uso via ENV (recomendado):
 * - ADMIN_EMAIL="admin@exemplo.com"
 * - ADMIN_PASSWORD="uma-senha-forte"
 * - ADMIN_NAME="Admin" (opcional)
 * - ADMIN_VERIFY_EMAIL="true" (opcional, default: true)
 * - ORG_NAME="Minha Oficina" (opcional, default: "Oficina")
 * - ORG_SLUG="minha-oficina" (opcional, gerado a partir do nome)
 *
 * Uso via args:
 * bun scripts/initialize-admin-user.ts -- --email admin@exemplo.com --password "senha" --name "Admin" --org-name "Minha Oficina"
 */

import "dotenv/config";

import { auth } from "@/server/better-auth";
import { db } from "@/server/db";

function getArg(name: string) {
	const idx = process.argv.indexOf(name);
	if (idx === -1) return undefined;
	return process.argv[idx + 1];
}

function parseBoolean(value: string | undefined, fallback: boolean) {
	if (value == null) return fallback;
	return (
		value === "1" || value.toLowerCase() === "true" || value.toLowerCase() === "yes"
	);
}

function slugify(text: string): string {
	return text
		.toLowerCase()
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

async function initializeAdminUser() {
	const email = getArg("--email") ?? process.env.ADMIN_EMAIL;
	const password = getArg("--password") ?? process.env.ADMIN_PASSWORD;
	const name = getArg("--name") ?? process.env.ADMIN_NAME ?? "Admin";
	const verifyEmail = parseBoolean(
		getArg("--verify-email") ?? process.env.ADMIN_VERIFY_EMAIL,
		true,
	);
	const orgName = getArg("--org-name") ?? process.env.ORG_NAME ?? "Oficina";
	const orgSlug = getArg("--org-slug") ?? process.env.ORG_SLUG ?? slugify(orgName);

	if (!email || !password) {
		throw new Error(
			"Faltando ADMIN_EMAIL/ADMIN_PASSWORD (ou --email/--password).",
		);
	}

	// ── 1. Criar ou reutilizar o usuário admin ──────────

	let userId: string;

	const existing = await db.user.findFirst({ where: { email } });
	if (existing) {
		console.log(`Usuário já existe: ${email} (id=${existing.id})`);
		userId = existing.id;

		// Garante que o papel é admin
		if (existing.role !== "admin") {
			await db.user.update({
				where: { id: userId },
				data: { role: "admin" },
			});
			console.log("  → Papel atualizado para admin.");
		}
	} else {
		console.log(`Criando usuário admin: ${email}...`);

		const result = await auth.api.signUpEmail({
			body: { email, password, name },
		});

		if (!result?.user?.id) {
			throw new Error("Falha ao criar usuário (signUpEmail não retornou user).");
		}

		userId = result.user.id;

		// Marca e-mail como verificado + papel admin
		await db.user.update({
			where: { id: userId },
			data: {
				emailVerified: verifyEmail,
				role: "admin",
			},
		});

		console.log(
			`  → Admin criado: ${result.user.email} (emailVerified=${verifyEmail})`,
		);
	}

	// ── 2. Criar ou reutilizar a organização ────────────

	let orgId: string;

	const existingOrg = await db.organization.findFirst({
		where: { slug: orgSlug },
	});

	if (existingOrg) {
		console.log(`Organização já existe: "${existingOrg.name}" (slug=${existingOrg.slug})`);
		orgId = existingOrg.id;
	} else {
		console.log(`Criando organização: "${orgName}" (slug=${orgSlug})...`);

		const org = await db.organization.create({
			data: {
				id: crypto.randomUUID(),
				name: orgName,
				slug: orgSlug,
			},
		});

		orgId = org.id;
		console.log(`  → Organização criada (id=${orgId})`);
	}

	// ── 3. Associar admin como owner da organização ─────

	const existingMembership = await db.member.findFirst({
		where: { userId, organizationId: orgId },
	});

	if (existingMembership) {
		console.log(`Membro já associado à organização (role=${existingMembership.role}).`);

		if (existingMembership.role !== "owner") {
			await db.member.update({
				where: { id: existingMembership.id },
				data: { role: "owner" },
			});
			console.log("  → Papel de membro atualizado para owner.");
		}
	} else {
		await db.member.create({
			data: {
				id: crypto.randomUUID(),
				userId,
				organizationId: orgId,
				role: "owner",
			},
		});
		console.log("  → Admin adicionado como owner da organização.");
	}

	// ── 4. Atualizar sessões existentes ─────────────────

	const updatedSessions = await db.session.updateMany({
		where: {
			userId,
			activeOrganizationId: null,
		},
		data: {
			activeOrganizationId: orgId,
		},
	});

	if (updatedSessions.count > 0) {
		console.log(`  → ${updatedSessions.count} sessão(ões) atualizada(s) com organização ativa.`);
	}

	console.log("\n✅ Inicialização concluída com sucesso!");
	console.log(`   Usuário: ${email}`);
	console.log(`   Organização: ${orgName} (${orgSlug})`);
}

initializeAdminUser().catch((err) => {
	console.error("Erro ao inicializar admin:", err);
	process.exitCode = 1;
});
