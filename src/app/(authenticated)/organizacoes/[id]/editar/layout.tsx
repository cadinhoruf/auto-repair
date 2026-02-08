import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Editar Organização",
	description: "Editar dados da organização.",
};

export default function EditarOrganizacaoLayout({
	children,
}: { children: React.ReactNode }) {
	return children;
}
