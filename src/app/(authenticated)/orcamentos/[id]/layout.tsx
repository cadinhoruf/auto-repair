import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Orçamento",
	description: "Detalhes do orçamento.",
};

export default function OrcamentoDetalheLayout({
	children,
}: { children: React.ReactNode }) {
	return children;
}
