import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Editar Item",
	description: "Editar item ou serviço do catálogo.",
};

export default function EditarItemLayout({
	children,
}: { children: React.ReactNode }) {
	return children;
}
