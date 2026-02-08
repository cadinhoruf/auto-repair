import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Novo Item",
	description: "Cadastrar item ou serviço no catálogo.",
};

export default function NovoItemLayout({
	children,
}: { children: React.ReactNode }) {
	return children;
}
