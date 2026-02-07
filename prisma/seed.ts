/**
 * Seed script para criar a organização padrão e associar o primeiro admin.
 *
 * Uso:
 *   bun prisma/seed.ts
 *
 * Requisitos:
 *   - DATABASE_URL configurado no .env
 *   - Pelo menos 1 usuário admin existente no banco
 */

import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
	console.error("DATABASE_URL não está definida no .env");
	process.exit(1);
}

const db = new PrismaClient({
	adapter: new PrismaPg({ connectionString: DATABASE_URL }),
});

async function main() {
	const ORG_NAME = "Minha Oficina";
	const ORG_SLUG = "minha-oficina";

	// Verifica se já existe uma organização
	const existingOrg = await db.organization.findFirst();
	if (existingOrg) {
		console.log(`Organização já existe: "${existingOrg.name}" (${existingOrg.id})`);
		console.log("Seed ignorado.");
		return;
	}

	// Busca o primeiro admin
	const adminUser = await db.user.findFirst({
		where: { role: "admin" },
		orderBy: { createdAt: "asc" },
	});

	if (!adminUser) {
		console.error("Nenhum usuário admin encontrado. Crie um admin primeiro.");
		process.exit(1);
	}

	console.log(`Admin encontrado: ${adminUser.name} (${adminUser.email})`);

	// Cria a organização
	const orgId = crypto.randomUUID();
	const org = await db.organization.create({
		data: {
			id: orgId,
			name: ORG_NAME,
			slug: ORG_SLUG,
		},
	});
	console.log(`Organização criada: "${org.name}" (${org.id})`);

	// Adiciona o admin como owner
	await db.member.create({
		data: {
			id: crypto.randomUUID(),
			userId: adminUser.id,
			organizationId: org.id,
			role: "owner",
		},
	});
	console.log(`Admin "${adminUser.name}" adicionado como owner.`);

	// Atualiza sessões existentes para apontar para a org
	const updated = await db.session.updateMany({
		where: { userId: adminUser.id },
		data: { activeOrganizationId: org.id },
	});
	console.log(`${updated.count} sessão(ões) atualizada(s) com activeOrganizationId.`);

	// Adiciona todos os outros usuários existentes como membros
	const otherUsers = await db.user.findMany({
		where: { id: { not: adminUser.id } },
	});

	for (const user of otherUsers) {
		await db.member.create({
			data: {
				id: crypto.randomUUID(),
				userId: user.id,
				organizationId: org.id,
				role: "member",
			},
		});

		await db.session.updateMany({
			where: { userId: user.id },
			data: { activeOrganizationId: org.id },
		});

		console.log(`Usuário "${user.name}" adicionado como member.`);
	}

	console.log("\nSeed concluído com sucesso!");
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await db.$disconnect();
	});
