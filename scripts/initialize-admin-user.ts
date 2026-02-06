/**
 * Seed/utility para criar um usuário admin usando Better Auth (e-mail + senha).
 *
 * Uso via ENV (recomendado):
 * - ADMIN_EMAIL="admin@exemplo.com"
 * - ADMIN_PASSWORD="uma-senha-forte"
 * - ADMIN_NAME="Admin" (opcional)
 * - ADMIN_VERIFY_EMAIL="true" (opcional, default: true)
 *
 * Uso via args:
 * bun scripts/initialize-admin-user.ts -- --email admin@exemplo.com --password "senha" --name "Admin"
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

async function initializeAdminUser() {
	const email = getArg("--email") ?? process.env.ADMIN_EMAIL;
	const password = getArg("--password") ?? process.env.ADMIN_PASSWORD;
	const name = getArg("--name") ?? process.env.ADMIN_NAME ?? "Admin";
	const verifyEmail = parseBoolean(
		getArg("--verify-email") ?? process.env.ADMIN_VERIFY_EMAIL,
		true,
	);

	if (!email || !password) {
		throw new Error(
			"Faltando ADMIN_EMAIL/ADMIN_PASSWORD (ou --email/--password).",
		);
	}

	const existing = await db.user.findFirst({ where: { email } });
	if (existing) {
		console.log(`Usuário já existe: ${email}`);
		return;
	}

	console.log(`Criando usuário admin: ${email}...`);

	const result = await auth.api.signUpEmail({
		body: {
			email,
			password,
			name,
		},
	});

	if (!result?.user?.id) {
		throw new Error("Falha ao criar usuário (signUpEmail não retornou user).");
	}

	if (verifyEmail) {
		await db.user.update({
			where: { id: result.user.id },
			data: { emailVerified: true },
		});
	}

	console.log(
		`Admin criado com sucesso: ${result.user.email} (emailVerified=${verifyEmail})`,
	);
}

initializeAdminUser().catch((err) => {
	console.error("Erro ao criar admin:", err);
	process.exitCode = 1;
});
