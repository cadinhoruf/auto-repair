import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Nova Organização",
	description: "Criar nova organização.",
};

export default function NovaOrganizacaoLayout({
	children,
}: { children: React.ReactNode }) {
	return children;
}
