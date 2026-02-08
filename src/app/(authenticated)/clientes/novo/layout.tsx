import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Novo Cliente",
	description: "Cadastrar novo cliente.",
};

export default function NovoClienteLayout({
	children,
}: { children: React.ReactNode }) {
	return children;
}
