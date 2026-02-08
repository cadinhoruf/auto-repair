import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Novo Orçamento",
	description: "Criar novo orçamento em PDF.",
};

export default function NovoOrcamentoLayout({
	children,
}: { children: React.ReactNode }) {
	return children;
}
