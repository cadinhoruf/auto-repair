import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Orçamentos",
	description: "Orçamentos em PDF para clientes.",
};

export default function OrcamentosLayout({
	children,
}: { children: React.ReactNode }) {
	return children;
}
