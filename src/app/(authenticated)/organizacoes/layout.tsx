import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Organizações",
	description: "Gestão de organizações e membros.",
};

export default function OrganizacoesLayout({
	children,
}: { children: React.ReactNode }) {
	return children;
}
