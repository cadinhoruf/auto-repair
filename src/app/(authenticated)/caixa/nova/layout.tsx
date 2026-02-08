import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Nova Movimentação",
	description: "Registrar entrada ou saída no fluxo de caixa.",
};

export default function NovaMovimentacaoLayout({
	children,
}: { children: React.ReactNode }) {
	return children;
}
