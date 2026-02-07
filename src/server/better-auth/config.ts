import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin } from "better-auth/plugins";
import { organization } from "better-auth/plugins";

import { env } from "@/env";
import { db } from "@/server/db";

export const auth = betterAuth({
	database: prismaAdapter(db, {
		provider: "postgresql",
	}),
	emailAndPassword: {
		enabled: true,
	},
	plugins: [
		admin(),
		organization({
			// sendInvitationEmail é obrigatório para o fluxo de convites.
			// No estilo Dokploy, não enviamos email: o admin copia o link da UI.
			async sendInvitationEmail() {
				// no-op: o link é gerado e exibido na interface
			},
		}),
	],
	databaseHooks: {
		session: {
			create: {
				before: async (session) => {
					// Auto-set activeOrganizationId on login
					const membership = await db.member.findFirst({
						where: { userId: session.userId },
						select: { organizationId: true },
						orderBy: { createdAt: "asc" },
					});

					if (membership) {
						return {
							data: {
								...session,
								activeOrganizationId: membership.organizationId,
							},
						};
					}

					return { data: session };
				},
			},
		},
	},
});

export type Session = typeof auth.$Infer.Session;
