import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Fluxo de caixa",
	description: "Entradas e saídas financeiras da oficina.",
};

export default function CaixaLayout({
	children,
}: { children: React.ReactNode }) {
	return children;
}
