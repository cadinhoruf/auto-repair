import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { canAccessCashFlow } from "@/lib/permissions";
import { getSession } from "@/server/better-auth/server";
import { db } from "@/server/db";

export const metadata: Metadata = {
	title: "Fluxo de caixa",
	description: "Entradas e saídas financeiras da oficina.",
};

export default async function CaixaLayout({
	children,
}: { children: React.ReactNode }) {
	const session = await getSession();
	if (!session) redirect("/");

	const activeOrgId = (session.session as Record<string, unknown>)
		.activeOrganizationId as string | null | undefined;
	const allowed = await canAccessCashFlow(
		db,
		session.user.id,
		session.user.role,
		activeOrgId,
	);
	if (!allowed) redirect("/dashboard");

	return children;
}
