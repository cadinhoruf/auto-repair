import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Catálogo",
	description: "Itens e serviços cadastrados para orçamentos.",
};

export default function CatalogoLayout({
	children,
}: { children: React.ReactNode }) {
	return children;
}
