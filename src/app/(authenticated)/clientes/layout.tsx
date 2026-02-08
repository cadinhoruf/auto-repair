import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Clientes",
	description: "Cadastro e gestão de clientes da oficina.",
};

export default function ClientesLayout({
	children,
}: { children: React.ReactNode }) {
	return children;
}
