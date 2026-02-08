import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Cliente",
	description: "Dados e histórico do cliente.",
};

export default function ClienteDetalheLayout({
	children,
}: { children: React.ReactNode }) {
	return children;
}
